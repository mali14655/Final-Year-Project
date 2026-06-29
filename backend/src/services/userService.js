import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  deleteFromGridFS,
  replaceGridFSFile,
  getGridFSReadStream,
} from "../utils/gridfs.js";

const SALT_ROUNDS = 10;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    status: user.status || "approved",
    isSuperAdmin: user.role === "superadmin",
    hasAvatar: Boolean(user.avatarGridfsFileId),
    preferences: {
      showWorkflowHints: user.preferences?.showWorkflowHints ?? true,
      compactView: user.preferences?.compactView ?? false,
    },
    updatedAt: user.updatedAt,
  };
}

export async function updateUserProfile(userId, { name, email }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error("Name is required");
  }

  if (!trimmedEmail) {
    throw new Error("Email is required");
  }

  if (trimmedEmail !== user.email) {
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing && existing._id.toString() !== userId.toString()) {
      throw new Error("An account with this email already exists");
    }
    user.email = trimmedEmail;
  }

  user.name = trimmedName;
  await user.save();

  return toPublicUser(user);
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!currentPassword || !newPassword) {
    throw new Error("Current and new password are required");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return toPublicUser(user);
}

export async function updateUserPreferences(userId, preferences) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.preferences) {
    user.preferences = {};
  }

  if (typeof preferences.showWorkflowHints === "boolean") {
    user.preferences.showWorkflowHints = preferences.showWorkflowHints;
  }
  if (typeof preferences.compactView === "boolean") {
    user.preferences.compactView = preferences.compactView;
  }

  user.markModified("preferences");
  await user.save();

  return toPublicUser(user);
}

export async function uploadUserAvatar(userId, file) {
  if (!file?.buffer) {
    throw new Error("No image file provided");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be smaller than 2MB");
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const ext = file.mimetype.split("/")[1] || "jpg";
  const filename = `avatar-${userId}.${ext}`;

  const fileId = await replaceGridFSFile(
    user.avatarGridfsFileId,
    file.buffer,
    filename,
    file.mimetype
  );

  user.avatarGridfsFileId = fileId;
  user.avatarContentType = file.mimetype;
  await user.save();

  return toPublicUser(user);
}

export async function removeUserAvatar(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.avatarGridfsFileId) {
    await deleteFromGridFS(user.avatarGridfsFileId);
    user.avatarGridfsFileId = null;
    user.avatarContentType = null;
    await user.save();
  }

  return toPublicUser(user);
}

export function getUserAvatarStream(user) {
  if (!user?.avatarGridfsFileId) {
    return null;
  }
  return getGridFSReadStream(user.avatarGridfsFileId);
}

export async function getUserForAvatar(userId) {
  return User.findById(userId).select("avatarGridfsFileId avatarContentType");
}
