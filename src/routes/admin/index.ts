/**
 * src/routes/admin/index.ts
 *
 * All admin routes — gated by ADMIN_ROLES middleware applied to the whole router.
 */

import { Router } from "express";

import { requireRole, ADMIN_ROLES } from "../../middleware/auth";

const router = Router();

// Apply admin role check to every route in this router
router.use(requireRole(ADMIN_ROLES));

// router.get("/overview", getOverview);
// router.get("/content", getContent);
// router.post("/content", postLevel);
// router.get("/content/:levelId", getLevelDetail);
// router.patch("/content/:levelId", patchLevel);
// router.delete("/content/:levelId", deleteLevel);
// router.post("/content/:levelId/missions", postMission);
// router.patch("/content/:levelId/missions/:missionId", patchMission);
// router.delete("/content/:levelId/missions/:missionId", deleteMission);
// router.get("/billing", getBilling);
// router.get("/settings", getAdminSettings);
// router.patch("/settings", patchAdminSettings);

export default router;
