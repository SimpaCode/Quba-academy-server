import { Router } from "express";
import { getDashboard } from "./dashboard";
import { getProgress } from "./progress";
import { getSettings, patchSettings } from "./settings";
import { patchProfile } from "./profile";
import { deleteAccount } from "./account";
import { postResetProgress } from "./resetProgress";
import { requireRole, ALL_ROLES, STUDENT_ONLY } from "../../middleware/auth";
import { requireTrustedOrigin } from "../../middleware/csrf";

const router = Router();

router.get("/dashboard", requireRole(ALL_ROLES), getDashboard);
router.get("/progress", requireRole(ALL_ROLES), getProgress);
router.get("/settings", requireRole(ALL_ROLES), getSettings);
router.patch("/settings", requireRole(ALL_ROLES), requireTrustedOrigin, patchSettings);
router.patch("/profile", requireRole(ALL_ROLES), requireTrustedOrigin, patchProfile);
router.delete("/account", requireRole(STUDENT_ONLY), requireTrustedOrigin, deleteAccount);
router.post("/reset-progress", requireRole(STUDENT_ONLY), requireTrustedOrigin, postResetProgress);

export default router;
