"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.postVibeLabReview = postVibeLabReview;
const env_1 = require("../../config/env");
// ── Constants ──────────────────────────────────────────────────────────────────
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.1-8b-instruct";
const LIMITS = {
    USER_PROMPT_MAX: 1500,
    SCENARIO_MAX: 800,
    CRITERIA_MAX: 2000,
    TIMEOUT_MS: 25000,
};
// ── In-memory rate limiter ─────────────────────────────────────────────────────
// Mirrors the Next.js implementation exactly.
// 15 requests per 10-minute sliding window per IP.
const RATE = {
    MAX_REQUESTS: 15,
    WINDOW_MS: 10 * 60000,
    MAX_IPS: 5000,
};
const rateLimitStore = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE.WINDOW_MS;
    // Evict oldest entry if at capacity (simple LRU approximation)
    if (!rateLimitStore.has(ip) && rateLimitStore.size >= RATE.MAX_IPS) {
        const oldest = rateLimitStore.keys().next().value;
        if (oldest)
            rateLimitStore.delete(oldest);
    }
    const timestamps = (rateLimitStore.get(ip) ?? []).filter((t) => t > windowStart);
    if (timestamps.length >= RATE.MAX_REQUESTS) {
        const oldest = timestamps[0];
        const retryAfterMs = oldest + RATE.WINDOW_MS - now;
        return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
    }
    timestamps.push(now);
    rateLimitStore.set(ip, timestamps);
    return { allowed: true, retryAfterSec: 0 };
}
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null;
    return ip ?? req.socket.remoteAddress ?? "unknown";
}
// ── AI caller ──────────────────────────────────────────────────────────────────
async function callAI(systemPrompt, userMessage, maxTokens = 800) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LIMITS.TIMEOUT_MS);
    try {
        const res = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${(0, env_1.requireEnv)("OPENROUTER_API_KEY")}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
        const data = (await res.json());
        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== "string" || !content.trim()) {
            throw new Error("Empty response from model");
        }
        return content.trim();
    }
    finally {
        clearTimeout(timeout);
    }
}
// ── JSON extractor ─────────────────────────────────────────────────────────────
function extractJSON(raw) {
    // 1. Direct parse
    try {
        return JSON.parse(raw);
    }
    catch {
        /* continue */
    }
    // 2. Strip markdown fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        }
        catch {
            /* continue */
        }
    }
    // 3. Extract outermost { } block
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
        try {
            return JSON.parse(raw.slice(start, end + 1));
        }
        catch {
            /* continue */
        }
    }
    throw new Error("Could not extract valid JSON from model response");
}
// ── Input sanitiser ────────────────────────────────────────────────────────────
function sanitize(value, maxLen) {
    if (typeof value !== "string")
        return "";
    return value
        .replace(/[`]/g, "'")
        .replace(/\n{4,}/g, "\n\n\n")
        .slice(0, maxLen)
        .trim();
}
// ── Review system prompt ───────────────────────────────────────────────────────
const REVIEW_SYSTEM = `You are a concise, encouraging coding mentor at a beginner vibe-coding academy.
Students are learning to build with HTML, Tailwind CSS, and vanilla JavaScript.
They are also practising AI prompting techniques like: giving the AI a role, building in steps, setting rules first, showing examples, making the AI think out loud, asking the AI to review itself, and comparing multiple options.
React, Next.js, Vue, backend frameworks = out of scope — flag these gently if they appear.
Be warm, direct, and concrete. One sentence per point. No filler.`;
const TECHNIQUE_HINTS = {
    "set-rules": " — student should define rules/constraints BEFORE the task description",
    "think-aloud": " — student should ask the AI to reason step-by-step before answering",
    "show-examples": " — student should include 2+ examples before the actual request",
    "give-a-role": " — student should assign the AI a specific role or identity",
    "ask-to-improve": " — student should ask the AI to critique and improve its own answer",
    "explore-options": " — student should ask for multiple options to compare, with a recommendation",
    "ai-writes-prompt": " — student should ask the AI to WRITE a prompt (not build the feature directly)",
    "chain-prompts": " — student should write multiple sequential steps, each feeding the next",
    "force-fresh": " — student should ask the AI to flag outdated info or use a web-connected tool",
    "quick-ask": " — student should write a clear, specific, direct request",
};
function buildReviewPrompt(scenario, userPrompt, evaluationCriteria, techniqueId) {
    const criteriaBlock = evaluationCriteria.length > 0
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
function validateReview(raw, expectedCriteria) {
    const obj = (raw ?? {});
    if (obj.verdict !== "PASS" && obj.verdict !== "RETRY")
        obj.verdict = "RETRY";
    if (typeof obj.overallFeedback !== "string" || !obj.overallFeedback) {
        obj.overallFeedback = "Review complete.";
    }
    if (!Array.isArray(obj.dimensions))
        obj.dimensions = [];
    const validDims = obj.dimensions.filter((d) => d != null &&
        typeof d.label === "string" &&
        typeof d.passed === "boolean" &&
        typeof d.note === "string");
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
    return obj;
}
const FALLBACK_RESPONSE = {
    verdict: "RETRY",
    overallFeedback: "The review couldn't complete — please try submitting again.",
    dimensions: [],
    improvementTip: "Try again — sometimes the model needs a second attempt.",
    mentorPrompt: "",
};
// ── Handler ────────────────────────────────────────────────────────────────────
async function postVibeLabReview(req, res) {
    // ── In-memory rate limit (15 req / 10 min per IP) ──────────────────────────
    const ip = getClientIp(req);
    const { allowed, retryAfterSec } = checkRateLimit(ip);
    if (!allowed) {
        res.setHeader("Retry-After", String(retryAfterSec));
        res.setHeader("X-RateLimit-Limit", String(RATE.MAX_REQUESTS));
        res.setHeader("X-RateLimit-Window", "600");
        res.status(429).json({
            success: false,
            msg: `Too many requests. You've used your ${RATE.MAX_REQUESTS} reviews for this 10-minute window. Try again in ${Math.ceil(retryAfterSec / 60)} minute${retryAfterSec > 60 ? "s" : ""}.`,
            retryAfter: retryAfterSec,
        });
        return;
    }
    // ── Parse body ─────────────────────────────────────────────────────────────
    const body = req.body;
    const { action } = body;
    if (action !== "review") {
        res.status(400).json({
            success: false,
            msg: `Unknown action: '${String(action)}'. Expected 'review'.`,
        });
        return;
    }
    // ── Sanitise inputs ────────────────────────────────────────────────────────
    const userPrompt = sanitize(body.userPrompt, LIMITS.USER_PROMPT_MAX);
    const scenario = sanitize(body.scenario, LIMITS.SCENARIO_MAX);
    const techniqueId = typeof body.techniqueId === "string"
        ? body.techniqueId.slice(0, 60)
        : "unknown";
    let evaluationCriteria = [];
    if (Array.isArray(body.evaluationCriteria)) {
        evaluationCriteria = body.evaluationCriteria
            .filter((c) => typeof c === "string")
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
    // Minimum length guard — avoids burning tokens on empty submissions
    if (userPrompt.length < 15) {
        res.status(200).json({
            verdict: "RETRY",
            overallFeedback: "Your prompt is too short to evaluate — write at least a sentence or two.",
            dimensions: [],
            improvementTip: "Tell the AI the technique you're using, the stack, and what you want it to do.",
            mentorPrompt: "",
        });
        return;
    }
    // ── Call AI ────────────────────────────────────────────────────────────────
    try {
        const raw = await callAI(REVIEW_SYSTEM, buildReviewPrompt(scenario, userPrompt, evaluationCriteria, techniqueId), 900);
        const parsed = extractJSON(raw);
        const validated = validateReview(parsed, evaluationCriteria);
        res.setHeader("X-RateLimit-Limit", String(RATE.MAX_REQUESTS));
        res.setHeader("X-RateLimit-Remaining", String(RATE.MAX_REQUESTS - (rateLimitStore.get(ip)?.length ?? 0)));
        res.setHeader("X-RateLimit-Window", "600");
        res.status(200).json(validated);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[ai/vibe-lab]", { ip, techniqueId, error: message });
        if (message.includes("abort")) {
            res.status(504).json({
                success: false,
                msg: "Request timed out — the AI took too long. Please try again.",
            });
            return;
        }
        // Graceful fallback — UI won't crash, real error is logged server-side
        res.status(200).json(FALLBACK_RESPONSE);
    }
}
//# sourceMappingURL=vibeLabReview.js.map