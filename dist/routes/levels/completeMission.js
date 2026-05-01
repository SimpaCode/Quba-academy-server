"use strict";
// PATCH /api/levels/:slug/missions/:missionId/complete
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMissionHandler = completeMissionHandler;
const Level_1 = __importDefault(require("../../models/Level"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
async function completeMissionHandler(req, res) {
    try {
        const { slug, missionId } = req.params;
        const level = await Level_1.default.findOne({ slug, isPublished: true })
            .select("missions")
            .lean();
        if (!level) {
            (0, response_1.sendNotFound)(res, "Level");
            return;
        }
        const mission = level.missions.find((m) => m.missionId === missionId && m.isPublished);
        if (!mission) {
            (0, response_1.sendNotFound)(res, "Mission");
            return;
        }
        const result = await (0, progressService_1.completeMission)(req.user.id, slug, missionId);
        let nextMission = null;
        if (result.nextMissionId) {
            const next = level.missions.find((m) => m.missionId === result.nextMissionId);
            if (next) {
                nextMission = {
                    id: next.missionId,
                    label: next.label,
                    title: next.title,
                };
            }
        }
        (0, response_1.sendOk)(res, {
            nextMissionId: result.nextMissionId,
            nextMission,
            levelCompleted: result.levelCompleted,
            nextLevelSlug: result.nextLevelSlug,
            newAchievements: result.newAchievements,
            vibeScore: result.vibeScore,
            currentStreak: result.currentStreak,
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "Level not found") {
            (0, response_1.sendNotFound)(res, "Level");
            return;
        }
        (0, response_1.sendServerError)(res, "Failed to complete mission.", err);
    }
}
//# sourceMappingURL=completeMission.js.map