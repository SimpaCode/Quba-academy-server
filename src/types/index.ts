/**
 * src/types/index.ts
 *
 * Shared domain types used across routes, services, and models.
 */

export type UserRole = "student" | "admin" | "super_admin";

export type SubscriptionPlan = "free" | "pro" | "team";

export type MissionStatus = "locked" | "available" | "in_progress" | "completed";

export type LevelStatus = "locked" | "available" | "in_progress" | "completed";

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  msg?: string;
  code?: string;
}
