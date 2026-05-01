// GET /api/levels/:slug/missions/:missionId

import { Request, Response } from "express";
import Level from "../../models/Level";
import User from "../../models/User";
import {
  getOrCreateProgress,
  getActiveMissionId,
  toDisplayStatus,
  resolveStoredStatus,
} from "../../services/progressService";
import {
  sendOk,
  sendNotFound,
  sendForbidden,
  sendServerError,
} from "../../utils/response";

const ADMIN_ROLES = ["admin", "super_admin"];

function resolveUnlockedPlans(subscription: {
  plan: string;
  unlockedPlans?: string[];
}): ("pro" | "team")[] {
  const unlocked = subscription.unlockedPlans ?? [];
  if (unlocked.length > 0) return unlocked as ("pro" | "team")[];
  const p = subscription.plan;
  if (p === "pro" || p === "team") return [p];
  return [];
}

export async function getMission(req: Request, res: Response): Promise<void> {
  try {
    const { slug, missionId } = req.params;
    const isAdmin = ADMIN_ROLES.includes(req.user!.role);

    const level = await Level.findOne({ slug, isPublished: true }).lean();

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

    if (!isAdmin) {
      const dbUser = (await User.findById(req.user!.id)
        .select("subscription.plan subscription.unlockedPlans")
        .lean()) as any;

      if (!dbUser) {
        sendServerError(res, "User not found.");
        return;
      }

      const unlockedPlans = resolveUnlockedPlans(dbUser.subscription);
      const levelPlan = (level as any).plan as "pro" | "team" | undefined;

      if (levelPlan && !unlockedPlans.includes(levelPlan)) {
        sendForbidden(
          res,
          `You don't have access to ${levelPlan === "pro" ? "Foundation" : "Mastery"} content.`,
          { code: "PLAN_NOT_UNLOCKED", requiredPlan: levelPlan },
        );
        return;
      }
    }

    const progress = await getOrCreateProgress(req.user!.id);

    const sortedMissionIds = level.missions
      .filter((m) => m.isPublished)
      .sort((a, b) => a.order - b.order)
      .map((m) => m.missionId);

    const activeMissionId = getActiveMissionId(
      sortedMissionIds,
      progress.missionProgress,
    );

    const raw = progress.missionProgress.get(missionId as any)?.status;
    const stored = resolveStoredStatus(raw);
    const displayStatus = toDisplayStatus(
      stored,
      missionId === activeMissionId,
    );

    sendOk(res, {
      id: mission.missionId,
      label: mission.label,
      title: mission.title,
      subtitle: mission.subtitle,
      analogy: mission.analogy,
      steps: mission.steps ?? [],
      order: mission.order,
      status: displayStatus,
    });
  } catch (err) {
    sendServerError(res, "Failed to load mission.", err);
  }
}
