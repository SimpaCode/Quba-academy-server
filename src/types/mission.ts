// types/mission.ts
//
// Single source of truth for all mission-related types.
// Used by both client components and server API routes.
//
// ── Progress model change (refactor) ─────────────────────────
//
// MissionStatus is now a 2-state model:
//   "not_started" — mission exists, user has plan access, not yet begun
//   "completed"   — user has finished this mission
//
// "active" and "locked" are REMOVED from stored state.
//
//   "active"  was stored state — now COMPUTED at read time as
//             "the first not_started mission in order."
//             Never written to DB.
//
//   "locked"  was used as both "not seeded" and "access blocked."
//             Access blocking is now done purely by plan ownership check
//             at the API layer (403). "locked" no longer exists in
//             progress state.
//
// ── UI display states (derived, never stored) ─────────────────
//
//   "completed"   → ✅  (from DB)
//   "active"      → ▶   (computed: first not_started in order)
//   "not_started" → ○   (from DB, for all others)
//
// ── Content model ─────────────────────────────────────────────
// ContentStep.body is a full Markdown string.
// Code blocks, callouts, tables all live inside the markdown.
// Rendered client-side with react-markdown + rehype-highlight.

// CHANGED: Removed "active" and "locked" from stored MissionStatus.
// Added "not_started". "active" is now a derived/display-only concept.
export type MissionStatus = "not_started" | "completed";

// CHANGED: DisplayMissionStatus is the full set used in UI rendering.
// "active" is computed server-side for the current mission pointer
// and returned in API responses — but never written to the DB.
// "not_started" replaces "locked" everywhere in the UI.
export type DisplayMissionStatus = "not_started" | "active" | "completed";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface PlaygroundFiles {
  html: string;
  css: string;
  js: string;
}

export interface ContentStep {
  heading: string;
  /** Full Markdown string */
  body: string;
}

export interface PlaygroundStep {
  instructions: string;
  hint?: string;
  files: PlaygroundFiles;
}

export interface QuizStep {
  type: "mcq" | "input";
  prompt: string;
  options?: QuizOption[];
  expectedKeywords?: string[];
  hint?: string;
  explanation?: string;
}

export interface ChallengeStep {
  title: string;
  description: string;
  hint?: string;
  files: PlaygroundFiles;
  validateKeywords: string[];
}

export type StepType = "content" | "playground" | "quiz" | "challenge";

export interface MissionStep {
  id: string;
  type: StepType;
  content?: ContentStep;
  playground?: PlaygroundStep;
  quiz?: QuizStep;
  challenge?: ChallengeStep;
}

// ── Mission shapes ────────────────────────────────────────────

export interface MissionDetail {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  analogy: string;
  steps: MissionStep[];
  order: number;
  // CHANGED: status in detail response uses DisplayMissionStatus
  // so the UI can show ▶ for the computed active mission.
  status: DisplayMissionStatus;
}

export interface MissionSummary {
  id: string;
  label: string;
  title: string;
  // CHANGED: uses DisplayMissionStatus — "locked" is gone,
  // "not_started" replaces it. "active" is computed, not stored.
  status: DisplayMissionStatus;
}

// ── Level shapes ──────────────────────────────────────────────

export interface LevelSummary {
  id: number;
  slug: string;
  title: string;
  vibeName: string;
  description: string;
  icon: string;
  color: string;
  plan: "pro" | "team";
  status: "current" | "completed" | "locked";
  missionCount: number;
  completedMissions: number;
}

export interface LevelDetail {
  id: number;
  slug: string;
  title: string;
  vibeName: string;
  description: string;
  icon: string;
  missions: MissionSummary[];
}

// ── Navigation ────────────────────────────────────────────────

export interface MissionNavContext {
  current: MissionSummary;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  currentIndex: number;
  totalMissions: number;
}

export type StepCompletionMap = Record<string, boolean>;

// ── API response ──────────────────────────────────────────────

export interface CompleteMissionResponse {
  nextMissionId: string | null;
  nextMission: { id: string; label: string; title: string } | null;
  levelCompleted: boolean;
  nextLevelSlug: string | null;
  newAchievements: string[];
  vibeScore: number;
  currentStreak: number;
}

export interface LevelsResult {
  levels: LevelSummary[];
  isPlanLocked: boolean;
  unlockedPlans: ("pro" | "team")[];
}
