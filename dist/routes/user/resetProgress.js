"use strict";
// POST /api/user/reset-progress
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResetProgress = postResetProgress;
const progressService_1 = require("../../services/progressService");
const response_1 = require("../../utils/response");
async function postResetProgress(req, res) {
    try {
        await (0, progressService_1.resetProgress)(req.user.id);
        (0, response_1.sendOk)(res, { message: "Progress reset successfully." });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to reset progress.", err);
    }
}
//# sourceMappingURL=resetProgress.js.map