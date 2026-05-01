"use strict";
/**
 * src/config/db.ts
 *
 * Persistent MongoDB connection with connection pooling.
 * The connection pool stays warm between requests — a key
 * performance advantage over serverless functions.
 *
 * maxPoolSize: 10 → up to 10 concurrent DB operations without
 * waiting for a connection slot to free up.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let isConnected = false;
async function connectDB() {
    if (isConnected)
        return;
    try {
        await mongoose_1.default.connect((0, env_1.requireEnv)("MONGODB_URI"), {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("✅ MongoDB connected");
        mongoose_1.default.connection.on("disconnected", () => {
            isConnected = false;
            console.warn("⚠️  MongoDB disconnected — will reconnect on next request");
        });
        mongoose_1.default.connection.on("error", (err) => {
            console.error("❌ MongoDB error:", err);
            isConnected = false;
        });
    }
    catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}
async function disconnectDB() {
    if (!isConnected)
        return;
    await mongoose_1.default.disconnect();
    isConnected = false;
}
//# sourceMappingURL=db.js.map