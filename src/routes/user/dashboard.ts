// GET /api/user/dashboard

import { Request, Response } from "express";
import Level from "../../models/Level";
import User from "../../models/User";
import {
  getOrCreateProgress,
  getActiveMissionId,
  resolveStoredStatus,
} from "../../services/progressService";
import { toLocalDateString, computeLiveStreak } from "../../utils/dateUtils";
import { sendOk, sendServerError } from "../../utils/response";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function buildStreakDays(
  activityLog: Map<string, number> | Record<string, number>,
  lastActiveDate: string | null,
  currentStreak: number,
): { day: string; completed: boolean }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let logObj: Record<string, number> = {};
  if (activityLog instanceof Map) {
    for (const [k, v] of activityLog.entries()) logObj[k] = v;
  } else if (activityLog && typeof activityLog === "object") {
    logObj = activityLog as Record<string, number>;
  }

  const streakActiveDates = new Set<string>();
  if (lastActiveDate && currentStreak > 0) {
    const last = new Date(lastActiveDate);
    for (let i = 0; i < currentStreak; i++) {
      const d = new Date(last.getTime() - i * 86400000);
      streakActiveDates.add(toLocalDateString(d));
    }
  }

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = toLocalDateString(d);
    result.push({
      day: DAY_LABELS[d.getDay()],
      completed: (logObj[dateStr] ?? 0) > 0 || streakActiveDates.has(dateStr),
    });
  }
  return result;
}

type NextMission = {
  levelId: number;
  levelSlug: string;
  levelTitle: string;
  levelPlan: "pro" | "team";
  missionId: string;
  missionLabel: string;
  title: string;
  analogy: string;
  levelProgress: number;
} | null;

function findNextMission(
  levels: any[],
  progress: any,
  requiresEngagement = false,
): NextMission {
  let totalCount = 0;
  let completedCount = 0;

  for (const level of levels) {
    const published = level.missions.filter((m: any) => m.isPublished);
    totalCount += published.length;
    for (const m of published) {
      const raw = progress.missionProgress.get(m.missionId)?.status;
      if (resolveStoredStatus(raw) === "completed") completedCount++;
    }
  }

  if (requiresEngagement && completedCount === 0) return null;
  if (totalCount > 0 && completedCount === totalCount) return null;

  for (const level of levels) {
    const sorted = level.missions
      .filter((m: any) => m.isPublished)
      .sort((a: any, b: any) => a.order - b.order);

    if (!sorted.length) continue;

    const sortedIds = sorted.map((m: any) => m.missionId);
    const activeMissionId = getActiveMissionId(
      sortedIds,
      progress.missionProgress,
    );

    if (!activeMissionId) continue;

    const activeMission = sorted.find(
      (m: any) => m.missionId === activeMissionId,
    );
    if (!activeMission) continue;

    const completedInLevel = sorted.filter((m: any) => {
      const raw = progress.missionProgress.get(m.missionId)?.status;
      return resolveStoredStatus(raw) === "completed";
    }).length;

    return {
      levelId: level.levelId,
      levelSlug: level.slug,
      levelTitle: level.title,
      levelPlan: (level.plan ?? "pro") as "pro" | "team",
      missionId: activeMissionId,
      missionLabel: activeMission.label,
      title: activeMission.title,
      analogy: activeMission.analogy,
      levelProgress:
        sorted.length > 0
          ? Math.round((completedInLevel / sorted.length) * 100)
          : 0,
    };
  }

  return null;
}

