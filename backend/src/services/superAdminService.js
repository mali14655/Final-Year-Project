import bcrypt from "bcryptjs";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export function getSuperAdminEmail() {
  return process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export async function ensureSuperAdmin() {
  const email = getSuperAdminEmail();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    return;
  }

  const existingSuperAdmin = await User.findOne({ role: "superadmin" });
  if (existingSuperAdmin) {
    return;
  }

  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "superadmin",
    status: "approved",
    tokenVersion: 0,
  });
}
