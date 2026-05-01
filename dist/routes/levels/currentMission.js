"use strict";
// GET /api/levels/:slug/current-mission
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentMission = getCurrentMission;
const Level_1 = __importDefault(require("../../models/Level"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
async function getCurrentMission(req, res) {
    try {
        const { slug } = req.params;
        const [level, progress] = await Promise.all([
            Level_1.default.findOne({ slug, isPublished: true })
                .select("missions levelId slug")
                .lean(),
            (0, progressService_1.getOrCreateProgress)(req.user.id),
        ]);
        if (!level) {
            (0, response_1.sendNotFound)(res, "Level");
            return;
        }
        const sorted = level.missions
            .filter((m) => m.isPublished)
            .sort((a, b) => a.order - b.order);
        if (!sorted.length) {
            (0, response_1.sendNotFound)(res, "Mission");
            return;
        }
        const sortedIds = sorted.map((m) => m.missionId);
        const activeMissionId = (0, progressService_1.getActiveMissionId)(sortedIds, progress.missionProgress);
        const targetId = activeMissionId ?? sorted[0].missionId;
        const target = sorted.find((m) => m.missionId === targetId) ?? sorted[0];
        const raw = progress.missionProgress.get(target.missionId)?.status;
        const stored = (0, progressService_1.resolveStoredStatus)(raw);
        const displayStatus = (0, progressService_1.toDisplayStatus)(stored, target.missionId === activeMissionId);
        (0, response_1.sendOk)(res, {
            id: target.missionId,
            label: target.label,
            title: target.title,
            status: displayStatus,
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to get current mission.", err);
    }
}
//# sourceMappingURL=currentMission.js.map