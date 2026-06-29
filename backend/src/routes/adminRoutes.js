import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireSuperAdmin } from "../middleware/superAdmin.js";
import {
  getPendingUsers,
  getManagedUsers,
  approvePendingUser,
  rejectPendingUser,
  inactivateManagedUser,
  reactivateManagedUser,
  inactivateAllManagedUsers,
  deleteManagedUser,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/pending-users", getPendingUsers);
router.get("/users", getManagedUsers);
router.post("/users/inactivate-all", inactivateAllManagedUsers);
router.post("/users/:id/approve", approvePendingUser);
router.post("/users/:id/reject", rejectPendingUser);
router.post("/users/:id/inactivate", inactivateManagedUser);
router.post("/users/:id/reactivate", reactivateManagedUser);
router.delete("/users/:id", deleteManagedUser);

export default router;
