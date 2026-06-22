import {
  registerUser,
  loginUser,
  getUserById,
  refreshAuthSession,
  logoutUser,
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from "../services/authService.js";

function sendAuthResponse(res, statusCode, session) {
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());

  return res.status(statusCode).json({
    accessToken: session.accessToken,
    user: session.user,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const session = await registerUser({ name, email, password });
    return sendAuthResponse(res, 201, session);
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
    const isAuthError = error.message.includes("Invalid") || error.message.includes("required");
    return res.status(isAuthError ? 401 : 500).json({
      error: error.message,
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
    return res.status(401).json({ error: "Invalid or expired refresh token" });
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
