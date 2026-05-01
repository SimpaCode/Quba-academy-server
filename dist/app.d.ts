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
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=app.d.ts.map