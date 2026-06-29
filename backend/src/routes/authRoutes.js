import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updatePreferences,
  uploadAvatar,
  deleteAvatar,
  getAvatar,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { handleAvatarUpload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.put("/preferences", requireAuth, updatePreferences);
router.post("/avatar", requireAuth, handleAvatarUpload, uploadAvatar);
router.delete("/avatar", requireAuth, deleteAvatar);
router.get("/avatar", requireAuth, getAvatar);

export default router;
