"use strict";
/**
 * src/utils/asyncHandler.ts
 *
 * Wraps an async route handler so that any thrown error is
 * forwarded to Express's error handler via next(err).
 *
 * Without this, unhandled promise rejections in async handlers
 * silently time out instead of triggering the error handler.
 *
 * Usage:
 *   router.get("/path", asyncHandler(async (req, res) => { ... }))
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map