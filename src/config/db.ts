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

import mongoose from "mongoose";
import { requireEnv } from "./env";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(requireEnv("MONGODB_URI"), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45_000,
    });

    isConnected = true;
    console.log("✅ MongoDB connected");

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("⚠️  MongoDB disconnected — will reconnect on next request");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err);
      isConnected = false;
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
