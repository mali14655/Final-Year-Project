import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Legacy cleanup — access tokens are no longer stored in localStorage
localStorage.removeItem("cursor_pms_token");

let accessToken = null;
let refreshPromise = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/auth/refresh")
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/register") ||
      originalRequest?.url?.includes("/api/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute) {
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
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refreshSessionRequest() {
  const response = await api.post("/api/auth/refresh");
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
