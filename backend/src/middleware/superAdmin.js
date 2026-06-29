import User from "../models/User.js";

export async function requireSuperAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role status");
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    req.adminUser = user;
    next();
  } catch {
    return res.status(403).json({ error: "Super admin access required" });
  }
}
