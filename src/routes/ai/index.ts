/**
 * src/routes/ai/index.ts
 */

import { Router } from "express";
import { explainConcept } from "./explain";
import { postVibeLabReview } from "./vibeLabReview";
import { requireRole, ALL_ROLES } from "../../middleware/auth";
import {
  withRateLimit,
  strictLimiter,
  vibeLimiter,
} from "../../middleware/rateLimiter";

const router = Router();

// POST /api/ai/explain — streaming ELI5 explanation (Groq)
router.post(
  "/explain",
  requireRole(ALL_ROLES),
  withRateLimit(strictLimiter),
  explainConcept,
);

// POST /api/ai/vibe-lab — prompt review for Vibe Lab Dojo (OpenRouter)
// Uses both Upstash (outer) and in-memory (inner) rate limiting
router.post(
  "/vibe-lab",
  requireRole(ALL_ROLES),
  withRateLimit(vibeLimiter),
  postVibeLabReview,
);

export default router;
