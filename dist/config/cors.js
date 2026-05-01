"use strict";
/**
 * src/config/cors.ts
 *
 * CORS configuration.
 * credentials: true is required so the browser sends the httpOnly
 * accessToken cookie with cross-origin requests to this Express server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCorsOptions = buildCorsOptions;
const env_1 = require("./env");
function buildCorsOptions() {
    const allowedOrigins = [
        (0, env_1.requireEnv)("NEXT_PUBLIC_APP_URL"),
        process.env.NEXT_PUBLIC_APP_URL_STAGING,
    ].filter(Boolean);
    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (server-to-server, Postman, curl)
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true, // Required for cookies to be sent cross-origin
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
}
//# sourceMappingURL=cors.js.map