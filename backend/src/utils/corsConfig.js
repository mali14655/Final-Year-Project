/**
 * Normalize origin URL for CORS (strip trailing slashes, trim whitespace).
 * Browsers send origins without a trailing slash; env vars often include one.
 */
export function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") {
    return "";
  }
  return origin.trim().replace(/\/+$/, "");
}

/**
 * Parse FRONTEND_ORIGIN — supports comma-separated list for preview URLs.
 */
export function getAllowedOrigins() {
  const raw = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  return raw
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

/**
 * CORS origin callback — returns the request origin only if it is allowed.
 */
export function corsOriginCallback(origin, callback) {
  const allowed = getAllowedOrigins();

  // Server-to-server or same-origin requests (no Origin header)
  if (!origin) {
    return callback(null, true);
  }

  const normalized = normalizeOrigin(origin);
  if (allowed.includes(normalized)) {
    return callback(null, normalized);
  }

  return callback(new Error(`CORS blocked for origin: ${origin}`));
}
