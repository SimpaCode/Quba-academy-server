"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=mission.js.map