// GET /api/user/progress?plan=pro|team

import { Request, Response } from "express";
import Level from "../../models/Level";
import User from "../../models/User";
import {
  getOrCreateProgress,
  getActiveMissionId,
  toDisplayStatus,
  resolveStoredStatus,
} from "../../services/progressService";
import { computeLiveStreak } from "../../utils/dateUtils";
import { sendOk, sendBadRequest, sendServerError } from "../../utils/response";

const ACHIEVEMENTS = [
  {
    id: "first-mission",
    icon: "🚀",
    title: "First Step",
    description: "Complete your very first mission",
  },
  {
    id: "five-missions",
    icon: "🔥",
    title: "On a Roll",
    description: "Complete 5 missions",
  },
  {
    id: "first-level",
    icon: "🏆",
    title: "Level Clear",
    description: "Complete an entire level",
  },
  {
    id: "streak-3",
    icon: "⚡",
    title: "Momentum",
    description: "Maintain a 3-day learning streak",
  },
  {
    id: "streak-7",
    icon: "💎",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
  },
  {
    id: "two-levels",
    icon: "🌟",
    title: "Stacking Wins",
    description: "Complete 2 full levels",
  },
  {
    id: "ten-missions",
    icon: "🧠",
    title: "Deep Thinker",
    description: "Complete 10 missions",
  },
  {
    id: "all-levels",
    icon: "👑",
    title: "The Creator",
    description: "Complete every level in the academy",
  },
] as const;

function buildActivityDays(
  activityLog: Map<string, number> | Record<string, number>,
): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const getCount = (dateStr: string): number => {
    if (activityLog instanceof Map) return activityLog.get(dateStr) ?? 0;
    return (activityLog as Record<string, number>)[dateStr] ?? 0;
  };
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, count: Math.min(getCount(dateStr), 4) });
  }
  return days;
}

function deriveSkills(levelProgress: any[]) {
  return levelProgress
    .filter((l) => l.totalMissions > 0)
    .map((l) => ({
      label: l.title,
      icon: l.icon,
      completedMissions: l.completedMissions,
      totalMissions: l.totalMissions,
      percent:
        l.totalMissions > 0
          ? Math.round((l.completedMissions / l.totalMissions) * 100)
          : 0,
    }));
}

function resolveUnlockedPlans(subscription: {
  plan: string;
  unlockedPlans?: string[];
}): ("pro" | "team")[] {
  const unlocked = subscription.unlockedPlans ?? [];
  if (unlocked.length > 0) return unlocked as ("pro" | "team")[];
  const p = subscription.plan;
  if (p === "pro" || p === "team") return [p];
  return [];
}

export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const planParam = req.query.plan as "pro" | "team" | undefined;
    const isAdmin = ["admin", "super_admin"].includes(req.user!.role);

    const targetUserId = !isAdmin
      ? req.user!.id
      : ((req.query.userId as string) ?? req.user!.id);

    const requestingUser = (await User.findById(req.user!.id)
      .select("subscription role")
      .lean()) as any;

    if (!requestingUser) {
      sendServerError(res, "User not found.");
      return;
    }

    const unlockedPlans = isAdmin
      ? (["pro", "team"] as ("pro" | "team")[])
      : resolveUnlockedPlans(requestingUser.subscription);

    const primaryPlan = (
      requestingUser.subscription.plan === "team" ? "team" : "pro"
    ) as "pro" | "team";

    if (!isAdmin && (!planParam || !["pro", "team"].includes(planParam))) {
      sendBadRequest(
        res,
        "plan query param is required. Use ?plan=pro or ?plan=team",
      );
      return;
    }

    if (!isAdmin && planParam && !unlockedPlans.includes(planParam)) {
      sendBadRequest(res, `You don't have access to ${planParam} content.`);
      return;
    }

    const effectivePlan = (planParam ?? primaryPlan) as "pro" | "team";

    const [levels, progress] = await Promise.all([
      Level.find({ isPublished: true, plan: effectivePlan })
        .sort({ order: 1 })
        .lean(),
      getOrCreateProgress(targetUserId, unlockedPlans),
    ]);

    const levelProgress = levels.map((level: any) => {
      const levelStatus = progress.levelStatus.get(level.slug) ?? "locked";
      const published = level.missions
        .filter((m: any) => m.isPublished)
        .sort((a: any, b: any) => a.order - b.order);

      const completedCount = published.filter(
        (m: any) =>
          resolveStoredStatus(
            progress.missionProgress.get(m.missionId)?.status,
          ) === "completed",
      ).length;

      const total = published.length;
      const sortedIds = published.map((m: any) => m.missionId);
      const activeMissionId = getActiveMissionId(
        sortedIds,
        progress.missionProgress,
      );

      return {
        id: level.levelId,
        slug: level.slug,
        title: level.title,
        vibeName: level.vibeName,
        icon: level.icon,
        color: level.color,
        plan: level.plan ?? "pro",
        status: levelStatus,
        completedMissions: completedCount,
        totalMissions: total,
        percent: total > 0 ? Math.round((completedCount / total) * 100) : 0,
        missions: published.map((m: any) => {
          const raw = progress.missionProgress.get(m.missionId)?.status;
          const stored = resolveStoredStatus(raw);
          return {
            id: m.missionId,
            label: m.label,
            title: m.title,
            status: toDisplayStatus(stored, m.missionId === activeMissionId),
          };
        }),
      };
    });

    const totalMissions = levelProgress.reduce(
      (a, l) => a + l.totalMissions,
      0,
    );
    const completedMissions = levelProgress.reduce(
      (a, l) => a + l.completedMissions,
      0,
    );
    const overallPercent =
      totalMissions > 0
        ? Math.round((completedMissions / totalMissions) * 100)
        : 0;

    const totalLevels = levelProgress.length;
    const completedLevels = levelProgress.filter(
      (l) => l.status === "completed",
    ).length;
    const levelsCompletedPercent =
      totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

    const earnedMap = new Map(
      progress.achievements.map((a) => [a.id, a.earnedAt]),
    );
    const achievements = ACHIEVEMENTS.map((def) => {
      const earnedAt = earnedMap.get(def.id);
      return {
        id: def.id,
        icon: def.icon,
        title: def.title,
        description: def.description,
        unlocked: !!earnedAt,
        earnedAt: earnedAt ? earnedAt.toISOString() : null,
      };
    });

    const skills = deriveSkills(levelProgress);
    const activity = buildActivityDays(progress.activityLog);
    const liveStreak = computeLiveStreak(
      progress.currentStreak,
      progress.lastActiveDate,
    );

    sendOk(res, {
      activePlan: effectivePlan,
      primaryPlan,
      unlockedPlans,
      hasMultiplePlans:
        unlockedPlans.includes("pro") && unlockedPlans.includes("team"),
      totalMissions,
      completedMissions,
      overallPercent,
      vibeScore: progress.vibeScore,
      streakDays: liveStreak,
      levelsCompletedPercent,
      completedLevels,
      totalLevels,
      levels: levelProgress,
      skills,
      achievements,
      activity,
    });
  } catch (err) {
    sendServerError(res, "Failed to load progress.", err);
  }
}
