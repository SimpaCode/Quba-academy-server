// src/services/progressService.ts
// Direct port from Next.js services/progressService.ts
// The only change: imports come from local paths, not @/ aliases.

import mongoose from "mongoose";
import UserProgress, {
  IMissionProgress,
  IUserProgress,
  LevelStatus,
  MissionStatus,
} from "../models/UserProgress";
import Level from "../models/Level";
import { todayString, yesterdayString } from "../utils/dateUtils";

export type DisplayMissionStatus = "not_started" | "active" | "completed";

// ── Runtime shim ──────────────────────────────────────────────

export function resolveStoredStatus(raw: string | undefined): MissionStatus {
  if (raw === "completed") return "completed";
  return "not_started";
}

export function toDisplayStatus(
  stored: MissionStatus,
  isActive: boolean,
): DisplayMissionStatus {
  if (stored === "completed") return "completed";
  if (isActive) return "active";
  return "not_started";
}

export function getActiveMissionId(
  sortedMissionIds: string[],
  missionProgress: Map<string, IMissionProgress>,
): string | null {
  for (const id of sortedMissionIds) {
    const raw = missionProgress.get(id)?.status;
    if (resolveStoredStatus(raw) === "not_started") return id;
  }
  return null;
}

// ── Achievement rules ─────────────────────────────────────────

const ACHIEVEMENT_RULES: {
  id: string;
  check: (
    progress: IUserProgress,
    completedCount: number,
    streak: number,
  ) => boolean;
}[] = [
  { id: "first-mission", check: (_, n) => n >= 1 },
  { id: "five-missions", check: (_, n) => n >= 5 },
  {
    id: "first-level",
    check: (p) => [...p.levelStatus.values()].includes("completed"),
  },
  { id: "streak-3", check: (_, _n, s) => s >= 3 },
  { id: "streak-7", check: (_, _n, s) => s >= 7 },
  {
    id: "two-levels",
    check: (p) =>
      [...p.levelStatus.values()].filter((s) => s === "completed").length >= 2,
  },
  { id: "ten-missions", check: (_, n) => n >= 10 },
  {
    id: "all-levels",
    check: (p) =>
      [...p.levelStatus.values()].length > 0 &&
      [...p.levelStatus.values()].every((s) => s === "completed"),
  },
];

// ── Streak ────────────────────────────────────────────────────

function computeNewStreak(progress: IUserProgress): number {
  const today = todayString();
  const yesterday = yesterdayString();
  const last = progress.lastActiveDate;
  if (!last) return 1;
  if (last === today) return progress.currentStreak;
  if (last === yesterday) return progress.currentStreak + 1;
  return 1;
}

function computeVibeScore(
  completedCount: number,
  streak: number,
  completedLevels: number,
): number {
  const base = Math.min(completedCount * 4, 60);
  const streakBonus = Math.min(streak * 2, 20);
  const levelBonus = completedLevels * 5;
  return Math.min(base + streakBonus + levelBonus, 100);
}

// ── getOrCreateProgress ───────────────────────────────────────

export async function getOrCreateProgress(
  userId: string,
  unlockedPlans?: ("pro" | "team")[],
): Promise<IUserProgress> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const existing = await UserProgress.findOne({ userId: userObjectId });
  if (existing) return existing;

  const planFilter =
    unlockedPlans && unlockedPlans.length > 0
      ? { plan: { $in: unlockedPlans } }
      : {};

  const levels = await Level.find({ isPublished: true, ...planFilter }).sort({
    order: 1,
  });

  const missionProgress = new Map<string, IMissionProgress>();
  const levelStatus = new Map<string, LevelStatus>();

  if (unlockedPlans && unlockedPlans.length > 0) {
    const firstLevelPerPlan = new Map<string, boolean>();
    for (const level of levels) {
      const levelPlan = (level as any).plan ?? "pro";
      const isFirstForPlan = !firstLevelPerPlan.has(levelPlan);
      if (isFirstForPlan) {
        firstLevelPerPlan.set(levelPlan, true);
        levelStatus.set(level.slug, "current");
      } else {
        levelStatus.set(level.slug, "locked");
      }
      const published = level.missions
        .filter((m) => m.isPublished)
        .sort((a, b) => a.order - b.order);
      for (const mission of published) {
        missionProgress.set(mission.missionId, { status: "not_started" });
      }
    }
  } else {
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      levelStatus.set(level.slug, i === 0 ? "current" : "locked");
      const published = level.missions
        .filter((m) => m.isPublished)
        .sort((a, b) => a.order - b.order);
      for (const mission of published) {
        missionProgress.set(mission.missionId, { status: "not_started" });
      }
    }
  }

  return UserProgress.create({
    userId: new mongoose.Types.ObjectId(userId),
    missionProgress,
    levelStatus,
  });
}

// ── seedNewPlanAccess ─────────────────────────────────────────

