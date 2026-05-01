"use strict";
/**
 * src/middleware/notFound.ts
 *
 * 404 handler — registered after all routes.
 * Catches any request that didn't match a defined route.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
function notFound(req, res) {
    res.status(404).json({
        success: false,
        msg: `Route ${req.method} ${req.path} not found.`,
    });
}
//# sourceMappingURL=notFound.js.map