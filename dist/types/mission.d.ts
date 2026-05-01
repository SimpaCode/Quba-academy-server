export type MissionStatus = "not_started" | "completed";
export type DisplayMissionStatus = "not_started" | "active" | "completed";
export interface QuizOption {
    id: string;
    text: string;
    isCorrect: boolean;
}
export interface PlaygroundFiles {
    html: string;
    css: string;
    js: string;
}
export interface ContentStep {
    heading: string;
    /** Full Markdown string */
    body: string;
}
export interface PlaygroundStep {
    instructions: string;
    hint?: string;
    files: PlaygroundFiles;
}
export interface QuizStep {
    type: "mcq" | "input";
    prompt: string;
    options?: QuizOption[];
    expectedKeywords?: string[];
    hint?: string;
    explanation?: string;
}
export interface ChallengeStep {
    title: string;
    description: string;
    hint?: string;
    files: PlaygroundFiles;
    validateKeywords: string[];
}
export type StepType = "content" | "playground" | "quiz" | "challenge";
export interface MissionStep {
    id: string;
    type: StepType;
    content?: ContentStep;
    playground?: PlaygroundStep;
    quiz?: QuizStep;
    challenge?: ChallengeStep;
}
export interface MissionDetail {
    id: string;
    label: string;
    title: string;
    subtitle: string;
    analogy: string;
    steps: MissionStep[];
    order: number;
    status: DisplayMissionStatus;
}
export interface MissionSummary {
    id: string;
    label: string;
    title: string;
    status: DisplayMissionStatus;
}
export interface LevelSummary {
    id: number;
    slug: string;
    title: string;
    vibeName: string;
    description: string;
    icon: string;
    color: string;
    plan: "pro" | "team";
    status: "current" | "completed" | "locked";
    missionCount: number;
    completedMissions: number;
}
export interface LevelDetail {
    id: number;
    slug: string;
    title: string;
    vibeName: string;
    description: string;
    icon: string;
    missions: MissionSummary[];
}
export interface MissionNavContext {
    current: MissionSummary;
    prev: {
        id: string;
        title: string;
    } | null;
    next: {
        id: string;
        title: string;
    } | null;
    currentIndex: number;
    totalMissions: number;
}
export type StepCompletionMap = Record<string, boolean>;
export interface CompleteMissionResponse {
    nextMissionId: string | null;
    nextMission: {
        id: string;
        label: string;
        title: string;
    } | null;
    levelCompleted: boolean;
    nextLevelSlug: string | null;
    newAchievements: string[];
    vibeScore: number;
    currentStreak: number;
}
export interface LevelsResult {
    levels: LevelSummary[];
    isPlanLocked: boolean;
    unlockedPlans: ("pro" | "team")[];
}
//# sourceMappingURL=mission.d.ts.map