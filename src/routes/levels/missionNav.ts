// GET /api/levels/:slug/missions/:missionId/nav

import { Request, Response } from "express";
import Level from "../../models/Level";
import {
  getOrCreateProgress,
  getActiveMissionId,
  toDisplayStatus,
  resolveStoredStatus,
} from "../../services/progressService";
import { sendOk, sendNotFound, sendServerError } from "../../utils/response";

export async function getMissionNav(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { slug, missionId } = req.params;

    const [level, progress] = await Promise.all([
      Level.findOne({ slug, isPublished: true })
        .select(
          "levelId slug missions.missionId missions.label missions.title missions.isPublished missions.order",
        )
        .lean(),
      getOrCreateProgress(req.user!.id),
    ]);

    if (!level) {
      sendNotFound(res, "Level");
      return;
    }

    const sorted = level.missions
      .filter((m) => m.isPublished)
      .sort((a, b) => a.order - b.order);

    const currentIdx = sorted.findIndex((m) => m.missionId === missionId);
    if (currentIdx === -1) {
      sendNotFound(res, "Mission");
      return;
    }

    const sortedIds = sorted.map((m) => m.missionId);
    const activeMissionId = getActiveMissionId(
      sortedIds,
      progress.missionProgress,
    );

    const toSummary = (m: (typeof sorted)[number]) => {
      const raw = progress.missionProgress.get(m.missionId)?.status;
      const stored = resolveStoredStatus(raw);
      return {
        id: m.missionId,
        label: m.label,
        title: m.title,
        status: toDisplayStatus(stored, m.missionId === activeMissionId),
      };
    };

    sendOk(res, {
      current: toSummary(sorted[currentIdx]),
      prev: currentIdx > 0 ? toSummary(sorted[currentIdx - 1]) : null,
      next:
        currentIdx < sorted.length - 1
          ? toSummary(sorted[currentIdx + 1])
          : null,
      currentIndex: currentIdx,
      totalMissions: sorted.length,
    });
  } catch (err) {
    sendServerError(res, "Failed to load navigation.", err);
  }
}
