// GET /api/levels/:slug

import { Request, Response } from "express";
import Level from "../../models/Level";
import {
  getOrCreateProgress,
  getActiveMissionId,
  toDisplayStatus,
  resolveStoredStatus,
} from "../../services/progressService";
import { sendOk, sendNotFound, sendServerError } from "../../utils/response";

export async function getLevel(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const [level, progress] = await Promise.all([
      Level.findOne({ slug, isPublished: true }).lean(),
      getOrCreateProgress(req.user!.id),
    ]);

    if (!level) {
      sendNotFound(res, "Level");
      return;
    }

    const levelStatus = progress.levelStatus.get(slug as any) ?? "locked";

    const publishedSorted = level.missions
      .filter((m) => m.isPublished)
      .sort((a, b) => a.order - b.order);

    const sortedIds = publishedSorted.map((m) => m.missionId);
    const activeMissionId = getActiveMissionId(
      sortedIds,
      progress.missionProgress,
    );

    const missions = publishedSorted.map((m) => {
      const raw = progress.missionProgress.get(m.missionId)?.status;
      const stored = resolveStoredStatus(raw);
      return {
        id: m.missionId,
        label: m.label,
        title: m.title,
        status: toDisplayStatus(stored, m.missionId === activeMissionId),
      };
    });

    sendOk(res, {
      id: level.levelId,
      slug: level.slug,
      title: level.title,
      vibeName: level.vibeName,
      description: level.description,
      icon: level.icon,
      status: levelStatus,
      missions,
    });
  } catch (err) {
    sendServerError(res, "Failed to load level.", err);
  }
}
