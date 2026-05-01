"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.vibeLimiter = exports.strictLimiter = exports.defaultLimiter = void 0;
exports.withRateLimit = withRateLimit;
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = require("@upstash/redis");
const env_1 = require("../config/env");
const redis = new redis_1.Redis({
    url: (0, env_1.requireEnv)("UPSTASH_REDIS_REST_URL"),
    token: (0, env_1.requireEnv)("UPSTASH_REDIS_REST_TOKEN"),
});
// 60 req/min per IP — applied globally
exports.defaultLimiter = new ratelimit_1.Ratelimit({
    redis,
    limiter: ratelimit_1.Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "rl:default",
});
// 20 req/min per IP — for AI and compute-heavy routes
exports.strictLimiter = new ratelimit_1.Ratelimit({
    redis,
    limiter: ratelimit_1.Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "rl:strict",
});
// 15 req / 10 min per IP — Vibe Lab Dojo outer guard (pairs with in-memory inner guard)
exports.vibeLimiter = new ratelimit_1.Ratelimit({
    redis,
    limiter: ratelimit_1.Ratelimit.slidingWindow(15, "10 m"),
    analytics: true,
    prefix: "rl:vibe",
});
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress ?? "unknown";
}
function withRateLimit(limiter) {
    return async (req, res, next) => {
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
//# sourceMappingURL=rateLimiter.js.map