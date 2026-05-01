"use strict";
/**
 * src/config/env.ts
 *
 * Validates all required environment variables at startup.
 * The server refuses to start if any required variable is missing.
 * This prevents cryptic runtime errors deep in request handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.requireEnv = requireEnv;
const REQUIRED = [
    "MONGODB_URI",
    "ACCESS_TOKEN_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RESEND_API_KEY",
    "RESEND_DOMAIN",
    "RESEND_FROM_EMAIL",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
];
function validateEnv() {
    const missing = REQUIRED.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`\n❌ Missing required environment variables:\n${missing
            .map((k) => `   - ${k}`)
            .join("\n")}\n`);
        process.exit(1);
    }
}
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable "${key}" is not set.`);
    }
    return value;
}
//# sourceMappingURL=env.js.map