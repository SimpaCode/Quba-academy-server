"use strict";
// GET /api/user/dashboard
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const Level_1 = __importDefault(require("../../models/Level"));
const User_1 = __importDefault(require("../../models/User"));
const progressService_1 = require("../../services/progressService");
const dateUtils_1 = require("../../utils/dateUtils");
const response_1 = require("../../utils/response");
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
function buildStreakDays(activityLog, lastActiveDate, currentStreak) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let logObj = {};
    if (activityLog instanceof Map) {
        for (const [k, v] of activityLog.entries())
            logObj[k] = v;
    }
    else if (activityLog && typeof activityLog === "object") {
        logObj = activityLog;
    }
    const streakActiveDates = new Set();
    if (lastActiveDate && currentStreak > 0) {
        const last = new Date(lastActiveDate);
        for (let i = 0; i < currentStreak; i++) {
            const d = new Date(last.getTime() - i * 86400000);
            streakActiveDates.add((0, dateUtils_1.toLocalDateString)(d));
        }
    }
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        const dateStr = (0, dateUtils_1.toLocalDateString)(d);
        result.push({
            day: DAY_LABELS[d.getDay()],
            completed: (logObj[dateStr] ?? 0) > 0 || streakActiveDates.has(dateStr),
        });
    }
    return result;
}
function findNextMission(levels, progress, requiresEngagement = false) {
    let totalCount = 0;
    let completedCount = 0;
    for (const level of levels) {
        const published = level.missions.filter((m) => m.isPublished);
        totalCount += published.length;
        for (const m of published) {
            const raw = progress.missionProgress.get(m.missionId)?.status;
            if ((0, progressService_1.resolveStoredStatus)(raw) === "completed")
                completedCount++;
        }
    }
    if (requiresEngagement && completedCount === 0)
        return null;
    if (totalCount > 0 && completedCount === totalCount)
        return null;
    for (const level of levels) {
        const sorted = level.missions
            .filter((m) => m.isPublished)
            .sort((a, b) => a.order - b.order);
        if (!sorted.length)
            continue;
        const sortedIds = sorted.map((m) => m.missionId);
        const activeMissionId = (0, progressService_1.getActiveMissionId)(sortedIds, progress.missionProgress);
        if (!activeMissionId)
            continue;
        const activeMission = sorted.find((m) => m.missionId === activeMissionId);
        if (!activeMission)
            continue;
        const completedInLevel = sorted.filter((m) => {
            const raw = progress.missionProgress.get(m.missionId)?.status;
            return (0, progressService_1.resolveStoredStatus)(raw) === "completed";
        }).length;
        return {
            levelId: level.levelId,
            levelSlug: level.slug,
            levelTitle: level.title,
            levelPlan: (level.plan ?? "pro"),
            missionId: activeMissionId,
            missionLabel: activeMission.label,
            title: activeMission.title,
            analogy: activeMission.analogy,
            levelProgress: sorted.length > 0
                ? Math.round((completedInLevel / sorted.length) * 100)
                : 0,
        };
    }
    return null;
}
function getDailyAnalogy(levels) {
    const fallback = {
        topic: "The Web",
        content: "The internet is a giant postal system. Your browser is the mailman, URLs are addresses, and servers are the buildings that hold what you ordered.",
    };
    const firstLevel = levels[0];
    if (!firstLevel?.missions?.length)
        return fallback;
    const published = firstLevel.missions.filter((m) => m.isPublished);
    if (!published.length)
        return fallback;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000);
    const mission = published[dayOfYear % published.length];
    return {
        topic: mission.subtitle ?? mission.title,
        content: mission.analogy,
    };
}
async function getDashboard(req, res) {
    try {
        const dbUser = (await User_1.default.findById(req.user.id)
            .select("firstName lastName username subscription")
            .lean());
        if (!dbUser) {
            (0, response_1.sendServerError)(res, "User not found.");
            return;
        }
        const primaryPlan = (dbUser.subscription?.plan ?? "pro");
        const rawUnlocked = dbUser.subscription?.unlockedPlans ?? [];
        const unlockedPlans = rawUnlocked.length > 0 ? rawUnlocked : [primaryPlan];
        const hasMultiplePlans = unlockedPlans.includes("pro") && unlockedPlans.includes("team");
        const secondaryPlan = primaryPlan === "pro" ? "team" : "pro";
        const [primaryLevels, secondaryLevels, progress] = await Promise.all([
            Level_1.default.find({ isPublished: true, plan: primaryPlan })
                .sort({ order: 1 })
                .lean(),
            hasMultiplePlans
                ? Level_1.default.find({ isPublished: true, plan: secondaryPlan })
                    .sort({ order: 1 })
                    .lean()
                : Promise.resolve([]),
            (0, progressService_1.getOrCreateProgress)(req.user.id, unlockedPlans),
        ]);
        const primaryNextMission = findNextMission(primaryLevels, progress, false);
        const secondaryNextMission = hasMultiplePlans
            ? findNextMission(secondaryLevels, progress, true)
            : null;
        const allLevels = [...primaryLevels, ...secondaryLevels];
        const completedWithTime = [];
        for (const level of allLevels) {
            for (const m of level.missions) {
                const state = progress.missionProgress.get(m.missionId);
                if ((0, progressService_1.resolveStoredStatus)(state?.status) === "completed" &&
                    state?.completedAt) {
                    completedWithTime.push({
                        missionLabel: m.label,
                        missionTitle: m.title,
                        levelTitle: level.title,
                        levelSlug: level.slug,
                        levelPlan: (level.plan ?? "pro"),
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
        const currentLevelIndex = primaryLevels.findIndex((l) => (progress.levelStatus.get(l.slug) ?? "locked") === "current");
        const liveStreak = (0, dateUtils_1.computeLiveStreak)(progress.currentStreak, progress.lastActiveDate);
        const totalCompletedMissions = [
            ...progress.missionProgress.values(),
        ].filter((s) => (0, progressService_1.resolveStoredStatus)(s.status) === "completed").length;
        const planSummary = unlockedPlans.map((plan) => {
            const planLevels = plan === primaryPlan ? primaryLevels : secondaryLevels;
            const total = planLevels.reduce((sum, l) => sum + l.missions.filter((m) => m.isPublished).length, 0);
            const completed = planLevels.reduce((sum, l) => {
                return (sum +
                    l.missions.filter((m) => m.isPublished &&
                        (0, progressService_1.resolveStoredStatus)(progress.missionProgress.get(m.missionId)?.status) === "completed").length);
            }, 0);
            return {
                plan,
                label: plan === "pro" ? "Foundation" : "Mastery",
                totalMissions: total,
                completedMissions: completed,
                percent: total > 0 ? Math.round((completed / total) * 100) : 0,
                currentLevelIndex: plan === primaryPlan
                    ? Math.max(0, currentLevelIndex)
                    : planLevels.findIndex((l) => (progress.levelStatus.get(l.slug) ?? "locked") === "current"),
            };
        });
        (0, response_1.sendOk)(res, {
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
            streakDays: buildStreakDays(progress.activityLog, progress.lastActiveDate, progress.currentStreak),
            recentActivity,
            dailyAnalogy: getDailyAnalogy(primaryLevels),
            planSummary,
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load dashboard.", err);
    }
}
//# sourceMappingURL=dashboard.js.map