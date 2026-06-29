import User from "../models/User.js";
import Project from "../models/Project.js";
import Interview from "../models/Interview.js";
import { toPublicUser } from "./userService.js";
import { deleteFromGridFS } from "../utils/gridfs.js";

function toManagedUserSummary(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getManagedUser(userId) {
  const user = await User.findById(userId);
  if (!user || user.role === "superadmin") {
    throw new Error("User not found");
  }
  return user;
}

export async function listPendingUsers() {
  const users = await User.find({ role: "user", status: "pending" })
    .select("name email status createdAt")
    .sort({ createdAt: -1 });

  return users.map(toManagedUserSummary);
}

export async function listManagedUsers() {
  const users = await User.find({ role: "user" })
    .select("name email status createdAt updatedAt")
    .sort({ createdAt: -1 });

  return users.map(toManagedUserSummary);
}

export async function approveUser(userId) {
  const user = await User.findOne({ _id: userId, role: "user", status: "pending" });
  if (!user) {
    throw new Error("Pending user not found");
  }

  user.status = "approved";
  await user.save();

  return toPublicUser(user);
}

export async function rejectUser(userId) {
  const user = await User.findOne({ _id: userId, role: "user", status: "pending" });
  if (!user) {
    throw new Error("Pending user not found");
  }

  user.status = "rejected";
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return toPublicUser(user);
}

export async function inactivateUser(userId) {
  const user = await getManagedUser(userId);

  if (user.status === "inactive") {
    throw new Error("User is already inactive");
  }

  user.status = "inactive";
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return toPublicUser(user);
}

export async function reactivateUser(userId) {
  const user = await getManagedUser(userId);

  if (user.status === "approved") {
    throw new Error("User is already active");
  }

  if (user.status === "pending") {
    throw new Error("Approve this user first before activating their account");
  }

  user.status = "approved";
  await user.save();

  return toPublicUser(user);
}

export async function inactivateAllUsers() {
  const users = await User.find({ role: "user", status: { $ne: "inactive" } });

  let count = 0;
  for (const user of users) {
    user.status = "inactive";
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    count += 1;
  }

  return { count };
}

async function deleteInterviewRecord(interview) {
  if (!interview) {
    return;
  }

  if (interview.gridfsFileId) {
    await deleteFromGridFS(interview.gridfsFileId);
  }

  await Interview.findByIdAndDelete(interview._id);
}

export async function deleteUser(userId) {
  const user = await getManagedUser(userId);

  if (user.avatarGridfsFileId) {
    await deleteFromGridFS(user.avatarGridfsFileId);
  }

  const projects = await Project.find({ userId: user._id });
  const deletedInterviewIds = new Set();

  for (const project of projects) {
    const linkedInterviews = await Interview.find({
      $or: [{ _id: { $in: project.interviews || [] } }, { projectId: project._id }],
    });

    for (const interview of linkedInterviews) {
      const key = interview._id.toString();
      if (deletedInterviewIds.has(key)) {
        continue;
      }
      deletedInterviewIds.add(key);
      await deleteInterviewRecord(interview);
    }

    await Project.findByIdAndDelete(project._id);
  }

  const orphanInterviews = await Interview.find({ userId: user._id });
  for (const interview of orphanInterviews) {
    const key = interview._id.toString();
    if (deletedInterviewIds.has(key)) {
      continue;
    }
    await deleteInterviewRecord(interview);
  }

  await User.findByIdAndDelete(user._id);

  return { deleted: true };
}
