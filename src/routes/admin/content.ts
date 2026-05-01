/**
 * src/routes/admin/content.ts
 *
 * GET    /api/admin/content
 * POST   /api/admin/content
 * GET    /api/admin/content/:levelId
 * PATCH  /api/admin/content/:levelId
 * DELETE /api/admin/content/:levelId
 * POST   /api/admin/content/:levelId/missions
 * PATCH  /api/admin/content/:levelId/missions/:missionId
 * DELETE /api/admin/content/:levelId/missions/:missionId
 */

import { Request, Response } from "express";

export async function getContent(_req: Request, res: Response): Promise<void> {}

export async function postLevel(req: Request, res: Response): Promise<void> {}

export async function getLevelDetail(
  req: Request,
  res: Response,
): Promise<void> {}

export async function patchLevel(req: Request, res: Response): Promise<void> {}

export async function deleteLevel(req: Request, res: Response): Promise<void> {}

export async function postMission(req: Request, res: Response): Promise<void> {}

export async function patchMission(
  req: Request,
  res: Response,
): Promise<void> {}

export async function deleteMission(
  req: Request,
  res: Response,
): Promise<void> {}
