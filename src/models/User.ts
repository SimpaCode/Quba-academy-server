// src/models/User.ts
// Direct copy from Next.js lib/models/User.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  username: string;
  role: "student" | "admin" | "super_admin";
  provider: "credentials" | "google";
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isBanned: boolean;
  bannedAt: Date | null;
  notifications: {
    weeklyDigest: boolean;
    streakReminders: boolean;
    levelUnlocked: boolean;
    missionTips: boolean;
    productUpdates: boolean;
  };
  onboarding: {
    experience: "beginner" | "intermediate" | null;
    country: string | null;
    timezone: string | null;
    completedAt: Date | null;
  };
  appearance: {
    theme: "system" | "light" | "dark";
    reduceMotion: boolean;
    compactMode: boolean;
  };
  learning: {
    dailyGoal: number;
    reminderTime: string;
    reminderEnabled: boolean;
    showAnalogiesFirst: boolean;
  };
  subscription: {
    plan: "free" | "pro" | "team";
    unlockedPlans: ("pro" | "team")[];
    renewsAt: Date | null;
    cancelledAt: Date | null;
    paystackCustomerCode: string | null;
    paystackSubscriptionCode: string | null;
    paystackEmailToken: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPrefsSchema = new Schema(
  {
    weeklyDigest: { type: Boolean, default: true },
    streakReminders: { type: Boolean, default: true },
    levelUnlocked: { type: Boolean, default: true },
    missionTips: { type: Boolean, default: false },
    productUpdates: { type: Boolean, default: true },
  },
  { _id: false },
);

const AppearancePrefsSchema = new Schema(
  {
    theme: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },
    reduceMotion: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false },
  },
  { _id: false },
);

const LearningPrefsSchema = new Schema(
  {
    dailyGoal: { type: Number, enum: [1, 2, 3, 5], default: 2 },
    reminderTime: { type: String, default: "09:00" },
    reminderEnabled: { type: Boolean, default: true },
    showAnalogiesFirst: { type: Boolean, default: true },
  },
  { _id: false },
);

const SubscriptionSchema = new Schema(
  {
    plan: { type: String, enum: ["free", "pro", "team"], default: "free" },
    unlockedPlans: { type: [String], enum: ["pro", "team"], default: [] },
    renewsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    paystackCustomerCode: { type: String, default: null },
    paystackSubscriptionCode: { type: String, default: null },
    paystackEmailToken: { type: String, default: null },
  },
  { _id: false },
);

const OnboardingSchema = new Schema(
  {
    experience: {
      type: String,
      enum: ["beginner", "intermediate"],
      default: null,
    },
    country: { type: String, default: null, maxlength: 10 },
    timezone: { type: String, default: null, maxlength: 60 },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, default: "" },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    role: {
      type: String,
      enum: ["student", "admin", "super_admin"],
      default: "student",
      required: true,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    emailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date, default: null },
    onboarding: { type: OnboardingSchema, default: () => ({}) },
    firstName: { type: String, default: "", trim: true, maxlength: 50 },
    lastName: { type: String, default: "", trim: true, maxlength: 50 },
    avatarUrl: { type: String },
    notifications: { type: NotificationPrefsSchema, default: () => ({}) },
    appearance: { type: AppearancePrefsSchema, default: () => ({}) },
    learning: { type: LearningPrefsSchema, default: () => ({}) },
    subscription: { type: SubscriptionSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        delete (ret as any).__v;
        return ret;
      },
    },
  },
);

UserSchema.index({ role: 1 });
UserSchema.index({ isBanned: 1 });
UserSchema.index({ "subscription.plan": 1 });
UserSchema.index({ "subscription.unlockedPlans": 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
