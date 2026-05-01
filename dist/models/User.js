"use strict";
// src/models/User.ts
// Direct copy from Next.js lib/models/User.ts
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
const NotificationPrefsSchema = new mongoose_1.Schema({
    weeklyDigest: { type: Boolean, default: true },
    streakReminders: { type: Boolean, default: true },
    levelUnlocked: { type: Boolean, default: true },
    missionTips: { type: Boolean, default: false },
    productUpdates: { type: Boolean, default: true },
}, { _id: false });
const AppearancePrefsSchema = new mongoose_1.Schema({
    theme: {
        type: String,
        enum: ["system", "light", "dark"],
        default: "system",
    },
    reduceMotion: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false },
}, { _id: false });
const LearningPrefsSchema = new mongoose_1.Schema({
    dailyGoal: { type: Number, enum: [1, 2, 3, 5], default: 2 },
    reminderTime: { type: String, default: "09:00" },
    reminderEnabled: { type: Boolean, default: true },
    showAnalogiesFirst: { type: Boolean, default: true },
}, { _id: false });
const SubscriptionSchema = new mongoose_1.Schema({
    plan: { type: String, enum: ["free", "pro", "team"], default: "free" },
    unlockedPlans: { type: [String], enum: ["pro", "team"], default: [] },
    renewsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    paystackCustomerCode: { type: String, default: null },
    paystackSubscriptionCode: { type: String, default: null },
    paystackEmailToken: { type: String, default: null },
}, { _id: false });
const OnboardingSchema = new mongoose_1.Schema({
    experience: {
        type: String,
        enum: ["beginner", "intermediate"],
        default: null,
    },
    country: { type: String, default: null, maxlength: 10 },
    timezone: { type: String, default: null, maxlength: 60 },
    completedAt: { type: Date, default: null },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
});
UserSchema.index({ role: 1 });
UserSchema.index({ isBanned: 1 });
UserSchema.index({ "subscription.plan": 1 });
UserSchema.index({ "subscription.unlockedPlans": 1 });
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", UserSchema);
exports.default = User;
//# sourceMappingURL=User.js.map