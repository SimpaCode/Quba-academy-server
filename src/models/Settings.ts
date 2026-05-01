import mongoose, { Schema, Document, Model } from "mongoose";

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

const SettingsSchema = new Schema<ISettings>(
  {
    platform: {
      academyName: {
        type: String,
        default: "QUBA Academy",
        trim: true,
        maxlength: 80,
      },
      logoUrl: { type: String, default: "", trim: true },
      supportEmail: { type: String, default: "", lowercase: true, trim: true },
    },
    flags: {
      maintenanceMode: { type: Boolean, default: false },
      registrationsEnabled: { type: Boolean, default: true },
    },
    pricing: {
      proPriceNaira: { type: Number, default: 15000, min: 0 },
      teamPriceNaira: { type: Number, default: 25000, min: 0 },
    },
  },
  { timestamps: true },
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export async function getSettings(): Promise<ISettings> {
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export default Settings;
