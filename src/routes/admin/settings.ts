/**
 * src/routes/admin/settings.ts
 *
 * GET   /api/admin/settings
 * PATCH /api/admin/settings
 *
 * Global app settings (stored in a singleton doc or env-controlled).
 * Extend this as your admin settings grow.
 */

import { Request, Response } from "express";
// import { sendOk, sendServerError } from "../../utils/response";

// Stub — replace with a Settings model or config store as needed
// const appSettings = {
//   maintenanceMode: false,
//   allowNewRegistrations: true,
//   defaultPlan: "free",
// };

export async function getAdminSettings(
  _req: Request,
  res: Response,
): Promise<void> {
  // try {
  //   sendOk(res, appSettings);
  // } catch (err) {
  //   sendServerError(res, "Failed to load admin settings.", err);
  // }
}

export async function patchAdminSettings(
  req: Request,
  res: Response,
): Promise<void> {
  // try {
  //   Object.assign(appSettings, req.body);
  //   sendOk(res, appSettings);
  // } catch (err) {
  //   sendServerError(res, "Failed to update admin settings.", err);
  // }
}
