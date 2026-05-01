"use strict";
// GET /api/levels/:slug/missions/:missionId/nav
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissionNav = getMissionNav;
const Level_1 = __importDefault(require("../../models/Level"));
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
async function getMissionNav(req, res) {
    try {
        const { slug, missionId } = req.params;
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
        const currentIdx = sorted.findIndex((m) => m.missionId === missionId);
        if (currentIdx === -1) {
            (0, response_1.sendNotFound)(res, "Mission");
            return;
        }
        const sortedIds = sorted.map((m) => m.missionId);
        const activeMissionId = (0, progressService_1.getActiveMissionId)(sortedIds, progress.missionProgress);
        const toSummary = (m) => {
            const raw = progress.missionProgress.get(m.missionId)?.status;
            const stored = (0, progressService_1.resolveStoredStatus)(raw);
            return {
                id: m.missionId,
                label: m.label,
                title: m.title,
                status: (0, progressService_1.toDisplayStatus)(stored, m.missionId === activeMissionId),
            };
        };
        (0, response_1.sendOk)(res, {
            current: toSummary(sorted[currentIdx]),
            prev: currentIdx > 0 ? toSummary(sorted[currentIdx - 1]) : null,
            next: currentIdx < sorted.length - 1
                ? toSummary(sorted[currentIdx + 1])
                : null,
            currentIndex: currentIdx,
            totalMissions: sorted.length,
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load navigation.", err);
    }
}
//# sourceMappingURL=missionNav.js.map