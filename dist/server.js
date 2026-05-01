"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const app_1 = __importDefault(require("./app"));
// Validate env before anything else — exits with code 1 if missing vars
(0, env_1.validateEnv)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
async function start() {
    await (0, db_1.connectDB)();
    const server = app_1.default.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   API:    http://localhost:${PORT}/api\n`);
    });
    // ── Graceful shutdown ──────────────────────────────────────────────────────
    const shutdown = (signal) => {
        console.log(`\n${signal} received — shutting down gracefully`);
        server.close(() => {
            console.log("✅ HTTP server closed");
            process.exit(0);
        });
        // Force-exit after 10 s if the server hasn't drained
        setTimeout(() => {
            console.error("⚠️  Forced exit after timeout");
            process.exit(1);
        }, 10000).unref();
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
//# sourceMappingURL=server.js.map