import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "cursor-for-pms-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "cursor-for-pms-refresh-secret";
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

export const REFRESH_COOKIE_NAME = "refreshToken";
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(userId) {
  return jwt.sign({ userId: userId.toString(), type: "access" }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(userId, tokenVersion) {
  return jwt.sign(
    { userId: userId.toString(), type: "refresh", tokenVersion },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, ACCESS_SECRET);
  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, REFRESH_SECRET);
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload;
}

function toPublicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

export async function createAuthSession(user) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id, user.tokenVersion || 0);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
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

  const existing = await User.findOne({ email: trimmedEmail });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: trimmedName,
    email: trimmedEmail,
    password: hashedPassword,
    tokenVersion: 0,
  });

  return createAuthSession(user);
}

export async function loginUser({ email, password }) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: trimmedEmail });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return createAuthSession(user);
}

export async function refreshAuthSession(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new Error("User not found");
  }

  if ((user.tokenVersion || 0) !== payload.tokenVersion) {
    throw new Error("Refresh token revoked");
  }

  return createAuthSession(user);
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

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/auth",
  };
}
