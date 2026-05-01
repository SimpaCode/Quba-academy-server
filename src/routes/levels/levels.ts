/**
 * src/routes/levels/levels.ts
 *
 * GET /api/levels?plan=pro|team
 *
 * Direct port of app/api/levels/route.ts.
 * Heavy mission fields (markdownContent, checkpoint, solution) are
 * stripped at the DB query level — same as the Next.js version.
 */

import { Request, Response } from "express";
import Level from "../../models/Level";
import User from "../../models/User";
import {
  getOrCreateProgress,
  seedNewPlanAccess,
  resolveStoredStatus,
} from "../../services/progressService";
import {
  sendOk,
  sendBadRequest,
  sendForbidden,
  sendServerError,
} from "../../utils/response";

// ── Types ─────────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ["admin", "super_admin"] as const;

// Shape returned by .lean() after the field-exclusion .select()
interface LevelLean {
  levelId: number;
  slug: string;
  title: string;
  vibeName: string;
  description: string;
  icon: string;
  color: string;
  plan: string;
  missions: { isPublished: boolean; missionId: string }[];
}

interface ProgressLike {
  levelStatus: Map<string, string>;
  missionProgress: Map<string, { status: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUnlockedPlans(user: {
  subscription: { plan: string; unlockedPlans?: string[] };
}): ("pro" | "team")[] {
  const unlocked = user.subscription.unlockedPlans;
  if (unlocked && unlocked.length > 0) return unlocked as ("pro" | "team")[];
  const plan = user.subscription.plan;
  if (plan === "pro" || plan === "team") return [plan];
  return [];
}

// Mirrors formatLevel() in the Next.js route exactly.
function formatLevel(level: LevelLean, progress: ProgressLike | null) {
  const publishedMissions = level.missions.filter((m) => m.isPublished);
  const levelStatus = progress?.levelStatus.get(level.slug) ?? "locked";
  const completedCount = progress
    ? publishedMissions.filter(
        (m) =>
          resolveStoredStatus(
            progress.missionProgress.get(m.missionId)?.status,
          ) === "completed",
      ).length
    : 0;

  return {
    id: level.levelId,
    slug: level.slug,
    title: level.title,
    vibeName: level.vibeName,
    description: level.description,
    icon: level.icon,
    color: level.color,
    status: levelStatus,
    plan: level.plan,
    missionCount: publishedMissions.length,
    completedMissions: completedCount,
  };
}

// Fields to exclude from every Level query — mirrors the Next.js .select()
const EXCLUDE_MISSION_FIELDS =
  "-missions.markdownContent -missions.checkpoint -missions.solution";

// ── Handler ───────────────────────────────────────────────────────────────────

export async function getLevels(req: Request, res: Response): Promise<void> {
  try {
    const planParam = req.query.plan as "pro" | "team" | undefined;
    const isAdmin = (ADMIN_ROLES as readonly string[]).includes(req.user!.role);

    // ── Admin: return all (or plan-filtered) published levels, no progress ──
    if (isAdmin) {
      const filter = planParam ? { plan: planParam } : {};
      const levels = await Level.find({ isPublished: true, ...filter })
        .sort({ order: 1 })
        .select(EXCLUDE_MISSION_FIELDS)
        .lean<LevelLean[]>();

      sendOk(
        res,
        levels.map((l) => formatLevel(l, null)),
      );
      return;
    }

    // ── Student: plan param is required ──────────────────────────────────────
    if (!planParam || !["pro", "team"].includes(planParam)) {
      sendBadRequest(
        res,
        "plan query param is required. Use ?plan=pro or ?plan=team",
      );
      return;
    }

    // Fetch only the subscription fields we need
    const dbUser = await User.findById(req.user!.id)
      .select("subscription.plan subscription.unlockedPlans role")
      .lean<{
        subscription: { plan: string; unlockedPlans?: string[] };
        role: string;
      }>();

    if (!dbUser) {
      sendServerError(res, "User not found.");
      return;
    }

    const unlockedPlans = resolveUnlockedPlans(dbUser);

    if (unlockedPlans.length === 0) {
      sendForbidden(
        res,
        "An active subscription is required to access levels.",
      );
      return;
    }

    if (!unlockedPlans.includes(planParam)) {
      // Flat options so client can read response.data.code and
      // response.data.unlockedPlans directly — mirrors the Next.js CHANGED comment.
      sendForbidden(res, `You don't have access to ${planParam} content.`, {
        code: "PLAN_NOT_UNLOCKED",
        requestedPlan: planParam,
        unlockedPlans,
      });
      return;
    }

    const [levels, progress] = await Promise.all([
      Level.find({ isPublished: true, plan: planParam })
        .sort({ order: 1 })
        .select(EXCLUDE_MISSION_FIELDS)
        .lean<LevelLean[]>(),
      getOrCreateProgress(req.user!.id, unlockedPlans),
    ]);

    // Seed progress if this is the first time the user accesses this plan
    const planLevelSlugs = levels.map((l) => l.slug);
    const hasAnyProgress = planLevelSlugs.some((slug) =>
      progress.levelStatus.has(slug),
    );

    if (!hasAnyProgress && levels.length > 0) {
      await seedNewPlanAccess(req.user!.id, planParam);
      const freshProgress = await getOrCreateProgress(
        req.user!.id,
        unlockedPlans,
      );
      sendOk(
        res,
        levels.map((level) => formatLevel(level, freshProgress)),
      );
      return;
    }

    sendOk(
      res,
      levels.map((level) => formatLevel(level, progress)),
    );
  } catch (err) {
    sendServerError(res, "Failed to load levels.", err);
  }
}
