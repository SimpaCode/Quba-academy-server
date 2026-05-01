// POST /api/user/reset-progress

import { Request, Response } from "express";
import { resetProgress } from "../../services/progressService";
import { sendOk, sendServerError } from "../../utils/response";

export async function postResetProgress(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await resetProgress(req.user!.id);
    sendOk(res, { message: "Progress reset successfully." });
  } catch (err) {
    sendServerError(res, "Failed to reset progress.", err);
  }
}
