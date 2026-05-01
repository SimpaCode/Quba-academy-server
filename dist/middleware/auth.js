"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDENT_ONLY = exports.ADMIN_ROLES = exports.ALL_ROLES = void 0;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
exports.ALL_ROLES = ["student", "admin", "super_admin"];
exports.ADMIN_ROLES = ["admin", "super_admin"];
exports.STUDENT_ONLY = ["student"];
function requireRole(allowedRoles) {
    return (req, res, next) => {
        const token = req.cookies?.accessToken;
        if (!token) {
            (0, response_1.sendUnauthorized)(res, "Authentication required.");
            return;
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, (0, env_1.requireEnv)("ACCESS_TOKEN_SECRET"));
        }
        catch (err) {
            const isExpired = err instanceof jsonwebtoken_1.default.TokenExpiredError;
            res.status(401).json({
                success: false,
                msg: isExpired ? "Session expired." : "Invalid token.",
                code: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
            });
            return;
        }
        if (!allowedRoles.includes(payload.role)) {
            (0, response_1.sendForbidden)(res, "You do not have permission to do this.");
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
//# sourceMappingURL=auth.js.map