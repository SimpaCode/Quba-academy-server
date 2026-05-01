"use strict";
/**
 * src/routes/ai/index.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const explain_1 = require("./explain");
const vibeLabReview_1 = require("./vibeLabReview");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
// POST /api/ai/explain — streaming ELI5 explanation (Groq)
router.post("/explain", (0, auth_1.requireRole)(auth_1.ALL_ROLES), (0, rateLimiter_1.withRateLimit)(rateLimiter_1.strictLimiter), explain_1.explainConcept);
// POST /api/ai/vibe-lab — prompt review for Vibe Lab Dojo (OpenRouter)
// Uses both Upstash (outer) and in-memory (inner) rate limiting
router.post("/vibe-lab", (0, auth_1.requireRole)(auth_1.ALL_ROLES), (0, rateLimiter_1.withRateLimit)(rateLimiter_1.vibeLimiter), vibeLabReview_1.postVibeLabReview);
exports.default = router;
//# sourceMappingURL=index.js.map