import { Request, Response, NextFunction } from "express";
import { isAllowedOrigin } from "../config/cors";

function getRequestOrigin(req: Request): string | undefined {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin) return origin;

  const referer = req.headers.referer;
  if (typeof referer === "string" && referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = getRequestOrigin(req);

  if (!origin || !isAllowedOrigin(origin)) {
    res.status(403).json({
      success: false,
      msg: "Request origin is not allowed.",
    });
    return;
  }

  next();
}
