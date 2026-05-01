"use strict";
// PATCH /api/user/profile
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchProfile = patchProfile;
const zod_1 = require("zod");
const User_1 = __importDefault(require("../../models/User"));
const response_1 = require("../../utils/response");
const ProfilePatchSchema = zod_1.z
    .object({
    username: zod_1.z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/)
        .optional(),
    email: zod_1.z.string().email().optional(),
})
    .refine((data) => data.username !== undefined || data.email !== undefined, {
    message: "Provide username or email to update.",
});
async function patchProfile(req, res) {
    try {
        const parsed = ProfilePatchSchema.safeParse(req.body);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((e) => e.message).join(" ");
            (0, response_1.sendBadRequest)(res, msg);
            return;
        }
        const { username, email } = parsed.data;
        const normalEmail = email?.trim().toLowerCase();
        const normalUsername = username?.trim();
        const checks = [];
        if (normalUsername) {
            checks.push(User_1.default.exists({
                username: normalUsername,
                _id: { $ne: req.user.id },
            }).then((exists) => {
                if (exists)
                    throw new Error("USERNAME_TAKEN");
            }));
        }
        if (normalEmail) {
            checks.push(User_1.default.exists({
                email: normalEmail,
                _id: { $ne: req.user.id },
            }).then((exists) => {
                if (exists)
                    throw new Error("EMAIL_TAKEN");
            }));
        }
        try {
            await Promise.all(checks);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (msg === "USERNAME_TAKEN") {
                (0, response_1.sendConflict)(res, "This username is already taken.");
                return;
            }
            if (msg === "EMAIL_TAKEN") {
                (0, response_1.sendConflict)(res, "An account with this email already exists.");
                return;
            }
            throw err;
        }
        const $set = {};
        const updated = [];
        if (normalUsername) {
            $set.username = normalUsername;
            updated.push("username");
        }
        if (normalEmail) {
            $set.email = normalEmail;
            updated.push("email");
        }
        await User_1.default.findByIdAndUpdate(req.user.id, { $set });
        (0, response_1.sendOk)(res, { updated });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to update profile.", err);
    }
}
//# sourceMappingURL=profile.js.map