"use strict";
// GET + PATCH /api/user/settings
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.patchSettings = patchSettings;
const zod_1 = require("zod");
const User_1 = __importDefault(require("../../models/User"));
const response_1 = require("../../utils/response");
const PLAN_PRICE = { pro: 15000, team: 25000 };
const PLAN_LABEL = {
    pro: "Foundation",
    team: "Mastery",
};
const NotificationsSchema = zod_1.z.object({
    weeklyDigest: zod_1.z.boolean().optional(),
    streakReminders: zod_1.z.boolean().optional(),
    levelUnlocked: zod_1.z.boolean().optional(),
    missionTips: zod_1.z.boolean().optional(),
    productUpdates: zod_1.z.boolean().optional(),
});
const AppearanceSchema = zod_1.z.object({
    theme: zod_1.z.enum(["system", "light", "dark"]).optional(),
    reduceMotion: zod_1.z.boolean().optional(),
    compactMode: zod_1.z.boolean().optional(),
});
const LearningSchema = zod_1.z.object({
    dailyGoal: zod_1.z
        .union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(5)])
        .optional(),
    reminderTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional(),
    reminderEnabled: zod_1.z.boolean().optional(),
    showAnalogiesFirst: zod_1.z.boolean().optional(),
});
const SettingsPatchSchema = zod_1.z
    .object({
    notifications: NotificationsSchema.optional(),
    appearance: AppearanceSchema.optional(),
    learning: LearningSchema.optional(),
})
    .refine((data) => data.notifications !== undefined ||
    data.appearance !== undefined ||
    data.learning !== undefined, { message: "Provide at least one settings section to update." });
async function getSettings(req, res) {
    try {
        const dbUser = (await User_1.default.findById(req.user.id)
            .select("firstName lastName username email createdAt notifications appearance learning subscription")
            .lean());
        if (!dbUser) {
            (0, response_1.sendNotFound)(res, "User");
            return;
        }
        const rawUnlocked = dbUser.subscription?.unlockedPlans ?? [];
        const primaryPlan = dbUser.subscription?.plan ?? "free";
        const unlockedPlans = rawUnlocked.length > 0
            ? rawUnlocked
            : primaryPlan !== "free"
                ? [primaryPlan]
                : [];
        const planDetails = unlockedPlans.map((p) => ({
            plan: p,
            label: PLAN_LABEL[p] ?? p,
            price: PLAN_PRICE[p] ?? 0,
            isPrimary: p === primaryPlan,
        }));
        (0, response_1.sendOk)(res, {
            profile: {
                firstName: dbUser.firstName ?? "",
                lastName: dbUser.lastName ?? "",
                username: dbUser.username,
                email: dbUser.email,
                joinedAt: dbUser.createdAt
                    ? new Date(dbUser.createdAt).toISOString()
                    : null,
            },
            notifications: {
                weeklyDigest: false,
                streakReminders: false,
                levelUnlocked: false,
                missionTips: false,
                productUpdates: false,
                ...(dbUser.notifications ?? {}),
            },
            appearance: {
                theme: "system",
                reduceMotion: false,
                compactMode: false,
                ...(dbUser.appearance ?? {}),
            },
            learning: {
                dailyGoal: 1,
                reminderTime: "09:00",
                reminderEnabled: false,
                showAnalogiesFirst: false,
                ...(dbUser.learning ?? {}),
            },
            subscription: {
                plan: primaryPlan,
                unlockedPlans,
                planDetails,
                paystackCustomerCode: dbUser.subscription?.paystackCustomerCode ?? null,
                renewsAt: dbUser.subscription?.renewsAt
                    ? new Date(dbUser.subscription.renewsAt).toISOString()
                    : null,
                cancelledAt: dbUser.subscription?.cancelledAt
                    ? new Date(dbUser.subscription.cancelledAt).toISOString()
                    : null,
            },
        });
    }
    catch (err) {
        (0, response_1.sendServerError)(res, "Failed to load settings.", err);
    }
}
async function patchSettings(req, res) {
    try {
        const parsed = SettingsPatchSchema.safeParse(req.body);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((e) => e.message).join(" ");
            (0, response_1.sendBadRequest)(res, msg);
            return;
        }
        const { notifications, appearance, learning } = parsed.data;
        const $set = {};
        const updated = [];
        if (notifications) {
            for (const [key, val] of Object.entries(notifications)) {
                if (val !== undefined) {
                    $set[`notifications.${key}`] = val;
                    updated.push(`notifications.${key}`);
                }
            }
        }
        if (appearance) {
            for (const [key, val] of Object.entries(appearance)) {
                if (val !== undefined) {
                    $set[`appearance.${key}`] = val;
                    updated.push(`appearance.${key}`);
                }
            }
        }
        if (learning) {
            for (const [key, val] of Object.entries(learning)) {
                if (val !== undefined) {
                    $set[`learning.${key}`] = val;
                    updated.push(`learning.${key}`);
                }
            }
        }
        if (Object.keys($set).length === 0) {
            (0, response_1.sendBadRequest)(res, "No valid fields to update.");
            return;
        }
        await User_1.default.findByIdAndUpdate(req.user.id, { $set }, { runValidators: true });
        (0, response_1.sendOk)(res, { updated });
    }
    catch (err) {
        if (err.name === "ValidationError") {
            (0, response_1.sendBadRequest)(res, err.message);
            return;
        }
        (0, response_1.sendServerError)(res, "Failed to update settings.", err);
    }
}
//# sourceMappingURL=settings.js.map