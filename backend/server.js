import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { transcribeInterview, extractInsights, identifyPatterns, generatePRD } from "./src/services/aiService/index.js";
import { extractParticipantName } from "./src/services/aiService/agents/prdAgent.js";
import { generateContentWithFallback, CHAT_MODELS } from "./src/services/aiService/utils/geminiClient.js";
import { processChatRequest } from "./src/services/aiService/agents/chatAgent.js";
import { connectDB } from "./src/utils/db.js";
import { respondWithAgentError } from "./src/utils/apiErrors.js";
import Interview from "./src/models/Interview.js";
import Project from "./src/models/Project.js";
import { uploadToGridFS, getGridFSReadStream, deleteFromGridFS, replaceGridFSFile } from "./src/utils/gridfs.js";
import { transcriptToPdfBuffer, getPdfFilename } from "./src/utils/transcriptToPdf.js";
import authRoutes from "./src/routes/authRoutes.js";
import { requireAuth } from "./src/middleware/auth.js";
import { findProjectForUser, getInterviewAccess } from "./src/utils/accessControl.js";

dotenv.config();

// Connect to MongoDB
connectDB().catch(console.error);

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return next();
  }
  if (req.path.startsWith("/api/auth")) {
    return next();
  }
  return requireAuth(req, res, next);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * Helper function to parse JSON that might be wrapped in markdown code blocks
 * @param {string} text - Text that might contain JSON
 * @returns {Object} - Parsed JSON object
 */
