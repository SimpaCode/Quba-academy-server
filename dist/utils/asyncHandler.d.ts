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
import { Request, Response, NextFunction, RequestHandler } from "express";
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map