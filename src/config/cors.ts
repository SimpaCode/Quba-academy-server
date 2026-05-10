/**
 * src/config/cors.ts
 *
 * CORS configuration.
 * credentials: true is required so the browser sends the httpOnly
 * accessToken cookie with cross-origin requests to this Express server.
 */

import { CorsOptions } from "cors";
import { requireEnv } from "./env";

const ALLOWED_ORIGINS = [
  requireEnv("NEXT_PUBLIC_APP_URL"),
  process.env.NEXT_PUBLIC_APP_URL_STAGING,
].filter(Boolean) as string[];

export function getAllowedOrigins(): string[] {
  return [...ALLOWED_ORIGINS];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, curl)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Required for cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}
