// AI Service - Main export file for all AI agents
export { transcribeInterview } from "./agents/transcriberAgent.js";
export { extractInsights } from "./agents/insightAgent.js";
export { identifyPatterns } from "./agents/patternAgent.js";
export { generatePRD } from "./agents/prdAgent.js";

// Re-export Gemini client utilities if needed
export { getGeminiClient, getModel } from "./utils/geminiClient.js";
