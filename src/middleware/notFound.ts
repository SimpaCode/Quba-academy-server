/**
 * src/middleware/notFound.ts
 *
 * 404 handler — registered after all routes.
 * Catches any request that didn't match a defined route.
 */

import { Request, Response } from "express";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    msg: `Route ${req.method} ${req.path} not found.`,
  });
}
