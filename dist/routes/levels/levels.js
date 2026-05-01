"use strict";
/**
 * src/routes/levels/levels.ts
 *
 * GET /api/levels?plan=pro|team
 *
 * Direct port of app/api/levels/route.ts.
 * Heavy mission fields (markdownContent, checkpoint, solution) are
 * stripped at the DB query level — same as the Next.js version.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevels = getLevels;
const Level_1 = __importDefault(require("../../models/Level"));
const User_1 = __importDefault(require("../../models/User"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
// ── Types ─────────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ["admin", "super_admin"];
// ── Helpers ───────────────────────────────────────────────────────────────────
function resolveUnlockedPlans(user) {
    const unlocked = user.subscription.unlockedPlans;
    if (unlocked && unlocked.length > 0)
        return unlocked;
    const plan = user.subscription.plan;
    if (plan === "pro" || plan === "team")
        return [plan];
    return [];
}
// Mirrors formatLevel() in the Next.js route exactly.
function formatLevel(level, progress) {
    const publishedMissions = level.missions.filter((m) => m.isPublished);
    const levelStatus = progress?.levelStatus.get(level.slug) ?? "locked";
    const completedCount = progress
        ? publishedMissions.filter((m) => (0, progressService_1.resolveStoredStatus)(progress.missionProgress.get(m.missionId)?.status) === "completed").length
        : 0;
    return {
        id: level.levelId,
        slug: level.slug,
        title: level.title,
        vibeName: level.vibeName,
        description: level.description,
        icon: level.icon,
        color: level.color,
        status: levelStatus,
        plan: level.plan,
        missionCount: publishedMissions.length,
        completedMissions: completedCount,
    };
}
// Fields to exclude from every Level query — mirrors the Next.js .select()
const EXCLUDE_MISSION_FIELDS = "-missions.markdownContent -missions.checkpoint -missions.solution";
// ── Handler ───────────────────────────────────────────────────────────────────
async function getLevels(req, res) {
    try {
        const planParam = req.query.plan;
        const isAdmin = ADMIN_ROLES.includes(req.user.role);
        // ── Admin: return all (or plan-filtered) published levels, no progress ──
        if (isAdmin) {
            const filter = planParam ? { plan: planParam } : {};
            const levels = await Level_1.default.find({ isPublished: true, ...filter })
                .sort({ order: 1 })
                .select(EXCLUDE_MISSION_FIELDS)
                .lean();
            (0, response_1.sendOk)(res, levels.map((l) => formatLevel(l, null)));
            return;
        }
        // ── Student: plan param is required ──────────────────────────────────────
        if (!planParam || !["pro", "team"].includes(planParam)) {
            (0, response_1.sendBadRequest)(res, "plan query param is required. Use ?plan=pro or ?plan=team");
            return;
        }
        // Fetch only the subscription fields we need
        const dbUser = await User_1.default.findById(req.user.id)
            .select("subscription.plan subscription.unlockedPlans role")
            .lean();
        if (!dbUser) {
            (0, response_1.sendServerError)(res, "User not found.");
            return;
        }
        const unlockedPlans = resolveUnlockedPlans(dbUser);
        if (unlockedPlans.length === 0) {
            (0, response_1.sendForbidden)(res, "An active subscription is required to access levels.");
            return;
        }
        if (!unlockedPlans.includes(planParam)) {
            // Flat options so client can read response.data.code and
            // response.data.unlockedPlans directly — mirrors the Next.js CHANGED comment.
            (0, response_1.sendForbidden)(res, `You don't have access to ${planParam} content.`, {
                code: "PLAN_NOT_UNLOCKED",
                requestedPlan: planParam,
                unlockedPlans,
            });
            return;
        }
        const [levels, progress] = await Promise.all([
            Level_1.default.find({ isPublished: true, plan: planParam })
                .sort({ order: 1 })
                .select(EXCLUDE_MISSION_FIELDS)
                .lean(),
            (0, progressService_1.getOrCreateProgress)(req.user.id, unlockedPlans),
        ]);
        // Seed progress if this is the first time the user accesses this plan
        const planLevelSlugs = levels.map((l) => l.slug);
        const hasAnyProgress = planLevelSlugs.some((slug) => progress.levelStatus.has(slug));
        if (!hasAnyProgress && levels.length > 0) {
            await (0, progressService_1.seedNewPlanAccess)(req.user.id, planParam);
            const freshProgress = await (0, progressService_1.getOrCreateProgress)(req.user.id, unlockedPlans);
            (0, response_1.sendOk)(res, levels.map((level) => formatLevel(level, freshProgress)));
            return;
        }
        (0, response_1.sendOk)(res, levels.map((level) => formatLevel(level, progress)));
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load levels.", err);
    }
}
//# sourceMappingURL=levels.js.map