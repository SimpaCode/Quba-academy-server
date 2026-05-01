"use strict";
/**
 * src/middleware/requestLogger.ts
 *
 * Lightweight request logger. Logs method, path, status code,
 * and response time in milliseconds.
 *
 * Only applied when NODE_ENV !== "test" (see app.ts).
 * Replace with morgan or pino-http for production log shipping.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const color = res.statusCode >= 500
            ? "\x1b[31m" // red
            : res.statusCode >= 400
                ? "\x1b[33m" // yellow
                : "\x1b[32m"; // green
        const reset = "\x1b[0m";
        console.log(`${color}${req.method}${reset} ${req.path} ${color}${res.statusCode}${reset} — ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map