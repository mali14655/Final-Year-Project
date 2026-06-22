import mongoose from "mongoose";

const insightSchema = new mongoose.Schema({
  id: { type: Number, required: false }, // Made optional with default
  type: { type: String, enum: ["pain_point", "feature_request", "quote", "sentiment"], default: "pain_point" },
  summary: { type: String, required: true },
  category: { type: String, enum: ["pain", "need", "opportunity", "feature", "quote", "sentiment"], default: "pain" },
  quote: { type: String, default: "" },
  sentiment: { type: Number, default: 0, min: -1, max: 1 },
  context: { type: String, default: "" },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
}, { _id: false });

const speakerSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  label: { type: String, default: "" },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  transcript: { type: String, required: true },
  insights: [insightSchema],
  speakers: [speakerSchema],
  overallSentiment: {
    score: { type: Number, default: 0, min: -1, max: 1 },
    label: { type: String, default: "neutral" },
    summary: { type: String, default: "" },
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sourceType: { type: String, enum: ["audio", "video", "text"], default: "text" },
  gridfsFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  storedContentType: { type: String, default: null },
  metadata: {
    processedAt: { type: Date, default: Date.now },
    duration: { type: Number, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
interviewSchema.index({ projectId: 1 });
interviewSchema.index({ userId: 1 });
interviewSchema.index({ createdAt: -1 });
interviewSchema.index({ "insights.category": 1 });

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
