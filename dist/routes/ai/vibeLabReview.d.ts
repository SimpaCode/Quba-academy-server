/**
 * src/routes/ai/vibeLabReview.ts
 *
 * POST /api/ai/vibe-lab
 *
 * Vibe Lab Dojo — AI review endpoint.
 * Model: meta-llama/llama-3.1-8b-instruct via OpenRouter (free tier, fast).
 *
 * Body: { action: "review", scenario, userPrompt, evaluationCriteria?, techniqueId? }
 * Response: { verdict, overallFeedback, dimensions, improvementTip, mentorPrompt }
 *
 * Rate limiting:
 *   - Upstash sliding window (vibeLimiter): 15 req / 10 min per IP — via middleware in index.ts
 *   - In-memory sliding window: mirrors the Next.js original for per-IP granularity
 *     without extra Redis calls inside the handler. Resets on server restart.
 *     Upgrade to Redis-backed store for multi-instance production deployments.
 *
 * Setup: add OPENROUTER_API_KEY to .env
 */
import { Request, Response } from "express";
export declare function postVibeLabReview(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=vibeLabReview.d.ts.map