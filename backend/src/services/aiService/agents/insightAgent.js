import { generateContentWithFallback, INSIGHT_MODELS, toAgentError } from "../utils/geminiClient.js";
import { INSIGHT_PROMPT } from "../prompts/insight.js";

/**
 * Insight Agent - Extracts pain points, feature requests, quotes, and sentiment from interview transcript
 * @param {string} transcript - The interview transcript
 * @returns {Promise<Object>} - { insights: Array, overallSentiment: Object }
 */
export async function extractInsights(transcript) {
  try {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is required for insight extraction");
    }

    const prompt = `${INSIGHT_PROMPT}\n\nInterview Transcript:\n${transcript}\n\nAnalyze this transcript and extract insights.`;

    const { result } = await generateContentWithFallback(INSIGHT_MODELS, prompt, {
      maxRetries: 2,
      baseDelayMs: 3000,
      feature: "Insight extraction",
    });

    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, "");
      cleanedText = cleanedText.replace(/^```\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/i, "");
      cleanedText = cleanedText.trim();

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      parsed = parseInsightsFromText(text);
    }

    const normalized = normalizeInsights(parsed);

    if (normalized.insights.length === 0) {
      throw new Error("No insights could be extracted from the transcript");
    }

    return normalized;
  } catch (error) {
    throw toAgentError(error, "Insight extraction", "Insight extraction failed");
  }
}

function parseInsightsFromText(text) {
  const insights = [];
  const lines = text.split("\n");

  let currentInsight = null;
  let overallSentiment = { score: 0, label: "neutral", summary: "" };

  for (const line of lines) {
    if (line.match(/^\d+\.|^[-*]/)) {
      if (currentInsight) {
        insights.push(currentInsight);
      }
      currentInsight = {
        id: insights.length + 1,
        type: "pain_point",
        summary: line.replace(/^\d+\.|^[-*]\s*/, "").trim(),
        category: "pain",
        quote: "",
        sentiment: 0,
        context: "",
        priority: "medium",
      };
    } else if (currentInsight && line.toLowerCase().includes("quote")) {
      currentInsight.quote = line.replace(/quote:?/i, "").trim().replace(/["']/g, "");
    } else if (line.toLowerCase().includes("sentiment")) {
      const sentimentMatch = line.match(/(-?\d+\.?\d*)/);
      if (sentimentMatch) {
        overallSentiment.score = parseFloat(sentimentMatch[1]);
        overallSentiment.label =
          overallSentiment.score > 0.3 ? "positive" : overallSentiment.score < -0.3 ? "negative" : "neutral";
      }
    }
  }

  if (currentInsight) {
    insights.push(currentInsight);
  }

  return { insights, overallSentiment };
}

function normalizeInsights(data) {
  const insights = Array.isArray(data.insights) ? data.insights : [];
  const overallSentiment = data.overallSentiment || {
    score: 0,
    label: "neutral",
    summary: "Sentiment analysis not available",
  };

  const normalizedInsights = insights
    .map((insight, index) => ({
      id: insight.id || index + 1,
      type: insight.type || "pain_point",
      summary: insight.summary || "",
      category: insight.category || "pain",
      quote: insight.quote || "",
      sentiment: typeof insight.sentiment === "number" ? insight.sentiment : 0,
      context: insight.context || "",
      priority: insight.priority || "medium",
    }))
    .filter((insight) => insight.summary.trim().length > 0);

  return {
    insights: normalizedInsights,
    overallSentiment: {
      score: typeof overallSentiment.score === "number" ? overallSentiment.score : 0,
      label: overallSentiment.label || "neutral",
      summary: overallSentiment.summary || "",
    },
  };
}
