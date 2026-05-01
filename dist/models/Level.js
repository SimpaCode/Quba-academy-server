"use strict";
// src/models/Level.ts
// Direct copy from Next.js lib/models/Level.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const QuizOptionSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
}, { _id: false });
const PlaygroundFilesSchema = new mongoose_1.Schema({
    html: { type: String, default: "" },
    css: { type: String, default: "" },
    js: { type: String, default: "" },
}, { _id: false });
const ContentStepSchema = new mongoose_1.Schema({
    heading: { type: String, required: true },
    body: { type: String, required: true },
}, { _id: false });
const PlaygroundStepSchema = new mongoose_1.Schema({
    instructions: { type: String, required: true },
    hint: { type: String },
    files: { type: PlaygroundFilesSchema, required: true },
}, { _id: false });
const QuizStepSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["mcq", "input"], required: true },
    prompt: { type: String, required: true },
    options: { type: [QuizOptionSchema], default: [] },
    expectedKeywords: { type: [String], default: [] },
    hint: { type: String },
    explanation: { type: String },
}, { _id: false });
const ChallengeStepSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    hint: { type: String },
    files: { type: PlaygroundFilesSchema, required: true },
    validateKeywords: { type: [String], default: [] },
}, { _id: false });
const StepSchema = new mongoose_1.Schema({
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
}, { _id: false });
const MissionSchema = new mongoose_1.Schema({
    missionId: { type: String, required: true },
    label: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    analogy: { type: String, required: true },
    steps: {
        type: [StepSchema],
        default: [],
        validate: {
            validator: (steps) => {
                const ids = steps.map((s) => s.id);
                return ids.length === new Set(ids).size;
            },
            message: "Duplicate step id within a mission is not allowed.",
        },
    },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
}, { _id: false });
const LevelSchema = new mongoose_1.Schema({
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
            validator: (missions) => {
                const ids = missions.map((m) => m.missionId);
                return ids.length === new Set(ids).size;
            },
            message: "Duplicate missionId within a level is not allowed.",
        },
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret.__v;
            return ret;
        },
    },
});
LevelSchema.index({ order: 1 });
LevelSchema.index({ plan: 1, isPublished: 1, order: 1 });
const Level = mongoose_1.default.models.Level || mongoose_1.default.model("Level", LevelSchema);
exports.default = Level;
//# sourceMappingURL=Level.js.map