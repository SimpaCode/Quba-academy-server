import { IMissionProgress, IUserProgress, MissionStatus } from "../models/UserProgress";
export type DisplayMissionStatus = "not_started" | "active" | "completed";
export declare function resolveStoredStatus(raw: string | undefined): MissionStatus;
export declare function toDisplayStatus(stored: MissionStatus, isActive: boolean): DisplayMissionStatus;
export declare function getActiveMissionId(sortedMissionIds: string[], missionProgress: Map<string, IMissionProgress>): string | null;
export declare function getOrCreateProgress(userId: string, unlockedPlans?: ("pro" | "team")[]): Promise<IUserProgress>;
export declare function seedNewPlanAccess(userId: string, newPlan: "pro" | "team"): Promise<void>;
export interface CompleteMissionResult {
    nextMissionId: string | null;
    levelCompleted: boolean;
    nextLevelSlug: string | null;
    newAchievements: string[];
    vibeScore: number;
    currentStreak: number;
}
export declare function completeMission(userId: string, levelSlug: string, missionId: string): Promise<CompleteMissionResult>;
export declare function resetProgress(userId: string): Promise<void>;
//# sourceMappingURL=progressService.d.ts.map