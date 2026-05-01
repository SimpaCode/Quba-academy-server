"use strict";
/**
 * src/middleware/errorHandler.ts
 *
 * Global error handler — catches any error thrown in route handlers
 * that wasn't caught locally.
 *
 * Must be registered LAST in app.ts (after all routes).
 * Express identifies it as an error handler by the 4-argument signature.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error("[Unhandled Error]", err.message, err.stack);
    // CORS errors bubbled up from our cors config
    if (err.message.includes("not allowed by CORS")) {
        res.status(403).json({ success: false, msg: err.message });
        return;
    }
    res.status(500).json({
        success: false,
        msg: "Something went wrong. Please try again.",
    });
}
//# sourceMappingURL=errorHandler.js.map