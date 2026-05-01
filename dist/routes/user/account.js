"use strict";
// DELETE /api/user/account
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = deleteAccount;
const zod_1 = require("zod");
const User_1 = __importDefault(require("../../models/User"));
const UserProgress_1 = __importDefault(require("../../models/UserProgress"));
const RefreshToken_1 = __importDefault(require("../../models/RefreshToken"));
const response_1 = require("../../utils/response");
const DeleteAccountSchema = zod_1.z.object({
    confirmation: zod_1.z.literal("delete my account"),
});
async function deleteAccount(req, res) {
    try {
        const parsed = DeleteAccountSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendBadRequest)(res, 'Please type "delete my account" to confirm.');
            return;
        }
        await Promise.all([
            RefreshToken_1.default.deleteMany({ userId: req.user.id }),
            UserProgress_1.default.deleteOne({ userId: req.user.id }),
            User_1.default.findByIdAndDelete(req.user.id),
        ]);
        // Clear auth cookies
        const cookieBase = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        };
        res.cookie("accessToken", "", cookieBase);
        res.cookie("refreshToken", "", cookieBase);
        (0, response_1.sendOk)(res, { message: "Your account has been permanently deleted." });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to delete account.", err);
    }
}
//# sourceMappingURL=account.js.map