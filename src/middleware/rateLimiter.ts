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
import { Redis } from "@upstash/redis";
import { requireEnv } from "../config/env";

const redis = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
});

// 60 req/min per IP — applied globally
export const defaultLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "rl:default",
});

// 20 req/min per IP — for AI and compute-heavy routes
export const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "rl:strict",
});

// 15 req / 10 min per IP — Vibe Lab Dojo outer guard (pairs with in-memory inner guard)
export const vibeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "10 m"),
  analytics: true,
  prefix: "rl:vibe",
});

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function withRateLimit(limiter: Ratelimit) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    // Expose rate limit headers for clients
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      res.status(429).json({
        success: false,
        msg: "Too many requests. Please try again later.",
      });
      return;
    }

    next();
  };
}
