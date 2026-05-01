/**
 * src/middleware/rateLimiter.ts
 *
 * Upstash Redis rate limiting middleware.
 *
 * Default: 60 requests per minute per IP.
 * Strict:  20 requests per minute (for AI/expensive routes).
 *
 * Usage:
 *   router.use(withRateLimit(defaultLimiter))   // on a whole router
 *   router.post("/explain", withRateLimit(strictLimiter), handler)
 */
import { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
export declare const defaultLimiter: Ratelimit;
export declare const strictLimiter: Ratelimit;
export declare const vibeLimiter: Ratelimit;
export declare function withRateLimit(limiter: Ratelimit): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimiter.d.ts.map