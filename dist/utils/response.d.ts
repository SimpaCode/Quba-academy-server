/**
 * src/utils/response.ts
 *
 * Consistent response helpers — all route handlers use these
 * instead of res.json() directly to ensure a uniform API shape.
 */
import { Response } from "express";
export declare function sendOk<T>(res: Response, data: T, status?: number): void;
export declare function sendCreated<T>(res: Response, data: T): void;
export declare function sendNoContent(res: Response): void;
export declare function sendBadRequest(res: Response, msg: string, code?: string): void;
export declare function sendUnauthorized(res: Response, msg?: string): void;
export declare function sendForbidden(res: Response, msg?: string, options?: Record<string, unknown>): void;
export declare function sendNotFound(res: Response, resource?: string): void;
export declare function sendConflict(res: Response, msg: string): void;
export declare function sendTooManyRequests(res: Response): void;
export declare function sendServerError(res: Response, msg?: string, err?: unknown): void;
//# sourceMappingURL=response.d.ts.map