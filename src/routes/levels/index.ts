import { Router } from "express";
import { getLevels } from "./levels";
import { getLevel } from "./level";
import { getCurrentMission } from "./currentMission";
import { getMission } from "./mission";
import { getMissionNav } from "./missionNav";
import { completeMissionHandler } from "./completeMission";
import { requireRole, ALL_ROLES, STUDENT_ONLY } from "../../middleware/auth";

const router = Router();

router.get("/", requireRole(ALL_ROLES), getLevels);
router.get("/:slug", requireRole(ALL_ROLES), getLevel);
router.get("/:slug/current-mission", requireRole(ALL_ROLES), getCurrentMission);
router.get("/:slug/missions/:missionId", requireRole(ALL_ROLES), getMission);
router.get(
  "/:slug/missions/:missionId/nav",
  requireRole(ALL_ROLES),
  getMissionNav,
);
router.patch(
  "/:slug/missions/:missionId/complete",
  requireRole(STUDENT_ONLY),
  completeMissionHandler,
);

export default router;
