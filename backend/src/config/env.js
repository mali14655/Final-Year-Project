import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseDurationToMs(duration, fallbackMs) {
  if (!duration || typeof duration !== "string") {
    return fallbackMs;
  }

  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}

const isProduction = process.env.NODE_ENV === "production";

function resolveSecret(envName, devFallback) {
  const value = process.env[envName] || process.env.JWT_SECRET;

  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${envName} (or JWT_SECRET) must be set in production`);
  }

  return devFallback;
}

export const JWT_ACCESS_SECRET = resolveSecret(
  "JWT_ACCESS_SECRET",
  "cursor-for-pms-access-secret-dev-only"
);

export const JWT_REFRESH_SECRET = resolveSecret(
  "JWT_REFRESH_SECRET",
  "cursor-for-pms-refresh-secret-dev-only"
);

export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
export const REFRESH_COOKIE_MAX_AGE_MS = parseDurationToMs(JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
