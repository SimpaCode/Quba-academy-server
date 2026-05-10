// PATCH /api/levels/:slug/missions/:missionId/complete

import { Request, Response } from "express";
import Level from "../../models/Level";
import { completeMission } from "../../services/progressService";
import { sendOk, sendNotFound, sendServerError } from "../../utils/response";

export async function completeMissionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { slug, missionId } = req.params;

    const level = await Level.findOne({ slug, isPublished: true })
      .select(
        "missions.missionId missions.label missions.title missions.isPublished missions.order",
      )
      .lean();

    if (!level) {
      sendNotFound(res, "Level");
      return;
    }

    const mission = level.missions.find(
      (m) => m.missionId === missionId && m.isPublished,
    );
    if (!mission) {
      sendNotFound(res, "Mission");
      return;
    }

    const result = await completeMission(
      req.user!.id,
      slug as any,
      missionId as any,
    );

    let nextMission: { id: string; label: string; title: string } | null = null;
    if (result.nextMissionId) {
      const next = level.missions.find(
        (m) => m.missionId === result.nextMissionId,
      );
      if (next) {
        nextMission = {
          id: next.missionId,
          label: next.label,
          title: next.title,
        };
      }
    }

    sendOk(res, {
      nextMissionId: result.nextMissionId,
      nextMission,
      levelCompleted: result.levelCompleted,
      nextLevelSlug: result.nextLevelSlug,
      newAchievements: result.newAchievements,
      vibeScore: result.vibeScore,
      currentStreak: result.currentStreak,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Level not found") {
      sendNotFound(res, "Level");
      return;
    }
    sendServerError(res, "Failed to complete mission.", err);
  }
}
