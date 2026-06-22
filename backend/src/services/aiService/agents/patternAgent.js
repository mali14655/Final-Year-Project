import {
  generateContentWithFallback,
  PATTERN_MODELS,
  toAgentError,
} from "../utils/geminiClient.js";
import { PATTERN_PROMPT } from "../prompts/pattern.js";

/**
 * Pattern Agent - Identifies trends and common themes across multiple interviews
 * @param {Array} interviews - Array of interview objects with transcripts and insights
 * @returns {Promise<Object>} - { patterns: Array, summary: Object }
 */
export async function identifyPatterns(interviews) {
  try {
    if (!Array.isArray(interviews) || interviews.length === 0) {
      throw new Error("At least one interview is required for pattern analysis");
    }

    const interviewData = interviews.map((interview, index) => ({
      id: interview.id || index + 1,
      transcript: interview.transcript || "",
      insights: interview.insights || [],
      metadata: interview.metadata || {},
    }));

    const interviewSummary = interviewData
      .map((interview) => {
        return `Interview ${interview.id}:
Transcript: ${interview.transcript.substring(0, 500)}...
Insights: ${JSON.stringify(interview.insights, null, 2)}`;
      })
      .join("\n\n---\n\n");

    const prompt = `${PATTERN_PROMPT}\n\nInterview Data:\n${interviewSummary}\n\nAnalyze these interviews and identify patterns.`;

    const { result } = await generateContentWithFallback(PATTERN_MODELS, prompt, {
      maxRetries: 2,
      baseDelayMs: 3000,
      feature: "Pattern analysis",
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
      parsed = parsePatternsFromText(text, interviews.length);
    }

    return normalizePatterns(parsed, interviews.length);
  } catch (error) {
    throw toAgentError(error, "Pattern analysis", "Pattern identification failed");
  }
}

function parsePatternsFromText(text, totalInterviews) {
  const patterns = [];
  const lines = text.split("\n");

  let currentPattern = null;

  for (const line of lines) {
    if (line.match(/^\d+\.|^[-*]/) || line.match(/^Pattern|^Theme|^Trend/i)) {
      if (currentPattern) {
        patterns.push(currentPattern);
      }
      currentPattern = {
        id: patterns.length + 1,
        name: line.replace(/^\d+\.|^[-*]\s*|^(Pattern|Theme|Trend):?\s*/i, "").trim(),
        type: "theme",
        description: "",
        frequency: 1,
        frequencyPercentage: (1 / totalInterviews) * 100,
        severity: "medium",
        affectedInterviews: [patterns.length + 1],
        supportingQuotes: [],
        userSegments: [],
        recommendations: [],
      };
    } else if (currentPattern && line.trim().length > 0) {
      if (!currentPattern.description) {
        currentPattern.description = line.trim();
      } else {
        currentPattern.description += " " + line.trim();
      }
    }
  }

  if (currentPattern) {
    patterns.push(currentPattern);
  }

  return {
    patterns,
    summary: {
      totalInterviews,
      topThemes: patterns.slice(0, 3).map((p) => p.name),
      criticalIssues: [],
      emergingTrends: [],
    },
  };
}

function normalizePatterns(data, totalInterviews) {
  let rawPatterns = data.patterns;

  if (typeof rawPatterns === "string") {
    try {
      rawPatterns = JSON.parse(rawPatterns);
    } catch {
      rawPatterns = [];
    }
  }

  const patterns = Array.isArray(rawPatterns) ? rawPatterns : [];
  const summary = data.summary || {
    totalInterviews,
    topThemes: [],
    criticalIssues: [],
    emergingTrends: [],
  };

  const normalizedPatterns = patterns.map((pattern, index) => {
    const affected = Array.isArray(pattern.affectedInterviews)
      ? pattern.affectedInterviews.map((id) => String(id))
      : [];

    return {
      id: pattern.id || index + 1,
      name: pattern.name || `Pattern ${index + 1}`,
      type: pattern.type || "theme",
      description: pattern.description || "",
      frequency: typeof pattern.frequency === "number" ? pattern.frequency : 1,
      frequencyPercentage:
        typeof pattern.frequencyPercentage === "number"
          ? pattern.frequencyPercentage
          : (pattern.frequency / totalInterviews) * 100,
      severity: pattern.severity || "medium",
      affectedInterviews: affected,
      supportingQuotes: Array.isArray(pattern.supportingQuotes) ? pattern.supportingQuotes : [],
      userSegments: Array.isArray(pattern.userSegments) ? pattern.userSegments : [],
      recommendations: Array.isArray(pattern.recommendations) ? pattern.recommendations : [],
    };
  });

  return {
    patterns: normalizedPatterns,
    summary: {
      totalInterviews,
      topThemes: Array.isArray(summary.topThemes) ? summary.topThemes : [],
      criticalIssues: Array.isArray(summary.criticalIssues) ? summary.criticalIssues : [],
      emergingTrends: Array.isArray(summary.emergingTrends) ? summary.emergingTrends : [],
    },
  };
}
