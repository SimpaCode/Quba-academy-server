// src/models/UserProgress.ts
// Direct copy from Next.js lib/models/UserProgress.ts

import mongoose, { Schema, Document, Model } from "mongoose";

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

const MissionProgressSchema = new Schema<IMissionProgress>(
  {
    status: {
      type: String,
      enum: ["not_started", "completed"],
      required: true,
      default: "not_started",
    },
    completedAt: { type: Date },
    checkpointPassedAt: { type: Date },
  },
  { _id: false },
);

const AchievementSchema = new Schema<IAchievement>(
  {
    id: { type: String, required: true },
    earnedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    missionProgress: { type: Map, of: MissionProgressSchema, default: {} },
    levelStatus: {
      type: Map,
      of: { type: String, enum: ["locked", "current", "completed"] },
      default: {},
    },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: null },
    activityLog: { type: Map, of: Number, default: {} },
    achievements: { type: [AchievementSchema], default: [] },
    vibeScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  },
);

const UserProgress: Model<IUserProgress> =
  mongoose.models.UserProgress ||
  mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);

export default UserProgress;
