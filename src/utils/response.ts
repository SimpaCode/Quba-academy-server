/**
 * src/utils/response.ts
 *
 * Consistent response helpers — all route handlers use these
 * instead of res.json() directly to ensure a uniform API shape.
 */

import { Response } from "express";

export function sendOk<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function sendCreated<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendBadRequest(
  res: Response,
  msg: string,
  code?: string,
): void {
  res.status(400).json({ success: false, msg, ...(code ? { code } : {}) });
}

export function sendUnauthorized(
  res: Response,
  msg = "Authentication required.",
): void {
  res.status(401).json({ success: false, msg });
}

export function sendForbidden(
  res: Response,
  msg = "You do not have permission to do this.",
  options?: Record<string, unknown>,
): void {
  res.status(403).json({ success: false, msg, ...(options ?? {}) });
}

export function sendNotFound(res: Response, resource = "Resource"): void {
  res.status(404).json({ success: false, msg: `${resource} not found.` });
}

export function sendConflict(res: Response, msg: string): void {
  res.status(409).json({ success: false, msg });
}

export function sendTooManyRequests(res: Response): void {
  res
    .status(429)
    .json({ success: false, msg: "Too many requests. Please try again later." });
}

export function sendServerError(
  res: Response,
  msg = "Something went wrong. Please try again.",
  err?: unknown,
): void {
  if (err) {
    console.error("[API Error]", err instanceof Error ? err.message : err);
  }
  res.status(500).json({ success: false, msg });
}
