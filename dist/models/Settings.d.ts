import { Document, Model } from "mongoose";
export interface ISettings extends Document {
    platform: {
        academyName: string;
        logoUrl: string;
        supportEmail: string;
    };
    flags: {
        maintenanceMode: boolean;
        registrationsEnabled: boolean;
    };
    pricing: {
        proPriceNaira: number;
        teamPriceNaira: number;
    };
    updatedAt: Date;
    createdAt: Date;
}
declare const Settings: Model<ISettings>;
export declare function getSettings(): Promise<ISettings>;
export default Settings;
//# sourceMappingURL=Settings.d.ts.map