export async function seedNewPlanAccess(
  userId: string,
  newPlan: "pro" | "team",
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const progress = await UserProgress.findOne({ userId: userObjectId });

  if (!progress) {
    await getOrCreateProgress(userId, [newPlan]);
    return;
  }

  const levels = await Level.find({ isPublished: true, plan: newPlan }).sort({
    order: 1,
  });

  if (levels.length === 0) return;

  let hasCurrentInPlan = false;
  for (const level of levels) {
    if (progress.levelStatus.get(level.slug) === "current") {
      hasCurrentInPlan = true;
      break;
    }
  }

  let assignedCurrent = hasCurrentInPlan;

  for (const level of levels) {
    const existingLevelStatus = progress.levelStatus.get(level.slug);
    const published = level.missions
      .filter((m) => m.isPublished)
      .sort((a, b) => a.order - b.order);

    if (!existingLevelStatus) {
      const isCurrent = !assignedCurrent;
      progress.levelStatus.set(level.slug, isCurrent ? "current" : "locked");
      for (const mission of published) {
        if (!progress.missionProgress.has(mission.missionId)) {
          progress.missionProgress.set(mission.missionId, {
            status: "not_started",
          });
        }
      }
      if (isCurrent) assignedCurrent = true;
    } else if (!assignedCurrent && existingLevelStatus === "locked") {
      progress.levelStatus.set(level.slug, "current");
      for (const mission of published) {
        if (!progress.missionProgress.has(mission.missionId)) {
          progress.missionProgress.set(mission.missionId, {
            status: "not_started",
          });
        }
      }
      assignedCurrent = true;
    } else {
      for (const mission of published) {
        if (!progress.missionProgress.has(mission.missionId)) {
          progress.missionProgress.set(mission.missionId, {
            status: "not_started",
          });
        }
      }
    }
  }

  progress.markModified("missionProgress");
  progress.markModified("levelStatus");
  await progress.save();
}

// ── completeMission ───────────────────────────────────────────

export interface CompleteMissionResult {
  nextMissionId: string | null;
  levelCompleted: boolean;
  nextLevelSlug: string | null;
  newAchievements: string[];
  vibeScore: number;
  currentStreak: number;
}

export async function completeMission(
  userId: string,
  levelSlug: string,
  missionId: string,
): Promise<CompleteMissionResult> {
  const [progress, level] = await Promise.all([
    getOrCreateProgress(userId),
    Level.findOne({ slug: levelSlug, isPublished: true }),
  ]);

  if (!level) throw new Error("Level not found");

  const rawState = progress.missionProgress.get(missionId);
  const currentStatus = resolveStoredStatus(rawState?.status);

  if (currentStatus === "completed") {
    return {
      nextMissionId: null,
      levelCompleted: false,
      nextLevelSlug: null,
      newAchievements: [],
      vibeScore: progress.vibeScore,
      currentStreak: progress.currentStreak,
    };
  }

  progress.missionProgress.set(missionId, {
    status: "completed",
    completedAt: new Date(),
  });

  const sortedMissions = level.missions
    .filter((m) => m.isPublished)
    .sort((a, b) => a.order - b.order);

  const currentIdx = sortedMissions.findIndex((m) => m.missionId === missionId);
  const nextMission = sortedMissions[currentIdx + 1] ?? null;

  if (nextMission) {
    const nextRaw = progress.missionProgress.get(nextMission.missionId);
    if (resolveStoredStatus(nextRaw?.status) !== "completed") {
      progress.missionProgress.set(nextMission.missionId, {
        status: "not_started",
      });
    }
  }

  const allMissionIds = sortedMissions.map((m) => m.missionId);
  const levelCompleted = allMissionIds.every(
    (id) =>
      resolveStoredStatus(progress.missionProgress.get(id)?.status) ===
      "completed",
  );

  let nextLevelSlug: string | null = null;

  if (levelCompleted) {
    progress.levelStatus.set(levelSlug, "completed");

    const levelPlan = (level as any).plan ?? "pro";
    const samePlanLevels = await Level.find({
      isPublished: true,
      plan: levelPlan,
    }).sort({ order: 1 });

    const currentLevelIdx = samePlanLevels.findIndex(
      (l) => l.slug === levelSlug,
    );
    const nextLevel = samePlanLevels[currentLevelIdx + 1] ?? null;

    if (nextLevel) {
      nextLevelSlug = nextLevel.slug;
      const existingStatus = progress.levelStatus.get(nextLevel.slug);
      if (!existingStatus || existingStatus === "locked") {
        progress.levelStatus.set(nextLevel.slug, "current");
      }
      const nextLevelMissions = nextLevel.missions
        .filter((m) => m.isPublished)
        .sort((a, b) => a.order - b.order);
      for (const mission of nextLevelMissions) {
        if (!progress.missionProgress.has(mission.missionId)) {
          progress.missionProgress.set(mission.missionId, {
            status: "not_started",
          });
        }
      }
    }
  }

  const today = todayString();
  const newStreak = computeNewStreak(progress);
  progress.currentStreak = newStreak;
  progress.longestStreak = Math.max(progress.longestStreak, newStreak);
  progress.lastActiveDate = today;

  const todayCount = progress.activityLog.get(today) ?? 0;
  progress.activityLog.set(today, todayCount + 1);

  let completedCount = 0;
  for (const state of progress.missionProgress.values()) {
    if (resolveStoredStatus(state.status) === "completed") completedCount++;
  }

  const completedLevelCount = [...progress.levelStatus.values()].filter(
    (s) => s === "completed",
  ).length;

  progress.vibeScore = computeVibeScore(
    completedCount,
    newStreak,
    completedLevelCount,
  );

  const existingIds = new Set(progress.achievements.map((a) => a.id));
  const newAchievements: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (
      !existingIds.has(rule.id) &&
      rule.check(progress, completedCount, newStreak)
    ) {
      progress.achievements.push({ id: rule.id, earnedAt: new Date() });
      newAchievements.push(rule.id);
    }
  }

  progress.markModified("missionProgress");
  progress.markModified("levelStatus");
  progress.markModified("activityLog");
  await progress.save();

  return {
    nextMissionId: nextMission?.missionId ?? null,
    levelCompleted,
    nextLevelSlug,
    newAchievements,
    vibeScore: progress.vibeScore,
    currentStreak: newStreak,
  };
}

export async function resetProgress(userId: string): Promise<void> {
  await UserProgress.deleteOne({
    userId: new mongoose.Types.ObjectId(userId),
  });
  await getOrCreateProgress(userId);
}
