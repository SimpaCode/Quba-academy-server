/**
 * src/routes/admin/overview.ts
 *
 * GET /api/admin/overview
 */

import { Request, Response } from "express";
// import User from "../../models/User";
// import Level from "../../models/Level";
// import { sendOk, sendServerError } from "../../utils/response";

export async function getOverview(_req: Request, res: Response): Promise<void> {
  // try {
  //   const [totalUsers, totalLevels, activeSubscriptions] = await Promise.all([
  //     User.countDocuments(),
  //     Level.countDocuments({ isPublished: true }),
  //     User.countDocuments({ "subscription.status": "active" }),
  //   ]);
  //   sendOk(res, { totalUsers, totalLevels, activeSubscriptions });
  // } catch (err) {
  //   sendServerError(res, "Failed to load overview.", err);
  // }
}
