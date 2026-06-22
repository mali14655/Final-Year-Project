import {
  generateContentWithFallback,
  TRANSCRIPTION_MODELS,
  toAgentError,
} from "../utils/geminiClient.js";
import { TRANSCRIBER_PROMPT } from "../prompts/transcriber.js";

/**
 * Transcriber Agent – Converts an uploaded interview file into a text transcript.
 *
 * Uses Gemini multimodal audio with retry + model fallback when the primary model
 * is overloaded (503 / fetch failed).
 *
 * @param {Object} file - Multer file object (buffer, mimetype, originalname, size, etc.)
 * @returns {Promise<Object>} - Transcription result
 */
export async function transcribeInterview(file) {
  try {
    if (!file || !file.buffer) {
      throw new Error("File buffer is required for transcription");
    }

    const mimeType = file.mimetype || "audio/mpeg";
    const base64Data = file.buffer.toString("base64");

    const content = [
      { text: TRANSCRIBER_PROMPT },
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ];

    const { result, modelName } = await generateContentWithFallback(
      TRANSCRIPTION_MODELS,
      content,
      { maxRetries: 2, baseDelayMs: 3000, feature: "Audio transcription" }
    );

    const response = await result.response;
    const transcript = (response.text() || "").trim();

    if (!transcript) {
      throw new Error("Transcription returned empty text");
    }

    return {
      transcript,
      speakers: [],
      metadata: {
        originalName: file.originalname,
        mimeType,
        size: file.size,
        generatedAt: new Date(),
        transcriptionModel: modelName,
      },
    };
  } catch (error) {
    throw toAgentError(error, "Audio transcription", "Transcription failed");
  }
}
