"use strict";
// GET /api/levels/:slug/missions/:missionId
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMission = getMission;
const Level_1 = __importDefault(require("../../models/Level"));
const User_1 = __importDefault(require("../../models/User"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
const ADMIN_ROLES = ["admin", "super_admin"];
function resolveUnlockedPlans(subscription) {
    const unlocked = subscription.unlockedPlans ?? [];
    if (unlocked.length > 0)
        return unlocked;
    const p = subscription.plan;
    if (p === "pro" || p === "team")
        return [p];
    return [];
}
async function getMission(req, res) {
    try {
        const { slug, missionId } = req.params;
        const isAdmin = ADMIN_ROLES.includes(req.user.role);
        const level = await Level_1.default.findOne({ slug, isPublished: true }).lean();
        if (!level) {
            (0, response_1.sendNotFound)(res, "Level");
            return;
        }
        const mission = level.missions.find((m) => m.missionId === missionId && m.isPublished);
        if (!mission) {
            (0, response_1.sendNotFound)(res, "Mission");
            return;
        }
        if (!isAdmin) {
            const dbUser = (await User_1.default.findById(req.user.id)
                .select("subscription.plan subscription.unlockedPlans")
                .lean());
            if (!dbUser) {
                (0, response_1.sendServerError)(res, "User not found.");
                return;
            }
            const unlockedPlans = resolveUnlockedPlans(dbUser.subscription);
            const levelPlan = level.plan;
            if (levelPlan && !unlockedPlans.includes(levelPlan)) {
                (0, response_1.sendForbidden)(res, `You don't have access to ${levelPlan === "pro" ? "Foundation" : "Mastery"} content.`, { code: "PLAN_NOT_UNLOCKED", requiredPlan: levelPlan });
                return;
            }
        }
        const progress = await (0, progressService_1.getOrCreateProgress)(req.user.id);
        const sortedMissionIds = level.missions
            .filter((m) => m.isPublished)
            .sort((a, b) => a.order - b.order)
            .map((m) => m.missionId);
        const activeMissionId = (0, progressService_1.getActiveMissionId)(sortedMissionIds, progress.missionProgress);
        const raw = progress.missionProgress.get(missionId)?.status;
        const stored = (0, progressService_1.resolveStoredStatus)(raw);
        const displayStatus = (0, progressService_1.toDisplayStatus)(stored, missionId === activeMissionId);
        (0, response_1.sendOk)(res, {
            id: mission.missionId,
            label: mission.label,
            title: mission.title,
            subtitle: mission.subtitle,
            analogy: mission.analogy,
            steps: mission.steps ?? [],
            order: mission.order,
            status: displayStatus,
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load mission.", err);
    }
}
//# sourceMappingURL=mission.js.map