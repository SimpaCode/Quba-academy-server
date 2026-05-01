// src/models/Level.ts
// Direct copy from Next.js lib/models/Level.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IPlaygroundFiles {
  html: string;
  css: string;
  js: string;
}

export interface IContentStep {
  heading: string;
  body: string;
}

export interface IPlaygroundStep {
  instructions: string;
  hint?: string;
  files: IPlaygroundFiles;
}

export interface IQuizStep {
  type: "mcq" | "input";
  prompt: string;
  options?: IQuizOption[];
  expectedKeywords?: string[];
  hint?: string;
  explanation?: string;
}

export interface IChallengeStep {
  title: string;
  description: string;
  hint?: string;
  files: IPlaygroundFiles;
  validateKeywords: string[];
}

export interface IStep {
  id: string;
  type: "content" | "playground" | "quiz" | "challenge";
  content?: IContentStep;
  playground?: IPlaygroundStep;
  quiz?: IQuizStep;
  challenge?: IChallengeStep;
}

export interface IMission {
  missionId: string;
  label: string;
  title: string;
  subtitle: string;
  analogy: string;
  steps: IStep[];
  order: number;
  isPublished: boolean;
}

export interface ILevel extends Document {
  levelId: number;
  slug: string;
  title: string;
  vibeName: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isPublished: boolean;
  plan: "pro" | "team";
  missions: IMission[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const PlaygroundFilesSchema = new Schema(
  {
    html: { type: String, default: "" },
    css: { type: String, default: "" },
    js: { type: String, default: "" },
  },
  { _id: false },
);

const ContentStepSchema = new Schema(
  {
    heading: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false },
);

const PlaygroundStepSchema = new Schema(
  {
    instructions: { type: String, required: true },
    hint: { type: String },
    files: { type: PlaygroundFilesSchema, required: true },
  },
  { _id: false },
);

const QuizStepSchema = new Schema(
  {
    type: { type: String, enum: ["mcq", "input"], required: true },
    prompt: { type: String, required: true },
    options: { type: [QuizOptionSchema], default: [] },
    expectedKeywords: { type: [String], default: [] },
    hint: { type: String },
    explanation: { type: String },
  },
  { _id: false },
);

const ChallengeStepSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    hint: { type: String },
    files: { type: PlaygroundFilesSchema, required: true },
    validateKeywords: { type: [String], default: [] },
  },
  { _id: false },
);

const StepSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["content", "playground", "quiz", "challenge"],
      required: true,
    },
    content: { type: ContentStepSchema },
    playground: { type: PlaygroundStepSchema },
    quiz: { type: QuizStepSchema },
    challenge: { type: ChallengeStepSchema },
  },
  { _id: false },
);

const MissionSchema = new Schema(
  {
    missionId: { type: String, required: true },
    label: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    analogy: { type: String, required: true },
    steps: {
      type: [StepSchema],
      default: [],
      validate: {
        validator: (steps: { id: string }[]) => {
          const ids = steps.map((s) => s.id);
          return ids.length === new Set(ids).size;
        },
        message: "Duplicate step id within a mission is not allowed.",
      },
    },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
  },
  { _id: false },
);

const LevelSchema = new Schema<ILevel>(
  {
    levelId: { type: Number, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    vibeName: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ["pro", "team"],
      default: "pro",
      required: true,
    },
    missions: {
      type: [MissionSchema],
      default: [],
      validate: {
        validator: (missions: IMission[]) => {
          const ids = missions.map((m) => m.missionId);
          return ids.length === new Set(ids).size;
        },
        message: "Duplicate missionId within a level is not allowed.",
      },
    },
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

LevelSchema.index({ order: 1 });
LevelSchema.index({ plan: 1, isPublished: 1, order: 1 });

const Level: Model<ILevel> =
  mongoose.models.Level || mongoose.model<ILevel>("Level", LevelSchema);

export default Level;
