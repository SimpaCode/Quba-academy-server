"use strict";
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
exports.getSettings = getSettings;
const mongoose_1 = __importStar(require("mongoose"));
const SettingsSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const Settings = mongoose_1.default.models.Settings ||
    mongoose_1.default.model("Settings", SettingsSchema);
async function getSettings() {
    let settings = await Settings.findOne({});
    if (!settings) {
        settings = await Settings.create({});
    }
    return settings;
}
exports.default = Settings;
//# sourceMappingURL=Settings.js.map