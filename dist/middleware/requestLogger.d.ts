/**
 * src/middleware/requestLogger.ts
 *
 * Lightweight request logger. Logs method, path, status code,
 * and response time in milliseconds.
 *
 * Only applied when NODE_ENV !== "test" (see app.ts).
 * Replace with morgan or pino-http for production log shipping.
 */
import { Request, Response, NextFunction } from "express";
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map