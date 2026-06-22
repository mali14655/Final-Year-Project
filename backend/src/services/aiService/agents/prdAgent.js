import {
  generateContentWithFallback,
  PRD_MODELS,
  toAgentError,
} from "../utils/geminiClient.js";
import { PRD_PROMPT } from "../prompts/prd.js";

/**
 * Extract participant name from interview title, filename, or transcript.
 * @param {Object} interview
 * @returns {string}
 */
export function extractParticipantName(interview) {
  const title = interview.filename || interview.originalName || "";
  const transcript = interview.transcript || "";

  let match = title.match(/^([A-Za-z]+)\s*[-–]/);
  if (match) return match[1];

  match = title.match(/interview-\d+-([a-z]+)-/i);
  if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);

  match = transcript.match(/(?:Hi|Hey),?\s+([A-Z][a-z]+)/);
  if (match) return match[1];

  match = transcript.match(/thank you,?\s+([A-Z][a-z]+)/i);
  if (match) return match[1];

  const cleaned = title.replace(/\.[^.]+$/, "").trim();
  return cleaned || "Interview participant";
}

/**
 * Build per-interview summary for PRD context.
 * @param {Array} interviews
 * @returns {Array}
 */
export function buildInterviewSummaries(interviews) {
  return interviews.map((interview) => {
    const title = interview.filename || interview.originalName || "Untitled interview";
    const participantName = extractParticipantName(interview);
    const insights = interview.insights || [];

    const insightLines = insights
      .map((insight, index) => {
        const quote = insight.quote ? ` Quote: "${insight.quote}"` : "";
        return `  ${index + 1}. [${insight.category || insight.type}] ${insight.summary}${quote}`;
      })
      .join("\n");

    return {
      id: interview._id?.toString() || interview.id || "",
      title,
      participantName,
      insightCount: insights.length,
      insightLines,
    };
  });
}

/**
 * PRD Agent - Converts insights and patterns into a structured Product Requirements Document
 * @param {Object} data
 * @param {Array} data.insights - Aggregated insights from all interviews
 * @param {Array} data.patterns - Cross-interview patterns
 * @param {Array} data.interviews - Per-interview records (title, transcript, insights)
 * @param {Object} data.projectContext - Project name and description
 * @returns {Promise<Object>}
 */
export async function generatePRD(data) {
  try {
    const { insights = [], patterns = [], interviews = [], projectContext = {} } = data;

    if (insights.length === 0 && patterns.length === 0) {
      throw new Error("Insights or patterns are required for PRD generation");
    }

    const interviewSummaries = buildInterviewSummaries(interviews);
    const interviewBlock =
      interviewSummaries.length > 0
        ? interviewSummaries
            .map(
              (item) =>
                `Interview: "${item.title}"\nParticipant: ${item.participantName}\nInsights (${item.insightCount}):\n${item.insightLines || "  (none)"}`
            )
            .join("\n\n")
        : "No per-interview breakdown available — use aggregated insights only.";

    const insightsSummary = insights
      .map((insight, index) => {
        const source = insight._sourceInterview ? ` [from: ${insight._sourceInterview}]` : "";
        return `${index + 1}. [${insight.category}] ${insight.summary}${insight.quote ? ` - "${insight.quote}"` : ""}${source}`;
      })
      .join("\n");

    const patternsSummary =
      patterns.length > 0
        ? patterns
            .map(
              (pattern, index) =>
                `${index + 1}. ${pattern.name} (${pattern.frequencyPercentage}% of interviews) — ${pattern.description}`
            )
            .join("\n")
        : "No cross-interview patterns yet (single interview or patterns not analyzed).";

    const projectInfo = projectContext.name
      ? `Project: ${projectContext.name}\nDescription: ${projectContext.description || "N/A"}\n\n`
      : "";

    const prompt = `${PRD_PROMPT}

${projectInfo}=== INTERVIEW SUMMARIES (use these for personas — one persona per participant) ===
${interviewBlock}

=== ALL INSIGHTS (aggregated) ===
${insightsSummary}

=== CROSS-INTERVIEW PATTERNS ===
${patternsSummary}

Generate the PRD JSON. Personas must use real participant names from the interview summaries. Problem statement must be specific and non-repetitive.`;

    const { result } = await generateContentWithFallback(PRD_MODELS, prompt, {
      maxRetries: 2,
      baseDelayMs: 3000,
      feature: "PRD generation",
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
      parsed = parsePRDFromText(text, projectContext);
    }

    return normalizePRD(parsed, projectContext);
  } catch (error) {
    throw toAgentError(error, "PRD generation", "PRD generation failed");
  }
}

function parsePRDFromText(text, projectContext) {
  const prd = {
    title: projectContext.name || "Product Requirements Document",
    version: "1.0",
    date: new Date().toISOString().split("T")[0],
    executiveSummary: "",
    problemStatement: {
      problem: "",
      impact: "",
      currentState: "",
      desiredState: "",
    },
    userPersonas: [],
    goals: [],
    features: [],
    timeline: { phases: [] },
    successMetrics: { primary: [], secondary: [] },
  };

  const sections = text.split(/\n(?=\d+\.|\n[A-Z])/);
  for (const section of sections) {
    if (section.toLowerCase().includes("executive summary")) {
      prd.executiveSummary = section.replace(/executive summary:?/i, "").trim();
    } else if (section.toLowerCase().includes("problem")) {
      prd.problemStatement.problem = section.replace(/problem:?/i, "").trim();
    } else if (section.toLowerCase().includes("feature")) {
      const featureMatch = section.match(/feature\s*\d*:?\s*(.+)/i);
      if (featureMatch) {
        prd.features.push({
          id: prd.features.length + 1,
          name: featureMatch[1].trim(),
          description: section,
          priority: "P1",
          userStories: [],
          dependencies: [],
          risks: [],
        });
      }
    }
  }

  return prd;
}

function normalizePRD(data, projectContext) {
  return {
    title: data.title || projectContext.name || "Product Requirements Document",
    version: data.version || "1.0",
    date: data.date || new Date().toISOString().split("T")[0],
    executiveSummary: data.executiveSummary || "",
    problemStatement: {
      problem: data.problemStatement?.problem || "",
      impact: data.problemStatement?.impact || "",
      currentState: data.problemStatement?.currentState || "",
      desiredState: data.problemStatement?.desiredState || "",
    },
    userPersonas: Array.isArray(data.userPersonas)
      ? data.userPersonas.map((persona, index) => ({
          name: persona.name || `Persona ${index + 1}`,
          basedOnInterview: persona.basedOnInterview || persona.sourceInterview || "",
          description: persona.description || "",
          needs: Array.isArray(persona.needs) ? persona.needs : [],
          painPoints: Array.isArray(persona.painPoints) ? persona.painPoints : [],
        }))
      : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    features: Array.isArray(data.features)
      ? data.features.map((feature, index) => ({
          id: feature.id || index + 1,
          name: feature.name || `Feature ${index + 1}`,
          description: feature.description || "",
          priority: feature.priority || "P2",
          userStories: Array.isArray(feature.userStories) ? feature.userStories : [],
          dependencies: Array.isArray(feature.dependencies) ? feature.dependencies : [],
          risks: Array.isArray(feature.risks) ? feature.risks : [],
        }))
      : [],
    timeline: {
      phases: Array.isArray(data.timeline?.phases) ? data.timeline.phases : [],
    },
    successMetrics: {
      primary: Array.isArray(data.successMetrics?.primary) ? data.successMetrics.primary : [],
      secondary: Array.isArray(data.successMetrics?.secondary) ? data.successMetrics.secondary : [],
    },
  };
}
