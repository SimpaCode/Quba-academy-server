/**
 * src/app.ts
 *
 * Express application setup.
 * Middleware registration order matters:
 *   1. Security (helmet, trust proxy)
 *   2. CORS
 *   3. Body parsing + cookies
 *   4. Request logger
 *   5. Routes
 *   6. 404 handler
 *   7. Global error handler  ← must be last
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { buildCorsOptions } from "./config/cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { defaultLimiter, withRateLimit } from "./middleware/rateLimiter";
import router from "./routes/index";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.set("trust proxy", 1); // Trust first proxy — required for correct client IP in rate limiter

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = buildCorsOptions();
app.use(cors(corsOptions));

// ── Body parsing + cookies ────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Required to read the httpOnly accessToken cookie

// ── Request logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", withRateLimit(defaultLimiter), router);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global error handler (must be registered last) ────────────────────────────
app.use(errorHandler);

export default app;
