/**
 * src/config/env.ts
 *
 * Validates all required environment variables at startup.
 * The server refuses to start if any required variable is missing.
 * This prevents cryptic runtime errors deep in request handlers.
 */
export declare function validateEnv(): void;
export declare function requireEnv(key: string): string;
//# sourceMappingURL=env.d.ts.map