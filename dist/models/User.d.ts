import { Document, Model } from "mongoose";
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
declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map