import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let geminiClient = null;

export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
export const TRANSCRIPTION_MODELS = GEMINI_MODELS;
export const INSIGHT_MODELS = GEMINI_MODELS;
export const PATTERN_MODELS = GEMINI_MODELS;
export const PRD_MODELS = GEMINI_MODELS;
export const CHAT_MODELS = GEMINI_MODELS;

export class GeminiQuotaError extends Error {
  constructor(feature = "AI processing") {
    super(
      `Daily Gemini API limit reached. ${feature} could not complete. Free tier allows ~20 requests/day per model — wait until tomorrow or check usage at https://ai.dev/rate-limit`
    );
    this.name = "GeminiQuotaError";
    this.statusCode = 429;
    this.code = "GEMINI_QUOTA_EXCEEDED";
    this.feature = feature;
  }
}

export function isGeminiQuotaError(error) {
  return (
    error instanceof GeminiQuotaError ||
    error?.code === "GEMINI_QUOTA_EXCEEDED" ||
    /429|quota exceeded|Quota exceeded|Too Many Requests/i.test(error?.message || "")
  );
}

export function isRetryableGeminiError(error) {
  const msg = error?.message || "";
  return /503|429|fetch failed|high demand|unavailable|timeout|ECONNRESET|ETIMEDOUT|socket hang up|Too Many Requests/i.test(
    msg
  );
}

export function formatGeminiError(error, feature = "AI processing") {
  if (error instanceof GeminiQuotaError) {
    return error;
  }

  const msg = error?.message || String(error);

  if (/429|quota exceeded|Quota exceeded|Too Many Requests/i.test(msg)) {
    return new GeminiQuotaError(feature);
  }

  if (/503|high demand|unavailable|fetch failed/i.test(msg)) {
    const err = new Error(
      `Gemini is temporarily overloaded. ${feature} could not complete — please wait a minute and try again.`
    );
    err.statusCode = 503;
    err.code = "GEMINI_UNAVAILABLE";
    return err;
  }

  if (/GEMINI_API_KEY|API key/i.test(msg)) {
    const err = new Error("Gemini API key is missing or invalid. Check GEMINI_API_KEY in backend/.env");
    err.statusCode = 500;
    err.code = "GEMINI_CONFIG_ERROR";
    return err;
  }

  return error;
}

export function toAgentError(error, feature, prefix) {
  const formatted = formatGeminiError(error, feature);
  if (formatted instanceof GeminiQuotaError || formatted.statusCode) {
    return formatted;
  }
  return new Error(`${prefix}: ${formatted.message || "Unknown error"}`);
}

export function getGeminiClient() {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set in environment variables. Please set it in backend/.env"
    );
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

export function getModel(modelName = "gemini-2.5-flash") {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({ model: modelName });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call generateContent with retries and model fallback for transient Gemini errors.
 */
export async function generateContentWithFallback(modelNames, content, options = {}) {
  const { maxRetries = 2, baseDelayMs = 2500, feature = "AI processing" } = options;
  let lastError;

  for (const modelName of modelNames) {
    const model = getModel(modelName);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(content);
        return { result, modelName };
      } catch (error) {
        lastError = error;

        if (!isRetryableGeminiError(error)) {
          throw formatGeminiError(error, feature);
        }

        if (attempt < maxRetries) {
          await delay(baseDelayMs * (attempt + 1));
        }
      }
    }
  }

  throw formatGeminiError(lastError, feature);
}
