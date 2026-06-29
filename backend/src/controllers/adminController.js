import {
  listPendingUsers,
  listManagedUsers,
  approveUser,
  rejectUser,
  inactivateUser,
  reactivateUser,
  inactivateAllUsers,
  deleteUser,
} from "../services/adminService.js";

export async function getPendingUsers(req, res) {
  try {
    const users = await listPendingUsers();
    return res.status(200).json({ users, count: users.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getManagedUsers(req, res) {
  try {
    const users = await listManagedUsers();
    return res.status(200).json({ users, count: users.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function approvePendingUser(req, res) {
  try {
    const user = await approveUser(req.params.id);
    return res.status(200).json({
      message: "User approved successfully",
      user,
    });
  } catch (error) {
    const status = error.message === "Pending user not found" ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}

export async function rejectPendingUser(req, res) {
  try {
    const user = await rejectUser(req.params.id);
    return res.status(200).json({
      message: "User rejected",
      user,
    });
  } catch (error) {
    const status = error.message === "Pending user not found" ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}

export async function inactivateManagedUser(req, res) {
  try {
    const user = await inactivateUser(req.params.id);
    return res.status(200).json({
      message: "User inactivated",
      user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
}

export async function reactivateManagedUser(req, res) {
  try {
    const user = await reactivateUser(req.params.id);
    return res.status(200).json({
      message: "User reactivated",
      user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
}

export async function inactivateAllManagedUsers(req, res) {
  try {
    const result = await inactivateAllUsers();
    return res.status(200).json({
      message: `${result.count} user${result.count === 1 ? "" : "s"} inactivated`,
      count: result.count,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteManagedUser(req, res) {
  try {
    await deleteUser(req.params.id);
    return res.status(200).json({
      message: "User deleted permanently",
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}
