/**
 * src/routes/ai/vibeLabReview.ts
 *
 * POST /api/ai/vibe-lab
 *
 * Vibe Lab Dojo — AI review endpoint.
 * Model: meta-llama/llama-3.1-8b-instruct via OpenRouter.
 *
 * Body: { action: "review", scenario, userPrompt, evaluationCriteria?, techniqueId? }
 * Response: { verdict, overallFeedback, dimensions, improvementTip, mentorPrompt }
 *
 * Rate limiting:
 *   - Upstash sliding window (vibeLimiter): 15 req / 10 min per IP — via middleware in index.ts
 *   - No process-local limiter, so behavior stays consistent across instances.
 */

import { Request, Response } from "express";
import { requireEnv } from "../../config/env";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.1-8b-instruct";

const LIMITS = {
  USER_PROMPT_MAX: 1500,
  SCENARIO_MAX: 800,
  TIMEOUT_MS: 25_000,
} as const;

async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 800,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIMITS.TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireEnv("OPENROUTER_API_KEY")}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Vibe Lab Prompt Dojo",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Empty response from model");
    }

    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function extractJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    /* continue */
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      /* continue */
    }
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      /* continue */
    }
  }

  throw new Error("Could not extract valid JSON from model response");
}

function sanitize(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[`]/g, "'")
    .replace(/\n{4,}/g, "\n\n\n")
    .slice(0, maxLen)
    .trim();
}

const REVIEW_SYSTEM = `You are a concise, encouraging coding mentor at a beginner vibe-coding academy.
Students are learning to build with HTML, Tailwind CSS, and vanilla JavaScript.
They are also practising AI prompting techniques like: giving the AI a role, building in steps, setting rules first, showing examples, making the AI think out loud, asking the AI to review itself, and comparing multiple options.
React, Next.js, Vue, backend frameworks = out of scope — flag these gently if they appear.
Be warm, direct, and concrete. One sentence per point. No filler.`;

const TECHNIQUE_HINTS: Record<string, string> = {
  "set-rules":
    " — student should define rules/constraints BEFORE the task description",
  "think-aloud":
    " — student should ask the AI to reason step-by-step before answering",
  "show-examples":
    " — student should include 2+ examples before the actual request",
  "give-a-role": " — student should assign the AI a specific role or identity",
  "ask-to-improve":
    " — student should ask the AI to critique and improve its own answer",
  "explore-options":
    " — student should ask for multiple options to compare, with a recommendation",
  "ai-writes-prompt":
    " — student should ask the AI to WRITE a prompt (not build the feature directly)",
  "chain-prompts":
    " — student should write multiple sequential steps, each feeding the next",
  "force-fresh":
    " — student should ask the AI to flag outdated info or use a web-connected tool",
  "quick-ask": " — student should write a clear, specific, direct request",
};

function buildReviewPrompt(
  scenario: string,
  userPrompt: string,
  evaluationCriteria: string[],
  techniqueId: string,
): string {
  const criteriaBlock =
    evaluationCriteria.length > 0
      ? `\nEVALUATION CRITERIA (check each):\n${evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";

  const techniqueHint = TECHNIQUE_HINTS[techniqueId] ?? "";

  return `SCENARIO given to the student:
"${scenario}"

TECHNIQUE being practised: ${techniqueId}${techniqueHint}
${criteriaBlock}

STUDENT'S PROMPT:
"${userPrompt}"

Evaluate the student's prompt. Check each evaluation criterion above. Write one short plain-English sentence per criterion.

VERDICT rules:
- PASS: at least 60% of criteria clearly addressed AND the prompt applies the target technique
- RETRY: fewer than 60% addressed, OR the technique is not evident

Write the MENTOR PROMPT — the gold-standard answer for this scenario.
It must use ONLY HTML, Tailwind CSS, and vanilla JavaScript (unless the scenario specifies otherwise).
3–6 sentences. Specific, clear, beginner-friendly. Apply the target technique correctly.

Respond ONLY in this exact JSON. No markdown fences, no extra keys:
{
  "verdict": "PASS",
  "overallFeedback": "One warm, specific sentence about the overall quality.",
  "dimensions": [
    { "label": "Criterion label here", "passed": true, "note": "One sentence." }
  ],
  "improvementTip": "One concrete, actionable tip. If PASS: affirm and suggest one next-level refinement.",
  "mentorPrompt": "The gold-standard prompt for this scenario."
}`;
}

interface ReviewPayload {
  verdict: "PASS" | "RETRY";
  overallFeedback: string;
  dimensions: { label: string; passed: boolean; note: string }[];
  improvementTip: string;
  mentorPrompt: string;
}

function validateReview(raw: unknown, expectedCriteria: string[]): ReviewPayload {
  const obj = (raw ?? {}) as Record<string, unknown>;

  if (obj.verdict !== "PASS" && obj.verdict !== "RETRY") obj.verdict = "RETRY";

  if (typeof obj.overallFeedback !== "string" || !obj.overallFeedback) {
    obj.overallFeedback = "Review complete.";
  }

  if (!Array.isArray(obj.dimensions)) obj.dimensions = [];

  const validDims = (obj.dimensions as unknown[]).filter(
    (d): d is { label: string; passed: boolean; note: string } =>
      d != null &&
      typeof (d as Record<string, unknown>).label === "string" &&
      typeof (d as Record<string, unknown>).passed === "boolean" &&
      typeof (d as Record<string, unknown>).note === "string",
  );

  if (validDims.length < expectedCriteria.length) {
    const existingLabels = new Set(validDims.map((d) => d.label));
    for (const label of expectedCriteria) {
      if (!existingLabels.has(label)) {
        validDims.push({
          label,
          passed: false,
          note: "Not clearly addressed in the prompt.",
        });
      }
    }
  }

  obj.dimensions = validDims;

  if (typeof obj.improvementTip !== "string" || !obj.improvementTip) {
    obj.improvementTip =
      "Try to be more specific about your technique and constraints.";
  }

  if (typeof obj.mentorPrompt !== "string" || obj.mentorPrompt.length < 20) {
    obj.mentorPrompt =
      "Build this feature using HTML, Tailwind CSS, and vanilla JavaScript. Be specific about fields, interactions, and visual style.";
  }

  return obj as unknown as ReviewPayload;
}

const FALLBACK_RESPONSE: ReviewPayload = {
  verdict: "RETRY",
  overallFeedback: "The review couldn't complete — please try submitting again.",
  dimensions: [],
  improvementTip: "Try again — sometimes the model needs a second attempt.",
  mentorPrompt: "",
};

export async function postVibeLabReview(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const userPrompt = sanitize(body.userPrompt, LIMITS.USER_PROMPT_MAX);
  const scenario = sanitize(body.scenario, LIMITS.SCENARIO_MAX);
  const techniqueId =
    typeof body.techniqueId === "string"
      ? body.techniqueId.slice(0, 60)
      : "unknown";

  let evaluationCriteria: string[] = [];
  if (Array.isArray(body.evaluationCriteria)) {
    evaluationCriteria = (body.evaluationCriteria as unknown[])
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.slice(0, 200))
      .slice(0, 10);
  }

  if (!userPrompt) {
    res.status(400).json({ success: false, msg: "'userPrompt' is required." });
    return;
  }

  if (!scenario) {
    res.status(400).json({ success: false, msg: "'scenario' is required." });
    return;
  }

  if (userPrompt.length < 15) {
    res.status(200).json({
      verdict: "RETRY",
      overallFeedback:
        "Your prompt is too short to evaluate — write at least a sentence or two.",
      dimensions: [],
      improvementTip:
        "Tell the AI the technique you're using, the stack, and what you want it to do.",
      mentorPrompt: "",
    });
    return;
  }

  try {
    const raw = await callAI(
      REVIEW_SYSTEM,
      buildReviewPrompt(scenario, userPrompt, evaluationCriteria, techniqueId),
      900,
    );

    const parsed = extractJSON(raw);
    const validated = validateReview(parsed, evaluationCriteria);

    res.status(200).json(validated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ai/vibe-lab]", { techniqueId, error: message });

    if (message.includes("abort")) {
      res.status(504).json({
        success: false,
        msg: "Request timed out — the AI took too long. Please try again.",
      });
      return;
    }

    res.status(200).json(FALLBACK_RESPONSE);
  }
}
