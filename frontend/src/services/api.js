import axios from "axios";
import { showToast } from "../utils/toast";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

// Access token: in-memory only (cleared on full page refresh).
// Refresh token: httpOnly cookie from backend (survives refresh; used on app load).
localStorage.removeItem("cursor_pms_token");

let accessToken = null;
let refreshPromise = null;
let refreshTimerId = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function clearRefreshTimer() {
  if (refreshTimerId) {
    window.clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

function scheduleAccessTokenRefresh(token) {
  clearRefreshTimer();

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return;
  }

  const expiresAtMs = payload.exp * 1000;
  const refreshInMs = Math.max(expiresAtMs - Date.now() - 60_000, 5_000);

  refreshTimerId = window.setTimeout(() => {
    refreshAccessToken().catch(() => {
      clearAccessToken();
      window.dispatchEvent(new Event("auth:logout"));
    });
  }, refreshInMs);
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
  clearRefreshTimer();

  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    scheduleAccessTokenRefresh(accessToken);
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAccessToken() {
  setAccessToken(null);
  refreshPromise = null;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/auth/refresh")
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthRoute(url = "") {
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute(requestUrl)
    ) {
      originalRequest._retry = true;

      try {
        const session = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        window.dispatchEvent(new Event("auth:logout"));

        if (!originalRequest?.suppressAuthToast) {
          showToast.error("Your session expired. Please sign in again.");
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute(requestUrl)) {
      clearAccessToken();
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  }
);

export async function loginRequest(email, password) {
  const response = await api.post("/api/auth/login", { email, password });
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function registerRequest(name, email, password) {
  const response = await api.post("/api/auth/register", { name, email, password });
  if (response.data.pendingApproval) {
    return response.data;
  }
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refreshSessionRequest() {
  const response = await api.post("/api/auth/refresh", null, {
    suppressAuthToast: true,
  });
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function logoutRequest() {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export async function fetchCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data.user;
}

export async function updateProfileRequest({ name, email }) {
  const response = await api.put("/api/auth/profile", { name, email });
  return response.data.user;
}

export async function changePasswordRequest({ currentPassword, newPassword }) {
  const response = await api.put("/api/auth/password", { currentPassword, newPassword });
  return response.data;
}

export async function updatePreferencesRequest(preferences) {
  const response = await api.put("/api/auth/preferences", preferences);
  return response.data.user;
}

export async function uploadAvatarRequest(file) {
  const formData = new FormData();
  formData.append("avatar", file, file.name || "avatar.jpg");
  const response = await api.post("/api/auth/avatar", formData, {
    timeout: 60000,
  });
  return response.data.user;
}

export async function removeAvatarRequest() {
  const response = await api.delete("/api/auth/avatar");
  return response.data.user;
}

export async function fetchAvatarBlobUrl(cacheKey) {
  const response = await api.get("/api/auth/avatar", {
    responseType: "blob",
    params: cacheKey ? { v: cacheKey } : undefined,
  });
  return URL.createObjectURL(response.data);
}

export async function fetchPendingUsers() {
  const response = await api.get("/api/admin/pending-users");
  return response.data;
}

export async function approveUserRequest(userId) {
  const response = await api.post(`/api/admin/users/${userId}/approve`);
  return response.data;
}

export async function rejectUserRequest(userId) {
  const response = await api.post(`/api/admin/users/${userId}/reject`);
  return response.data;
}

export async function fetchManagedUsers() {
  const response = await api.get("/api/admin/users");
  return response.data;
}

export async function inactivateUserRequest(userId) {
  const response = await api.post(`/api/admin/users/${userId}/inactivate`);
  return response.data;
}

export async function reactivateUserRequest(userId) {
  const response = await api.post(`/api/admin/users/${userId}/reactivate`);
  return response.data;
}

export async function inactivateAllUsersRequest() {
  const response = await api.post("/api/admin/users/inactivate-all");
  return response.data;
}

export async function deleteUserRequest(userId) {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data;
}
