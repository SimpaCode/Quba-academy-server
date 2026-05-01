"use strict";
// GET /api/levels/:slug
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevel = getLevel;
const Level_1 = __importDefault(require("../../models/Level"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
async function getLevel(req, res) {
    try {
        const { slug } = req.params;
        const [level, progress] = await Promise.all([
            Level_1.default.findOne({ slug, isPublished: true }).lean(),
            (0, progressService_1.getOrCreateProgress)(req.user.id),
        ]);
        if (!level) {
            (0, response_1.sendNotFound)(res, "Level");
            return;
        }
        const levelStatus = progress.levelStatus.get(slug) ?? "locked";
        const publishedSorted = level.missions
            .filter((m) => m.isPublished)
            .sort((a, b) => a.order - b.order);
        const sortedIds = publishedSorted.map((m) => m.missionId);
        const activeMissionId = (0, progressService_1.getActiveMissionId)(sortedIds, progress.missionProgress);
        const missions = publishedSorted.map((m) => {
            const raw = progress.missionProgress.get(m.missionId)?.status;
            const stored = (0, progressService_1.resolveStoredStatus)(raw);
            return {
                id: m.missionId,
                label: m.label,
                title: m.title,
                status: (0, progressService_1.toDisplayStatus)(stored, m.missionId === activeMissionId),
            };
        });
        (0, response_1.sendOk)(res, {
            id: level.levelId,
            slug: level.slug,
            title: level.title,
            vibeName: level.vibeName,
            description: level.description,
            icon: level.icon,
            status: levelStatus,
            missions,
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load level.", err);
    }
}
//# sourceMappingURL=level.js.map