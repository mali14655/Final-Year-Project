import mongoose from "mongoose";
import "../config/env.js";
import { ensureSuperAdmin } from "../services/superAdminService.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cursor-for-pms";

let isConnected = false;
let connectionPromise = null;

/**
 * Atlas URIs copied from the UI sometimes include `appName=` with no value,
 * which makes the MongoDB driver reject the connection string.
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== "string") {
    return uri;
  }

  let cleaned = uri.trim();

  cleaned = cleaned.replace(/([?&])[a-zA-Z0-9_]+=(?=&|$)/g, (match, prefix) => prefix);
  cleaned = cleaned.replace(/\?&/g, "?");
  cleaned = cleaned.replace(/[?&]$/, "");

  return cleaned;
}

export function isDbReady() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDB() {
  if (isDbReady()) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const sanitizedUri = sanitizeMongoUri(MONGODB_URI);

  connectionPromise = (async () => {
    try {
      await mongoose.connect(sanitizedUri, {
        serverSelectionTimeoutMS: 15_000,
      });
      isConnected = true;
      await ensureSuperAdmin();
      console.log("MongoDB connected successfully");
    } catch (error) {
      isConnected = false;
      connectionPromise = null;
      console.error("MongoDB connection error:", error.message);
      throw error;
    }
  })();

  return connectionPromise;
}

export async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    connectionPromise = null;
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
}

export function requireDb(req, res, next) {
  if (isDbReady()) {
    return next();
  }

  return res.status(503).json({
    error: "Database is not connected. Check MONGODB_URI and ensure MongoDB is reachable.",
    code: "DB_UNAVAILABLE",
  });
}
