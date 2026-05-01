import { Document, Model } from "mongoose";
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
declare const Level: Model<ILevel>;
export default Level;
//# sourceMappingURL=Level.d.ts.map