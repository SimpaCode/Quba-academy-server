"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const levels_1 = require("./levels");
const level_1 = require("./level");
const currentMission_1 = require("./currentMission");
const mission_1 = require("./mission");
const missionNav_1 = require("./missionNav");
const completeMission_1 = require("./completeMission");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", (0, auth_1.requireRole)(auth_1.ALL_ROLES), levels_1.getLevels);
router.get("/:slug", (0, auth_1.requireRole)(auth_1.ALL_ROLES), level_1.getLevel);
router.get("/:slug/current-mission", (0, auth_1.requireRole)(auth_1.ALL_ROLES), currentMission_1.getCurrentMission);
router.get("/:slug/missions/:missionId", (0, auth_1.requireRole)(auth_1.ALL_ROLES), mission_1.getMission);
router.get("/:slug/missions/:missionId/nav", (0, auth_1.requireRole)(auth_1.ALL_ROLES), missionNav_1.getMissionNav);
router.patch("/:slug/missions/:missionId/complete", (0, auth_1.requireRole)(auth_1.STUDENT_ONLY), completeMission_1.completeMissionHandler);
exports.default = router;
//# sourceMappingURL=index.js.map