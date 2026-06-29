import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { toPublicUser } from "./userService.js";
import { getSuperAdminEmail } from "./superAdminService.js";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  REFRESH_COOKIE_MAX_AGE_MS,
} from "../config/env.js";

const SALT_ROUNDS = 10;

export const REFRESH_COOKIE_NAME = "refreshToken";
export { REFRESH_COOKIE_MAX_AGE_MS };

export function signAccessToken(userId) {
  return jwt.sign({ userId: userId.toString(), type: "access" }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(userId, tokenVersion) {
  return jwt.sign(
    { userId: userId.toString(), type: "refresh", tokenVersion },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, JWT_ACCESS_SECRET);
  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET);
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload;
}

function buildAuthSession(user) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id, user.tokenVersion || 0);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function createAuthSession(user) {
  assertUserCanAuthenticate(user);
  return buildAuthSession(user);
}

function assertUserCanAuthenticate(user) {
  if (user.role === "superadmin") {
    return;
  }

  if (user.status === "pending") {
    const error = new Error(
      "You have not been approved yet. Please wait for the administrator to approve your account."
    );
    error.code = "ACCOUNT_PENDING";
    throw error;
  }

  if (user.status === "rejected") {
    const error = new Error(
      "Your account has not been approved. Please contact the administrator."
    );
    error.code = "ACCOUNT_REJECTED";
    throw error;
  }

  if (user.status === "inactive") {
    const error = new Error(
      "Your account has been inactivated. Please contact the administrator."
    );
    error.code = "ACCOUNT_INACTIVE";
    throw error;
  }
}

export async function registerUser({ name, email, password }) {
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || !password) {
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const superAdminEmail = getSuperAdminEmail();
  if (superAdminEmail && trimmedEmail === superAdminEmail) {
    throw new Error("An account with this email already exists");
  }

  const existing = await User.findOne({ email: trimmedEmail });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    name: trimmedName,
    email: trimmedEmail,
    password: hashedPassword,
    role: "user",
    status: "pending",
    tokenVersion: 0,
  });

  return {
    pendingApproval: true,
    message: "Account created. Waiting for administrator approval before you can sign in.",
  };
}

export async function loginUser({ email, password }) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: trimmedEmail });
  if (!user) {
    const error = new Error("No account found with this email.");
    error.code = "ACCOUNT_NOT_FOUND";
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return createAuthSession(user);
}

export async function refreshAuthSession(refreshToken) {
  if (!refreshToken) {
    const error = new Error("Refresh token missing");
    error.code = "REFRESH_MISSING";
    throw error;
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if ((user.tokenVersion || 0) !== payload.tokenVersion) {
    const error = new Error("Refresh token revoked");
    error.code = "REFRESH_REVOKED";
    throw error;
  }

  assertUserCanAuthenticate(user);

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return buildAuthSession(user);
}

export async function logoutUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
}

export async function getUserById(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return toPublicUser(user);
}

function getRefreshCookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/auth",
  };
}

export function getRefreshCookieOptions() {
  return {
    ...getRefreshCookieBaseOptions(),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function getRefreshCookieClearOptions() {
  return getRefreshCookieBaseOptions();
}
