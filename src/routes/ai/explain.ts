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
import { requireEnv } from "../../config/env";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ── System prompt ──────────────────────────────────────────────────────────────
// Mirrors the persona from the Next.js route exactly.

const SYSTEM_PROMPT = `You are Quba, an AI mentor at a code academy for beginners.
Your job is to explain a web development concept in the clearest, most vivid way possible.

Rules:
- Explain as if talking to a curious 12-year-old who has never coded before.
- Use one or two concrete real-world analogies. Build on the existing analogy when given one.
- Never use raw technical terms without immediately explaining them in plain English.
- Keep it to 2–3 short paragraphs. No bullet points. No headers. No code snippets.
- End with one encouraging sentence that connects the concept back to building something real.
- Be warm, direct, and a little playful. Avoid being robotic or textbook-y.`;

// ── Handler ────────────────────────────────────────────────────────────────────

export async function explainConcept(
  req: Request,
  res: Response,
): Promise<void> {
  let topic: string;
  let analogy: string;

  try {
    const body = req.body as { topic?: unknown; analogy?: unknown };
    topic = typeof body.topic === "string" ? body.topic.trim() : "";
    analogy = typeof body.analogy === "string" ? body.analogy.trim() : "";
  } catch {
    res.status(400).json({ success: false, msg: "Invalid request body." });
    return;
  }

  if (!topic) {
    res.status(400).json({ success: false, msg: "topic is required." });
    return;
  }

  // Mirrors the userMessage logic from the Next.js route exactly
  const userMessage = analogy
    ? `Explain the concept of "${topic}" to me like I'm 5.\n\nHere's an analogy I've already seen: "${analogy}"\n\nBuild on it or give me a fresh, different angle that clicks even better.`
    : `Explain the concept of "${topic}" to me like I'm 5. Use a vivid real-world analogy.`;

  try {
    // Call Groq with stream: true (OpenAI-compatible endpoint)
    const upstream = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${requireEnv("GROQ_API_KEY")}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[ai/explain] Groq error:", errText);
      res
        .status(502)
        .json({ success: false, msg: "Failed to generate explanation." });
      return;
    }

    // Stream headers — same as Next.js route
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Parse SSE stream from Groq and pipe text deltas to the response.
    // Groq sends OpenAI-compatible SSE:
    //   data: {"choices":[{"delta":{"content":"..."},"finish_reason":null}]}
    //   data: [DONE]
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;

          try {
            const event = JSON.parse(json) as {
              choices?: { delta?: { content?: string } }[];
            };
            const text = event.choices?.[0]?.delta?.content;
            if (typeof text === "string" && text) {
              res.write(text);
            }
          } catch {
            // Malformed JSON line — skip silently
          }
        }
      }
    } finally {
      res.end();
    }
  } catch (err) {
    console.error("[ai/explain] Unexpected error:", err);
    // If headers already sent we can't send a JSON error
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, msg: "Failed to generate explanation." });
    } else {
      res.end();
    }
  }
}
