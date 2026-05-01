"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const cors_2 = require("./config/cors");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
// ── Security ──────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.set("trust proxy", 1); // Trust first proxy — required for correct client IP in rate limiter
// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = (0, cors_2.buildCorsOptions)();
app.use((0, cors_1.default)(corsOptions));
// ── Body parsing + cookies ────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)()); // Required to read the httpOnly accessToken cookie
// ── Request logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use(requestLogger_1.requestLogger);
}
// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", index_1.default);
// ── 404 ───────────────────────────────────────────────────────────────────────
app.use(notFound_1.notFound);
// ── Global error handler (must be registered last) ────────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map