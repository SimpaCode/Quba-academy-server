"use strict";
// src/models/UserProgress.ts
// Direct copy from Next.js lib/models/UserProgress.ts
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
const MissionProgressSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ["not_started", "completed"],
        required: true,
        default: "not_started",
    },
    completedAt: { type: Date },
    checkpointPassedAt: { type: Date },
}, { _id: false });
const AchievementSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    earnedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const UserProgressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret.__v;
            return ret;
        },
    },
});
const UserProgress = mongoose_1.default.models.UserProgress ||
    mongoose_1.default.model("UserProgress", UserProgressSchema);
exports.default = UserProgress;
//# sourceMappingURL=UserProgress.js.map