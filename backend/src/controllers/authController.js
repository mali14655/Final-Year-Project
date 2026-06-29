import {
  registerUser,
  loginUser,
  getUserById,
  refreshAuthSession,
  logoutUser,
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
} from "../services/authService.js";
import {
  updateUserProfile,
  changeUserPassword,
  updateUserPreferences,
  uploadUserAvatar,
  removeUserAvatar,
  getUserAvatarStream,
  getUserForAvatar,
} from "../services/userService.js";

function sendAuthResponse(res, statusCode, session) {
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());

  return res.status(statusCode).json({
    accessToken: session.accessToken,
    user: session.user,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });
    return res.status(201).json(result);
  } catch (error) {
    const isValidation =
      error.message.includes("required") ||
      error.message.includes("Password") ||
      error.message.includes("already exists");

    return res.status(isValidation ? 400 : 500).json({
      error: error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const session = await loginUser({ email, password });
    return sendAuthResponse(res, 200, session);
  } catch (error) {
    const isAuthError =
      error.message.includes("Invalid") ||
      error.message.includes("required") ||
      error.message.includes("not been approved") ||
      error.message.includes("inactivated") ||
      error.message.includes("No account found");
    return res.status(isAuthError ? 401 : 500).json({
      error: error.message,
      code: error.code,
    });
  }
}

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const session = await refreshAuthSession(refreshToken);
    return sendAuthResponse(res, 200, session);
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({
      error: error.message || "Invalid or expired refresh token",
      code: error.code || "REFRESH_INVALID",
    });
  }
}

export async function logout(req, res) {
  try {
    if (req.userId) {
      await logoutUser(req.userId);
    }
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(500).json({ error: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await getUserById(req.userId);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}

function isValidationError(message) {
  return (
    message.includes("required") ||
    message.includes("Password") ||
    message.includes("password") ||
    message.includes("already exists") ||
    message.includes("incorrect") ||
    message.includes("smaller than") ||
    message.includes("Only JPEG") ||
    message.includes("No image")
  );
}

export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const user = await updateUserProfile(req.userId, { name, email });
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(isValidationError(error.message) ? 400 : 500).json({
      error: error.message,
    });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.userId, { currentPassword, newPassword });
    clearRefreshCookie(res);
    return res.status(200).json({
      message: "Password updated. Please sign in again.",
      requireReauth: true,
    });
  } catch (error) {
    return res.status(isValidationError(error.message) ? 400 : 500).json({
      error: error.message,
    });
  }
}

export async function updatePreferences(req, res) {
  try {
    const user = await updateUserPreferences(req.userId, req.body || {});
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message,
    });
  }
}

export async function uploadAvatar(req, res) {
  try {
    const user = await uploadUserAvatar(req.userId, req.file);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(isValidationError(error.message) ? 400 : 500).json({
      error: error.message,
    });
  }
}

export async function deleteAvatar(req, res) {
  try {
    const user = await removeUserAvatar(req.userId);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message,
    });
  }
}

export async function getAvatar(req, res) {
  try {
    const user = await getUserForAvatar(req.userId);
    if (!user?.avatarGridfsFileId) {
      return res.status(404).json({ error: "No avatar uploaded" });
    }

    const contentType = user.avatarContentType || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "private, max-age=3600");

    const stream = getUserAvatarStream(user);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "Avatar not found in storage" });
      }
    });
    stream.pipe(res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
