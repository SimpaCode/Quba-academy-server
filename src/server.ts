/**
 * src/server.ts
 *
 * HTTP server entry point.
 * Boot order:
 *   1. Validate environment variables
 *   2. Connect to MongoDB
 *   3. Start listening
 *   4. Register graceful shutdown handlers
 */

import "dotenv/config";
import { validateEnv } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

// Validate env before anything else — exits with code 1 if missing vars
validateEnv();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api\n`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received — shutting down gracefully`);

    server.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });

    // Force-exit after 10 s if the server hasn't drained
    setTimeout(() => {
      console.error("⚠️  Forced exit after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Surface unhandled promise rejections instead of silently swallowing them
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
