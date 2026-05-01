import { Router } from "express";
import { getDashboard } from "./dashboard";
import { getProgress } from "./progress";
import { getSettings, patchSettings } from "./settings";
import { patchProfile } from "./profile";
import { deleteAccount } from "./account";
import { postResetProgress } from "./resetProgress";
import { requireRole, ALL_ROLES, STUDENT_ONLY } from "../../middleware/auth";

const router = Router();

router.get("/dashboard", requireRole(ALL_ROLES), getDashboard);
router.get("/progress", requireRole(ALL_ROLES), getProgress);
router.get("/settings", requireRole(ALL_ROLES), getSettings);
router.patch("/settings", requireRole(ALL_ROLES), patchSettings);
router.patch("/profile", requireRole(ALL_ROLES), patchProfile);
router.delete("/account", requireRole(STUDENT_ONLY), deleteAccount);
router.post("/reset-progress", requireRole(STUDENT_ONLY), postResetProgress);

export default router;
