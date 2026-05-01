/**
 * src/types/express.d.ts
 *
 * Augments the Express Request type to include req.user.
 * Set by the auth middleware after JWT verification.
 * All authenticated route handlers can safely access req.user.
 *
 * NOTE: No top-level import/export here — this must be a pure
 * declaration file (ambient module) so the augmentation is global.
 * Adding any import/export would make it a module and break merging.
 */

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: "student" | "admin" | "super_admin";
      email: string;
    };
  }
}
