// DELETE /api/user/account

import { Request, Response } from "express";
import { z } from "zod";
import User from "../../models/User";
import UserProgress from "../../models/UserProgress";
import RefreshToken from "../../models/RefreshToken";
import { sendOk, sendBadRequest, sendServerError } from "../../utils/response";

const DeleteAccountSchema = z.object({
  confirmation: z.literal("delete my account"),
});

export async function deleteAccount(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parsed = DeleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, 'Please type "delete my account" to confirm.');
      return;
    }

    await Promise.all([
      RefreshToken.deleteMany({ userId: req.user!.id }),
      UserProgress.deleteOne({ userId: req.user!.id }),
      User.findByIdAndDelete(req.user!.id),
    ]);

    // Clear auth cookies
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    res.cookie("accessToken", "", cookieBase);
    res.cookie("refreshToken", "", cookieBase);

    sendOk(res, { message: "Your account has been permanently deleted." });
  } catch (err) {
    sendServerError(res, "Failed to delete account.", err);
  }
}
