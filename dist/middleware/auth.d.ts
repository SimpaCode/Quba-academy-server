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
import { UserRole } from "../types";
export declare const ALL_ROLES: UserRole[];
export declare const ADMIN_ROLES: UserRole[];
export declare const STUDENT_ONLY: UserRole[];
export declare function requireRole(allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map