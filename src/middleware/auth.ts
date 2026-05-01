/**
 * src/middleware/auth.ts
 *
 * JWT verification middleware — Express equivalent of withRole().
 *
 * Reads the accessToken from the request cookie, verifies it,
 * checks the role against the allowed list, and attaches the
 * decoded payload to req.user.
 *
 * Usage:
 *   router.get("/dashboard", requireRole(ALL_ROLES), handler)
 *   router.delete("/account", requireRole(STUDENT_ONLY), handler)
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireEnv } from "../config/env";
import { sendUnauthorized, sendForbidden } from "../utils/response";
import { UserRole } from "../types";

export const ALL_ROLES: UserRole[] = ["student", "admin", "super_admin"];
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];
export const STUDENT_ONLY: UserRole[] = ["student"];

interface TokenPayload {
  id: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.accessToken;

    if (!token) {
      sendUnauthorized(res, "Authentication required.");
      return;
    }

    let payload: TokenPayload;

    try {
      payload = jwt.verify(
        token,
        requireEnv("ACCESS_TOKEN_SECRET"),
      ) as TokenPayload;
    } catch (err) {
      const isExpired = err instanceof jwt.TokenExpiredError;
      res.status(401).json({
        success: false,
        msg: isExpired ? "Session expired." : "Invalid token.",
        code: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      });
      return;
    }

    if (!allowedRoles.includes(payload.role)) {
      sendForbidden(res, "You do not have permission to do this.");
      return;
    }

    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    next();
  };
}
