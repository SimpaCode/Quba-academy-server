// PATCH /api/user/profile

import { Request, Response } from "express";
import { z } from "zod";
import User from "../../models/User";
import {
  sendOk,
  sendBadRequest,
  sendConflict,
  sendServerError,
} from "../../utils/response";

const ProfilePatchSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.username !== undefined || data.email !== undefined, {
    message: "Provide username or email to update.",
  });

export async function patchProfile(req: Request, res: Response): Promise<void> {
  try {
    const parsed = ProfilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(" ");
      sendBadRequest(res, msg);
      return;
    }

    const { username, email } = parsed.data;
    const normalEmail = email?.trim().toLowerCase();
    const normalUsername = username?.trim();

    const checks: Promise<void>[] = [];

    if (normalUsername) {
      checks.push(
        User.exists({
          username: normalUsername,
          _id: { $ne: req.user!.id },
        }).then((exists) => {
          if (exists) throw new Error("USERNAME_TAKEN");
        }),
      );
    }

    if (normalEmail) {
      checks.push(
        User.exists({
          email: normalEmail,
          _id: { $ne: req.user!.id },
        }).then((exists) => {
          if (exists) throw new Error("EMAIL_TAKEN");
        }),
      );
    }

    try {
      await Promise.all(checks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "USERNAME_TAKEN") {
        sendConflict(res, "This username is already taken.");
        return;
      }
      if (msg === "EMAIL_TAKEN") {
        sendConflict(res, "An account with this email already exists.");
        return;
      }
      throw err;
    }

    const $set: Record<string, string> = {};
    const updated: string[] = [];

    if (normalUsername) {
      $set.username = normalUsername;
      updated.push("username");
    }
    if (normalEmail) {
      $set.email = normalEmail;
      updated.push("email");
    }

    await User.findByIdAndUpdate(req.user!.id, { $set });

    sendOk(res, { updated });
  } catch (err) {
    sendServerError(res, "Failed to update profile.", err);
  }
}
