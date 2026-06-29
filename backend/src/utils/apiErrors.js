import { GeminiQuotaError, isGeminiQuotaError, formatGeminiError } from "../services/aiService/utils/geminiClient.js";

function cleanAgentMessage(message, defaultMessage) {
  const raw = (message || defaultMessage || "Something went wrong").trim();

  if (/^[^:]+:\s*.+/.test(raw) && /failed|error/i.test(raw.split(":")[0])) {
    return raw.replace(/^[^:]+:\s*/, "").trim() || defaultMessage;
  }

  return raw;
}

/**
 * Send a consistent JSON error response for Gemini / agent failures.
 */
export function respondWithAgentError(res, error, defaultMessage) {
  const formatted = formatGeminiError(error, defaultMessage);
  const statusCode =
    formatted?.statusCode ||
    error?.statusCode ||
    (isGeminiQuotaError(formatted) || isGeminiQuotaError(error) ? 429 : 500);

  const code =
    formatted?.code ||
    error?.code ||
    (statusCode === 429 ? "GEMINI_QUOTA_EXCEEDED" : undefined);

  const errorMessage = cleanAgentMessage(formatted?.message || error?.message, defaultMessage);

  return res.status(statusCode).json({
    error: errorMessage,
    code,
    details:
      process.env.NODE_ENV === "development" && error?.stack
        ? error.message
        : undefined,
  });
}

export { GeminiQuotaError, isGeminiQuotaError };
