import {
  generateContentWithFallback,
  CHAT_MODELS,
  toAgentError,
} from "../utils/geminiClient.js";

/**
 * Chat Agent - Handles user requests to modify transcript, insights, or PRD
 * @param {string} userMessage - User's request/instruction
 * @param {Object} context - Current data (transcript, insights, prd)
 * @returns {Promise<Object>} - Modified data based on user request
 */
export async function processChatRequest(userMessage, context) {
  try {
    const { transcript, insights, prd } = context;

    let contextPrompt = "You are an AI assistant helping a Product Manager modify interview data.\n\n";

    if (transcript) {
      contextPrompt += `Current Transcript:\n${transcript.substring(0, 2000)}...\n\n`;
    }

    if (insights && insights.length > 0) {
      contextPrompt += `Current Insights:\n${JSON.stringify(insights.slice(0, 5), null, 2)}\n\n`;
    }

    if (prd) {
      contextPrompt += `Current PRD Title: ${prd.title || "N/A"}\n\n`;
    }

    contextPrompt += `User Request: ${userMessage}\n\n`;
    contextPrompt += `Based on the user's request, provide the modified data in JSON format:\n`;
    contextPrompt += `- If modifying transcript, return: {"transcript": "modified transcript text"}\n`;
    contextPrompt += `- If modifying insights, return: {"insights": [modified insights array]}\n`;
    contextPrompt += `- If modifying PRD, return: {"prd": {modified PRD object}}\n`;
    contextPrompt += `- If removing something, return the data without that item\n`;
    contextPrompt += `- Only return the fields that need to be changed\n`;
    contextPrompt += `- Respond ONLY with valid JSON, no additional text\n`;

    const { result } = await generateContentWithFallback(CHAT_MODELS, contextPrompt, {
      maxRetries: 2,
      baseDelayMs: 3000,
      feature: "Chat editing",
    });
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, "");
      cleanedText = cleanedText.replace(/^```\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/i, "");

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        success: false,
        message: "I understand your request, but couldn't parse the response. Please try rephrasing.",
        rawResponse: text,
      };
    }

    return {
      success: true,
      modifications: parsed,
      message: "Changes applied successfully",
    };
  } catch (error) {
    throw toAgentError(error, "Chat editing", "Chat processing failed");
  }
}
