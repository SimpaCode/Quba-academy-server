/**
 * src/routes/ai/explain.ts
 *
 * POST /api/ai/explain
 *
 * Streams an "Explain Like I'm 5" explanation for a given mission concept.
 * Backs the ExplainSimply drawer on the mission page.
 *
 * Body: { topic: string; analogy?: string }
 *   topic   — the mission subtitle / concept name (e.g. "The Box Model")
 *   analogy — the mission's existing analogy for context (optional)
 *
 * Returns: a streaming plain-text response.
 * The client reads it with a ReadableStream reader and appends chunks.
 *
 * Provider: Groq (free tier) — llama-3.3-70b-versatile
 *   Sign up at https://console.groq.com → API Keys → Create key
 *   Free tier: 14,400 req/day, 500,000 tokens/day — plenty for dev + early prod.
 *
 * Groq's API is OpenAI-compatible and returns standard SSE:
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 * So we parse it the same way as the Next.js Anthropic version, just different
 * SSE field paths (choices[0].delta.content vs delta.text).
 */
import { Request, Response } from "express";
export declare function explainConcept(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=explain.d.ts.map