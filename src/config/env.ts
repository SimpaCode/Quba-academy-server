/**
 * src/config/env.ts
 *
 * Validates all required environment variables at startup.
 * The server refuses to start if any required variable is missing.
 * This prevents cryptic runtime errors deep in request handlers.
 */

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
] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables:\n${missing
        .map((k) => `   - ${k}`)
        .join("\n")}\n`,
    );
    process.exit(1);
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" is not set.`);
  }
  return value;
}
