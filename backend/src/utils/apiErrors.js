import { GeminiQuotaError, isGeminiQuotaError } from "../services/aiService/utils/geminiClient.js";

/**
 * Send a consistent JSON error response for Gemini / agent failures.
 */
export function respondWithAgentError(res, error, defaultMessage) {
  const statusCode =
    error?.statusCode ||
    (isGeminiQuotaError(error) ? 429 : 500);

  const errorMessage = error?.message || defaultMessage;

  return res.status(statusCode).json({
    error: errorMessage,
    code: error?.code || (statusCode === 429 ? "GEMINI_QUOTA_EXCEEDED" : undefined),
    details:
      process.env.NODE_ENV === "development" && error?.stack
        ? error.message
        : undefined,
  });
}

export { GeminiQuotaError, isGeminiQuotaError };
