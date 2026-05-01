"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const refreshTokenSchema = new mongoose_1.default.Schema({
    tokenId: { type: String, required: true, unique: true },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: String,
    ip: String,
});
exports.default = mongoose_1.default.models.RefreshToken ||
    mongoose_1.default.model("RefreshToken", refreshTokenSchema);
//# sourceMappingURL=RefreshToken.js.map