function getDailyAnalogy(levels: any[]): { topic: string; content: string } {
  const fallback = {
    topic: "The Web",
    content:
      "The internet is a giant postal system. Your browser is the mailman, URLs are addresses, and servers are the buildings that hold what you ordered.",
  };

  const firstLevel = levels[0];
  if (!firstLevel?.missions?.length) return fallback;

  const published = firstLevel.missions.filter((m: any) => m.isPublished);
  if (!published.length) return fallback;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );

  const mission = published[dayOfYear % published.length];
  return {
    topic: mission.subtitle ?? mission.title,
    content: mission.analogy,
  };
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dbUser = (await User.findById(req.user!.id)
      .select("firstName lastName username subscription")
      .lean()) as any;

    if (!dbUser) {
      sendServerError(res, "User not found.");
      return;
    }

    const primaryPlan = (dbUser.subscription?.plan ?? "pro") as "pro" | "team";
    const rawUnlocked = dbUser.subscription?.unlockedPlans ?? [];
    const unlockedPlans: ("pro" | "team")[] =
      rawUnlocked.length > 0 ? rawUnlocked : [primaryPlan];

    const hasMultiplePlans =
      unlockedPlans.includes("pro") && unlockedPlans.includes("team");
    const secondaryPlan: "pro" | "team" =
      primaryPlan === "pro" ? "team" : "pro";

    const [primaryLevels, secondaryLevels, progress] = await Promise.all([
      Level.find({ isPublished: true, plan: primaryPlan })
        .sort({ order: 1 })
        .select(
          "levelId slug title vibeName icon color plan missions.missionId missions.label missions.title missions.subtitle missions.analogy missions.isPublished missions.order",
        )
        .lean(),
      hasMultiplePlans
        ? Level.find({ isPublished: true, plan: secondaryPlan })
            .sort({ order: 1 })
            .select(
              "levelId slug title vibeName icon color plan missions.missionId missions.label missions.title missions.subtitle missions.analogy missions.isPublished missions.order",
            )
            .lean()
        : Promise.resolve([]),
      getOrCreateProgress(req.user!.id, unlockedPlans),
    ]);

    const primaryNextMission = findNextMission(primaryLevels, progress, false);
    const secondaryNextMission = hasMultiplePlans
      ? findNextMission(secondaryLevels, progress, true)
      : null;

    const allLevels = [...primaryLevels, ...secondaryLevels];
    const completedWithTime: any[] = [];

    for (const level of allLevels) {
      for (const m of level.missions) {
        const state = progress.missionProgress.get(m.missionId);
        if (
          resolveStoredStatus(state?.status) === "completed" &&
          state?.completedAt
        ) {
          completedWithTime.push({
            missionLabel: m.label,
            missionTitle: m.title,
            levelTitle: level.title,
            levelSlug: level.slug,
            levelPlan: (level.plan ?? "pro") as "pro" | "team",
            missionId: m.missionId,
            completedAt: state.completedAt,
          });
        }
      }
    }

    const recentActivity = completedWithTime
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 3)
      .map(({ completedAt: _ts, ...rest }) => rest);

    const currentLevelIndex = primaryLevels.findIndex(
      (l: any) => (progress.levelStatus.get(l.slug) ?? "locked") === "current",
    );

    const liveStreak = computeLiveStreak(
      progress.currentStreak,
      progress.lastActiveDate,
    );

    const totalCompletedMissions = [
      ...progress.missionProgress.values(),
    ].filter((s) => resolveStoredStatus(s.status) === "completed").length;

    const planSummary = unlockedPlans.map((plan) => {
      const planLevels = plan === primaryPlan ? primaryLevels : secondaryLevels;
      const total = planLevels.reduce(
        (sum: number, l: any) =>
          sum + l.missions.filter((m: any) => m.isPublished).length,
        0,
      );
      const completed = planLevels.reduce((sum: number, l: any) => {
        return (
          sum +
          l.missions.filter(
            (m: any) =>
              m.isPublished &&
              resolveStoredStatus(
                progress.missionProgress.get(m.missionId)?.status,
              ) === "completed",
          ).length
        );
      }, 0);

      return {
        plan,
        label: plan === "pro" ? "Foundation" : "Mastery",
        totalMissions: total,
        completedMissions: completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        currentLevelIndex:
          plan === primaryPlan
            ? Math.max(0, currentLevelIndex)
            : planLevels.findIndex(
                (l: any) =>
                  (progress.levelStatus.get(l.slug) ?? "locked") === "current",
              ),
      };
    });

    sendOk(res, {
      user: {
        name: dbUser.firstName
          ? `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim()
          : dbUser.username,
        vibeScore: progress.vibeScore,
        streakCount: liveStreak,
        missionsCompleted: totalCompletedMissions,
        reflectionsCount: totalCompletedMissions,
        currentLevelIndex: Math.max(0, currentLevelIndex),
        primaryPlan,
        unlockedPlans,
        hasMultiplePlans,
      },
      nextMission: primaryNextMission,
      secondaryNextMission,
      streakDays: buildStreakDays(
        progress.activityLog,
        progress.lastActiveDate,
        progress.currentStreak,
      ),
      recentActivity,
      dailyAnalogy: getDailyAnalogy(primaryLevels),
      planSummary,
    });
  } catch (err) {
    sendServerError(res, "Failed to load dashboard.", err);
  }
}