function parseJSONResponse(text) {
  if (!text || typeof text !== "string") {
    return { transcript: "", insights: [] };
  }

  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  
  // Remove ```json and ``` markers
  cleanedText = cleanedText.replace(/^```json\s*/i, "");
  cleanedText = cleanedText.replace(/^```\s*/i, "");
  cleanedText = cleanedText.replace(/\s*```$/i, "");
  cleanedText = cleanedText.trim();

  // Try to find JSON object in the text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleanedText);
    
    // Ensure we have the expected structure
    if (typeof parsed === "object" && parsed !== null) {
      return {
        transcript: parsed.transcript || "",
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      };
    }
  } catch (parseError) {
    // If JSON parsing fails, return transcript as text and empty insights
    return {
      transcript: cleanedText,
      insights: [],
    };
  }

  return { transcript: "", insights: [] };
}

/**
 * Ensure insights and speakers have IDs
 */
function normalizeInsightsAndSpeakers(result) {
  let insights = Array.isArray(result.insights) ? result.insights : [];
  insights = insights.map((insight, index) => ({
    ...insight,
    id: insight.id || index + 1,
  }));

  let speakers = Array.isArray(result.speakers) ? result.speakers : [];
  speakers = speakers.map((speaker, index) => ({
    ...speaker,
    id: speaker.id || index + 1,
  }));

  return { insights, speakers };
}

/**
 * Save interview to database
 */
async function saveInterviewToDatabase(interviewData) {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  const interview = new Interview(interviewData);
  const savedInterview = await interview.save();
  return savedInterview;
}

/**
 * Link interview to project
 */
async function linkInterviewToProject(projectId, interviewId, userId) {
  const project = await findProjectForUser(projectId, userId);
  if (!project) {
    throw new Error("Project not found");
  }

  const { allowed, interview } = await getInterviewAccess(interviewId, userId);
  if (!allowed || !interview) {
    throw new Error("Interview not found");
  }

  interview.projectId = projectId;
  if (userId && !interview.userId) {
    interview.userId = userId;
  }
  await interview.save();

  if (!project.interviews.some((id) => id.toString() === interviewId.toString())) {
    project.interviews.push(interviewId);
    await project.save();
  }

  return project;
}

function getSourceTypeFromMime(mimeType) {
  if (mimeType && mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType && mimeType.startsWith("audio/")) {
    return "audio";
  }
  return "text";
}

function formatInterviewResponse(interview) {
  return {
    id: interview._id,
    filename: interview.filename,
    originalName: interview.originalName,
    mimeType: interview.mimeType,
    transcript: interview.transcript,
    insights: interview.insights,
    speakers: interview.speakers,
    overallSentiment: interview.overallSentiment,
    sourceType: interview.sourceType,
    gridfsFileId: interview.gridfsFileId,
    storedContentType: interview.storedContentType,
    hasStoredFile: Boolean(interview.gridfsFileId),
    createdAt: interview.createdAt,
    metadata: interview.metadata,
  };
}

async function refreshTextInterviewPdf(interview) {
  if (interview.sourceType !== "text" || !interview.transcript) {
    return interview;
  }

  const pdfBuffer = await transcriptToPdfBuffer(
    interview.transcript,
    interview.originalName?.replace(/\.(txt|pdf)$/i, "") || "Interview Transcript"
  );
  const pdfFilename = getPdfFilename(interview.originalName);

  interview.gridfsFileId = await replaceGridFSFile(
    interview.gridfsFileId,
    pdfBuffer,
    pdfFilename,
    "application/pdf"
  );
  interview.storedContentType = "application/pdf";
  return interview;
}

/**
 * Delete interview document and its GridFS file; unlink from project if linked
 */
async function deleteInterviewRecord(interview) {
  if (!interview) {
    return;
  }

  if (interview.gridfsFileId) {
    await deleteFromGridFS(interview.gridfsFileId);
  }

  if (interview.projectId) {
    await Project.findByIdAndUpdate(interview.projectId, {
      $pull: { interviews: interview._id },
    });
  }

  await Interview.findByIdAndDelete(interview._id);
}

/**
 * Extract insights from transcript text (skip transcription)
 */
async function processTextTranscript(transcript) {
  const trimmed = transcript.trim();
  if (!trimmed || trimmed.length < 20) {
    throw new Error("Transcript must be at least 20 characters");
  }

  let insightsResult;
  try {
    insightsResult = await extractInsights(trimmed);
  } catch (insightError) {
    insightsResult = { insights: [], overallSentiment: { score: 0, label: "neutral", summary: "" } };
  }

  const insights = Array.isArray(insightsResult.insights) ? insightsResult.insights : [];
  const overallSentiment = insightsResult.overallSentiment || {
    score: 0,
    label: "neutral",
    summary: "",
  };

  return {
    transcript: trimmed,
    insights,
    speakers: [],
    metadata: { processedAt: new Date(), source: "text" },
    overallSentiment,
  };
}

/**
 * Process interview file using the new AI agents
 * @param {Object} file - File object with buffer, mimetype, etc.
 * @returns {Promise<Object>} - { transcript: string, insights: Array }
 */
async function processInterview(file) {
  try {
    // Step 1: Transcribe the interview
    const transcription = await transcribeInterview(file);
    const transcript = transcription.transcript || "";

    // Step 2: Extract insights from the transcript
    let insightsResult;
    try {
      insightsResult = await extractInsights(transcript);
    } catch (insightError) {
      console.warn("Insight extraction failed, using fallback:", insightError.message);
      insightsResult = { insights: [], overallSentiment: { score: 0, label: "neutral", summary: "" } };
    }

    // Ensure insights is an array
    const insights = Array.isArray(insightsResult.insights) ? insightsResult.insights : [];
    const overallSentiment = insightsResult.overallSentiment || {
      score: 0,
      label: "neutral",
      summary: "",
    };

    return {
      transcript,
      insights,
      speakers: transcription.speakers || [],
      metadata: transcription.metadata || {},
      overallSentiment,
    };
  } catch (error) {
    console.error("Error processing interview:", error);
    throw error;
  }
}

app.post(
  "/api/process",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const result = await processInterview(req.file);
      const { insights, speakers } = normalizeInsightsAndSpeakers(result);

      try {
        const gridfsFileId = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        const savedInterview = await saveInterviewToDatabase({
          filename: req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          transcript: result.transcript || "",
          insights,
          speakers,
          overallSentiment: result.overallSentiment || { score: 0, label: "neutral", summary: "" },
          sourceType: getSourceTypeFromMime(req.file.mimetype),
          gridfsFileId,
          storedContentType: req.file.mimetype,
          userId: req.userId,
          metadata: {
            processedAt: new Date(),
            ...result.metadata,
          },
        });

        return res.status(200).json({
          ...formatInterviewResponse(savedInterview),
        });
      } catch (saveError) {
        return res.status(200).json({
          id: null,
          transcript: result.transcript || "",
          insights,
          speakers,
          metadata: result.metadata || {},
          createdAt: new Date(),
          warning: "Interview processed but not saved to database. Check server logs.",
        });
      }
    } catch (error) {
      console.error("Error processing interview:", error);
      return respondWithAgentError(res, error, "Failed to process interview");
    }
  }
);

// Process pasted text transcript (skip audio transcription)
app.post("/api/process-text", async (req, res) => {
  try {
    const { transcript, title, projectId } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({ error: "Transcript text is required" });
    }

    const result = await processTextTranscript(transcript);
    const { insights, speakers } = normalizeInsightsAndSpeakers(result);

    const displayName = (title && title.trim()) || `text-interview-${Date.now()}.txt`;
    const pdfFilename = getPdfFilename(displayName);

    try {
      const pdfBuffer = await transcriptToPdfBuffer(
        result.transcript,
        displayName.replace(/\.txt$/i, "")
      );
      const gridfsFileId = await uploadToGridFS(pdfBuffer, pdfFilename, "application/pdf");

      const savedInterview = await saveInterviewToDatabase({
        filename: displayName,
        originalName: displayName,
        mimeType: "text/plain",
        fileSize: result.transcript.length,
        transcript: result.transcript,
        insights,
        speakers,
        overallSentiment: result.overallSentiment,
        sourceType: "text",
        gridfsFileId,
        storedContentType: "application/pdf",
        userId: req.userId,
        metadata: result.metadata,
      });

      if (projectId) {
        await linkInterviewToProject(projectId, savedInterview._id, req.userId);
      }

      return res.status(200).json({
        ...formatInterviewResponse(savedInterview),
        linkedToProject: Boolean(projectId),
      });
    } catch (saveError) {
      return res.status(200).json({
        id: null,
        transcript: result.transcript,
        insights,
        speakers,
        metadata: result.metadata,
        createdAt: new Date(),
        warning: "Interview processed but not saved to database. Check server logs.",
      });
    }
  } catch (error) {
    if (error.message?.includes("at least")) {
      return res.status(400).json({ error: error.message });
    }
    return respondWithAgentError(res, error, "Failed to process transcript");
  }
});

// Stream stored interview file (audio, video, or PDF)
app.get("/api/interviews/:id/file", async (req, res) => {
  try {
    const { allowed, interview } = await getInterviewAccess(req.params.id, req.userId);
    if (!allowed || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    if (!interview.gridfsFileId) {
      return res.status(404).json({ error: "No file stored for this interview" });
    }

    const contentType = interview.storedContentType || interview.mimeType || "application/octet-stream";
    const downloadName = interview.sourceType === "text"
      ? getPdfFilename(interview.originalName)
      : interview.originalName;

    res.set("Content-Type", contentType);
    res.set("Content-Disposition", `inline; filename="${downloadName}"`);

    const stream = getGridFSReadStream(interview.gridfsFileId);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "File not found in storage" });
      }
    });
    stream.pipe(res);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve file",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get all interviews for the authenticated user
app.get("/api/interviews", async (req, res) => {
  try {
    const userProjects = await Project.find({ userId: req.userId }).select("_id");
    const projectIds = userProjects.map((project) => project._id);

    const interviews = await Interview.find({
      $or: [{ userId: req.userId }, { projectId: { $in: projectIds } }],
    })
      .sort({ createdAt: -1 })
      .select("filename originalName transcript insights speakers createdAt metadata sourceType gridfsFileId storedContentType mimeType")
      .limit(100);

    return res.status(200).json({
      interviews: interviews.map((interview) => formatInterviewResponse(interview)),
      count: interviews.length,
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return res.status(500).json({
      error: "Failed to fetch interviews",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get single interview by ID
app.get("/api/interviews/:id", async (req, res) => {
  try {
    const { allowed, interview } = await getInterviewAccess(req.params.id, req.userId);
    if (!allowed || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    return res.status(200).json(formatInterviewResponse(interview));
  } catch (error) {
    console.error("Error fetching interview:", error);
    return res.status(500).json({
      error: "Failed to fetch interview",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Re-extract insights from an existing transcript (e.g. after quota failure during upload)
app.post("/api/interviews/:id/extract-insights", async (req, res) => {
  try {
    const { allowed, interview } = await getInterviewAccess(req.params.id, req.userId);
    if (!allowed || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    if (!interview.transcript?.trim()) {
      return res.status(400).json({ error: "Interview has no transcript to analyze" });
    }

    const insightsResult = await extractInsights(interview.transcript);
    interview.insights = insightsResult.insights;
    interview.overallSentiment = insightsResult.overallSentiment;
    await interview.save();

    return res.status(200).json({
      message: "Insights extracted successfully",
      interview: formatInterviewResponse(interview),
      insightsCount: insightsResult.insights.length,
    });
  } catch (error) {
    console.error("Error extracting insights:", error);
    return respondWithAgentError(res, error, "Failed to extract insights");
  }
});

// Delete interview and its GridFS file
app.delete("/api/interviews/:id", async (req, res) => {
  try {
    const { allowed, interview } = await getInterviewAccess(req.params.id, req.userId);
    if (!allowed || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    await deleteInterviewRecord(interview);

    return res.status(200).json({ message: "Interview deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete interview",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Pattern Analysis - Analyze multiple interviews
app.post("/api/analyze-patterns", async (req, res) => {
  try {
    const { interviewIds, projectId } = req.body;

    if (!interviewIds || !Array.isArray(interviewIds) || interviewIds.length === 0) {
      return res.status(400).json({ error: "interviewIds array is required" });
    }

    const interviews = [];
    for (const interviewId of interviewIds) {
      const { allowed, interview } = await getInterviewAccess(interviewId, req.userId);
      if (!allowed || !interview) {
        return res.status(403).json({ error: "You do not have access to one or more interviews" });
      }
      interviews.push(interview);
    }

    if (projectId) {
      const project = await findProjectForUser(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
    }

    const interviewData = interviews.map((interview) => ({
      id: interview._id.toString(),
      transcript: interview.transcript || "",
      insights: interview.insights || [],
      metadata: interview.metadata || {},
    }));

    // Run pattern analysis
    const patternsResult = await identifyPatterns(interviewData);

    // Optionally save patterns to project if projectId provided
    if (projectId) {
      const project = await findProjectForUser(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      project.patterns = {
        identifiedAt: new Date(),
        patterns: patternsResult.patterns,
        summary: patternsResult.summary,
      };
      await project.save();
    }

    return res.status(200).json({
      patterns: patternsResult.patterns,
      summary: patternsResult.summary,
      analyzedInterviews: interviewIds,
      analyzedCount: interviews.length,
    });
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    return respondWithAgentError(res, error, "Failed to analyze patterns");
  }
});

// PRD Generation - Generate PRD from insights and patterns
// Supports: interviewIds (array), interviewId (single), or insights (direct)
app.post("/api/generate-prd", async (req, res) => {
  try {
    const { interviewIds, interviewId, insights, projectId, projectContext } = req.body;

    let allInsights = [];
    let interviewIdsUsed = [];
    let interviewRecords = [];

    if (insights && Array.isArray(insights) && insights.length > 0) {
      allInsights = insights;
    } else if (interviewId) {
      const { allowed, interview } = await getInterviewAccess(interviewId, req.userId);
      if (!allowed || !interview) {
        return res.status(404).json({ error: "Interview not found" });
      }
      interviewRecords = [interview];
      interviewIdsUsed = [interviewId];
    } else if (interviewIds && Array.isArray(interviewIds) && interviewIds.length > 0) {
      interviewRecords = [];
      for (const id of interviewIds) {
        const { allowed, interview } = await getInterviewAccess(id, req.userId);
        if (!allowed || !interview) {
          return res.status(403).json({ error: "You do not have access to one or more interviews" });
        }
        interviewRecords.push(interview);
      }

      interviewIdsUsed = interviewIds;
    } else {
      return res.status(400).json({
        error: "Either 'insights', 'interviewId', or 'interviewIds' is required",
      });
    }

    if (interviewRecords.length > 0) {
      allInsights = interviewRecords.flatMap((interview) => {
        const sourceTitle = interview.filename || interview.originalName || "Interview";
        return (interview.insights || []).map((insight) => ({
          ...insight.toObject ? insight.toObject() : insight,
          _sourceInterview: sourceTitle,
          _participantName: extractParticipantName(interview),
        }));
      });
    }

    if (allInsights.length === 0) {
      return res.status(400).json({ error: "No insights found to generate PRD" });
    }

    let patterns = [];
    if (interviewIdsUsed.length > 1) {
      if (projectId) {
        const project = await findProjectForUser(projectId, req.userId);
        if (project && project.patterns && project.patterns.patterns) {
          patterns = project.patterns.patterns;
        }
      }

      if (patterns.length === 0) {
        const interviewData = interviewRecords.map((interview) => ({
          id: interview._id.toString(),
          transcript: interview.transcript || "",
          insights: interview.insights || [],
          metadata: interview.metadata || {},
        }));
        const patternsResult = await identifyPatterns(interviewData);
        patterns = patternsResult.patterns;
      }
    }

    const prdData = {
      insights: allInsights,
      patterns: patterns,
      interviews: interviewRecords,
      projectContext: projectContext || {
        name: "Product Requirements",
        description: "Generated from user interviews",
      },
    };

    const prd = await generatePRD(prdData);

    // Optionally save PRD to project if projectId provided
    if (projectId) {
      const project = await findProjectForUser(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      project.prd = {
        generatedAt: new Date(),
        document: prd,
      };
      await project.save();
    }

    return res.status(200).json({
      prd: prd,
      basedOnInterviews: interviewIdsUsed,
      interviewCount: interviewIdsUsed.length,
      insightsCount: allInsights.length,
      patternsCount: patterns.length,
    });
  } catch (error) {
    console.error("Error generating PRD:", error);
    return respondWithAgentError(res, error, "Failed to generate PRD");
  }
});

// ==================== PROJECT ENDPOINTS ====================

// Create a new project
app.post("/api/projects", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || "",
      userId: req.userId,
    });

    const savedProject = await project.save();
    console.log("Project created:", savedProject._id);

    return res.status(201).json({
      id: savedProject._id,
      name: savedProject.name,
      description: savedProject.description,
      interviews: [],
      patterns: null,
      prd: null,
      createdAt: savedProject.createdAt,
      updatedAt: savedProject.updatedAt,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      error: "Failed to create project",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get all projects for the authenticated user
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("interviews", "filename originalName transcript insights speakers createdAt")
      .select("name description interviews patterns prd createdAt updatedAt");

    return res.status(200).json({
      projects: projects.map((project) => ({
        id: project._id,
        name: project.name,
        description: project.description,
        interviewCount: project.interviews?.length || 0,
        interviews: project.interviews || [],
        hasPatterns: project.patterns?.patterns?.length > 0,
        hasPRD: project.prd?.document !== null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
      count: projects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      error: "Failed to fetch projects",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get specific project with all data
app.get("/api/projects/:id", async (req, res) => {
  try {
    const ownedProject = await findProjectForUser(req.params.id, req.userId);
    if (!ownedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await Project.findById(ownedProject._id).populate(
      "interviews",
      "filename originalName transcript insights speakers overallSentiment metadata createdAt sourceType gridfsFileId storedContentType mimeType"
    );

    return res.status(200).json({
      id: project._id,
      name: project.name,
      description: project.description,
      interviews: (project.interviews || []).map((interview) =>
        interview._id ? formatInterviewResponse(interview) : interview
      ),
      patterns: project.patterns || null,
      prd: project.prd || null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      error: "Failed to fetch project",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete project and all associated interviews + GridFS files
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const project = await findProjectForUser(req.params.id, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const linkedInterviews = await Interview.find({
      $or: [{ _id: { $in: project.interviews || [] } }, { projectId: project._id }],
    });

    const deletedIds = new Set();
    for (const interview of linkedInterviews) {
      const key = interview._id.toString();
      if (deletedIds.has(key)) {
        continue;
      }
      deletedIds.add(key);
      if (interview.gridfsFileId) {
        await deleteFromGridFS(interview.gridfsFileId);
      }
      await Interview.findByIdAndDelete(interview._id);
    }

    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      message: "Project deleted successfully",
      deletedInterviews: deletedIds.size,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete project",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Save interview and PRD to project
app.post("/api/projects/:id/save", async (req, res) => {
  try {
    const { interviewId, prd } = req.body;
    const projectId = req.params.id;

    const project = await findProjectForUser(projectId, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updates = {};

    if (interviewId) {
      const { allowed, interview } = await getInterviewAccess(interviewId, req.userId);
      if (!allowed || !interview) {
        return res.status(404).json({ error: "Interview not found" });
      }

      interview.projectId = projectId;
      if (!interview.userId) {
        interview.userId = req.userId;
      }
      await interview.save();

      // Add to project's interviews array if not already there
      if (!project.interviews.includes(interviewId)) {
        updates.interviews = [...project.interviews, interviewId];
      }
    }

    // Save PRD if provided
    if (prd) {
      updates.prd = {
        generatedAt: new Date(),
        document: prd,
      };
    }

    // Update project
    if (Object.keys(updates).length > 0) {
      Object.assign(project, updates);
      await project.save();
      console.log("Project updated:", projectId);
    }

    return res.status(200).json({
      message: "Project saved successfully",
      project: {
        id: project._id,
        name: project.name,
        interviewCount: project.interviews.length,
        hasPRD: project.prd?.document !== null,
      },
    });
  } catch (error) {
    console.error("Error saving to project:", error);
    return res.status(500).json({
      error: "Failed to save to project",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update PRD in project
app.put("/api/projects/:id/prd", async (req, res) => {
  try {
    const { prd } = req.body;
    const projectId = req.params.id;

    if (!prd) {
      return res.status(400).json({ error: "PRD document is required" });
    }

    const project = await findProjectForUser(projectId, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    project.prd = {
      generatedAt: project.prd?.generatedAt || new Date(),
      document: prd,
    };

    await project.save();
    console.log("PRD updated in project:", projectId);

    return res.status(200).json({
      message: "PRD updated successfully",
      prd: project.prd,
    });
  } catch (error) {
    console.error("Error updating PRD:", error);
    return res.status(500).json({
      error: "Failed to update PRD",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Chat endpoint for modifying transcript/insights/PRD
app.post("/api/projects/:projectId/chat", async (req, res) => {
  try {
    const { message, interviewId } = req.body;
    const projectId = req.params.projectId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const project = await findProjectForUser(projectId, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    let transcript = null;
    let insights = null;
    let prd = project.prd?.document || null;

    if (interviewId) {
      const { allowed, interview } = await getInterviewAccess(interviewId, req.userId);
      if (allowed && interview) {
        transcript = interview.transcript;
        insights = interview.insights;
      }
    } else if (project.interviews && project.interviews.length > 0) {
      const { allowed, interview } = await getInterviewAccess(project.interviews[0], req.userId);
      if (allowed && interview) {
        transcript = interview.transcript;
        insights = interview.insights;
      }
    }

    // Process chat request
    const chatResult = await processChatRequest(message, {
      transcript,
      insights,
      prd,
    });

    if (!chatResult.success) {
      return res.status(200).json({
        success: false,
        message: chatResult.message,
        rawResponse: chatResult.rawResponse,
      });
    }

    // Return modifications (frontend will apply them)
    return res.status(200).json({
      success: true,
      modifications: chatResult.modifications,
      message: chatResult.message,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    return respondWithAgentError(res, error, "Failed to process chat request");
  }
});

// Chat endpoint for editing transcript and insights (simpler version for ChatEditor)
app.post("/api/chat/edit", async (req, res) => {
  try {
    const { message, transcript, insights, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    let prompt = "";
    if (context === "transcript") {
      prompt = `You are an AI assistant helping to edit a user interview transcript.

Current transcript:
${transcript || ""}

User request: ${message}

Please:
1. Understand what the user wants to change
2. Apply the changes to the transcript
3. Return ONLY the updated transcript (no explanations, just the transcript text)

If the user wants to remove something, remove it. If they want to fix grammar, fix it. If they want to rephrase, rephrase it.

Return the updated transcript:`;
    } else if (context === "insights") {
      prompt = `You are an AI assistant helping to edit user interview insights.

Current insights (JSON format):
${JSON.stringify(insights || [], null, 2)}

User request: ${message}

Please:
1. Understand what the user wants to change
2. Apply the changes to the insights array
3. Return ONLY a valid JSON array of insights (no explanations, just the JSON)

Examples of requests:
- "Remove duplicate insights" - remove duplicates
- "Remove insight about X" - remove that specific insight
- "Change category of insight 1 to pain" - update the category
- "Summarize similar insights" - consolidate similar ones

Return the updated insights as JSON array:`;
    } else {
      return res.status(400).json({ error: "Invalid context. Use 'transcript' or 'insights'" });
    }

    const { result } = await generateContentWithFallback(CHAT_MODELS, prompt, {
      maxRetries: 2,
      baseDelayMs: 3000,
      feature: "Chat editing",
    });
    const response = await result.response;
    const text = response.text().trim();

    // Parse response
    let changes = {};
    let aiResponse = "";

    if (context === "transcript") {
      // For transcript, the response should be the updated transcript
      changes.transcript = text;
      aiResponse = `I've updated the transcript as requested.`;
    } else if (context === "insights") {
      // For insights, try to parse JSON
      try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedInsights = JSON.parse(jsonMatch[0]);
          changes.insights = parsedInsights;
          aiResponse = `I've updated the insights as requested. Found ${parsedInsights.length} insights.`;
        } else {
          throw new Error("No JSON array found");
        }
      } catch (parseError) {
        // If parsing fails, return original insights
        changes.insights = insights;
        aiResponse = `I understood your request, but couldn't parse the response. Please try again with a more specific request.`;
      }
    }

    return res.status(200).json({
      response: aiResponse,
      changes: changes,
    });
  } catch (error) {
    console.error("Error processing chat edit:", error);
    return respondWithAgentError(res, error, "Failed to process edit request");
  }
});

