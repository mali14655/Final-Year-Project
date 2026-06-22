import mongoose from "mongoose";

const patternItemSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, default: "" },
    type: { type: String, default: "theme" },
    description: { type: String, default: "" },
    frequency: { type: Number, default: 1 },
    frequencyPercentage: { type: Number, default: 0 },
    severity: { type: String, default: "medium" },
    affectedInterviews: [{ type: String }],
    supportingQuotes: [{ type: String }],
    userSegments: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { _id: false }
);

const patternsBlockSchema = new mongoose.Schema(
  {
    identifiedAt: { type: Date, default: null },
    patterns: { type: [patternItemSchema], default: [] },
    summary: {
      totalInterviews: { type: Number, default: 0 },
      topThemes: [{ type: String }],
      criticalIssues: [{ type: String }],
      emergingTrends: [{ type: String }],
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    interviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Interview" }],
    patterns: {
      type: patternsBlockSchema,
      default: () => ({ patterns: [], summary: {} }),
    },
    prd: {
      generatedAt: { type: Date, default: null },
      document: {
        title: String,
        version: String,
        date: String,
        executiveSummary: String,
        problemStatement: {
          problem: String,
          impact: String,
          currentState: String,
          desiredState: String,
        },
        userPersonas: [
          {
            name: String,
            basedOnInterview: String,
            description: String,
            needs: [String],
            painPoints: [String],
          },
        ],
        goals: [
          {
            goal: String,
            metric: String,
            target: String,
          },
        ],
        features: [
          {
            id: Number,
            name: String,
            description: String,
            priority: String,
            userStories: [
              {
                story: String,
                acceptanceCriteria: [String],
              },
            ],
            dependencies: [String],
            risks: [String],
          },
        ],
        timeline: {
          phases: [
            {
              phase: String,
              duration: String,
              features: [Number],
              milestones: [String],
            },
          ],
        },
        successMetrics: {
          primary: [String],
          secondary: [String],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
