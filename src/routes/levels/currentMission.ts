// GET /api/levels/:slug/current-mission

import { Request, Response } from "express";
import Level from "../../models/Level";
import {
  getOrCreateProgress,
  getActiveMissionId,
  toDisplayStatus,
  resolveStoredStatus,
} from "../../services/progressService";
import { sendOk, sendNotFound, sendServerError } from "../../utils/response";

export async function getCurrentMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { slug } = req.params;

    const [level, progress] = await Promise.all([
      Level.findOne({ slug, isPublished: true })
        .select("missions levelId slug")
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

    if (!sorted.length) {
      sendNotFound(res, "Mission");
      return;
    }

    const sortedIds = sorted.map((m) => m.missionId);
    const activeMissionId = getActiveMissionId(
      sortedIds,
      progress.missionProgress,
    );

    const targetId = activeMissionId ?? sorted[0].missionId;
    const target = sorted.find((m) => m.missionId === targetId) ?? sorted[0];

    const raw = progress.missionProgress.get(target.missionId)?.status;
    const stored = resolveStoredStatus(raw);
    const displayStatus = toDisplayStatus(
      stored,
      target.missionId === activeMissionId,
    );

    sendOk(res, {
      id: target.missionId,
      label: target.label,
      title: target.title,
      status: displayStatus,
    });
  } catch (err) {
    sendServerError(res, "Failed to get current mission.", err);
  }
}