// Update interview transcript/insights
app.put("/api/interviews/:id", async (req, res) => {
  try {
    const { transcript, insights, speakers, overallSentiment } = req.body;
    const interviewId = req.params.id;

    const { allowed, interview } = await getInterviewAccess(interviewId, req.userId);
    if (!allowed || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const transcriptChanged =
      transcript !== undefined && transcript !== interview.transcript;

    if (transcript !== undefined) {
      interview.transcript = transcript;
    }
    if (insights !== undefined && Array.isArray(insights)) {
      interview.insights = insights.map((insight, index) => ({
        ...insight,
        id: insight.id || index + 1,
      }));
    }
    if (speakers !== undefined) {
      interview.speakers = speakers;
    }
    if (overallSentiment !== undefined) {
      interview.overallSentiment = overallSentiment;
    }

    if (transcriptChanged && interview.sourceType === "text") {
      await refreshTextInterviewPdf(interview);
    }

    await interview.save();

    return res.status(200).json({
      message: "Interview updated successfully",
      interview: formatInterviewResponse(interview),
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    return res.status(500).json({
      error: "Failed to update interview",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Helper endpoint to list available models using REST API
app.get("/api/models", async (_req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({ error: "GEMINI_API_KEY not set" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "Failed to fetch models",
        details: errorText,
      });
    }

    const data = await response.json();
    const models = data.models || [];
    const modelNames = models.map((m) => m.name);
    const displayNames = models.map((m) => ({
      name: m.name,
      displayName: m.displayName,
      supportedMethods: m.supportedGenerationMethods || [],
    }));

    return res.status(200).json({
      models: modelNames,
      details: displayNames,
      message: "Use the 'name' field (without 'models/' prefix) in your code",
      example: "If name is 'models/gemini-pro', use 'gemini-pro' in getGenerativeModel()",
    });
  } catch (error) {
    console.error("Error listing models:", error);
    return res.status(500).json({
      error: "Failed to list models",
      details: error.message,
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
