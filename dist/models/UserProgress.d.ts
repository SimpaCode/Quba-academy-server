import mongoose, { Document, Model } from "mongoose";
export type MissionStatus = "not_started" | "completed";
export type LevelStatus = "locked" | "current" | "completed";
export interface IMissionProgress {
    status: MissionStatus;
    completedAt?: Date;
    checkpointPassedAt?: Date;
}
export interface IAchievement {
    id: string;
    earnedAt: Date;
}
export interface IUserProgress extends Document {
    userId: mongoose.Types.ObjectId;
    missionProgress: Map<string, IMissionProgress>;
    levelStatus: Map<string, LevelStatus>;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    activityLog: Map<string, number>;
    achievements: IAchievement[];
    vibeScore: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const UserProgress: Model<IUserProgress>;
export default UserProgress;
//# sourceMappingURL=UserProgress.d.ts.map