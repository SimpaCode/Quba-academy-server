/**
 * src/middleware/errorHandler.ts
 *
 * Global error handler — catches any error thrown in route handlers
 * that wasn't caught locally.
 *
 * Must be registered LAST in app.ts (after all routes).
 * Express identifies it as an error handler by the 4-argument signature.
 */
import { Request, Response, NextFunction } from "express";
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map