// GET + PATCH /api/user/settings

import { Request, Response } from "express";
import { z } from "zod";
import User from "../../models/User";
import {
  sendOk,
  sendBadRequest,
  sendNotFound,
  sendServerError,
} from "../../utils/response";

const PLAN_PRICE: Record<string, number> = { pro: 15000, team: 25000 };
const PLAN_LABEL: Record<string, string> = {
  pro: "Foundation",
  team: "Mastery",
};

const NotificationsSchema = z.object({
  weeklyDigest: z.boolean().optional(),
  streakReminders: z.boolean().optional(),
  levelUnlocked: z.boolean().optional(),
  missionTips: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
});

const AppearanceSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  reduceMotion: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});

const LearningSchema = z.object({
  dailyGoal: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)])
    .optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  reminderEnabled: z.boolean().optional(),
  showAnalogiesFirst: z.boolean().optional(),
});

const SettingsPatchSchema = z
  .object({
    notifications: NotificationsSchema.optional(),
    appearance: AppearanceSchema.optional(),
    learning: LearningSchema.optional(),
  })
  .refine(
    (data) =>
      data.notifications !== undefined ||
      data.appearance !== undefined ||
      data.learning !== undefined,
    { message: "Provide at least one settings section to update." },
  );

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const dbUser = (await User.findById(req.user!.id)
      .select(
        "firstName lastName username email createdAt notifications appearance learning subscription",
      )
      .lean()) as any;

    if (!dbUser) {
      sendNotFound(res, "User");
      return;
    }

    const rawUnlocked = dbUser.subscription?.unlockedPlans ?? [];
    const primaryPlan = dbUser.subscription?.plan ?? "free";

    const unlockedPlans: ("pro" | "team")[] =
      rawUnlocked.length > 0
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

    sendOk(res, {
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
  } catch (err) {
    sendServerError(res, "Failed to load settings.", err);
  }
}

export async function patchSettings(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parsed = SettingsPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(" ");
      sendBadRequest(res, msg);
      return;
    }

    const { notifications, appearance, learning } = parsed.data;

    const $set: Record<string, unknown> = {};
    const updated: string[] = [];

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
      sendBadRequest(res, "No valid fields to update.");
      return;
    }

    await User.findByIdAndUpdate(
      req.user!.id,
      { $set },
      { runValidators: true },
    );

    sendOk(res, { updated });
  } catch (err: any) {
    if (err.name === "ValidationError") {
      sendBadRequest(res, err.message);
      return;
    }
    sendServerError(res, "Failed to update settings.", err);
  }
}
