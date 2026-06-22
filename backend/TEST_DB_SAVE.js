// Quick test script to verify database saving works
import mongoose from "mongoose";
import dotenv from "dotenv";
import Interview from "./src/models/Interview.js";
import { connectDB } from "./src/utils/db.js";

dotenv.config();

async function testSave() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected!");

    console.log("Creating test interview...");
    const testInterview = new Interview({
      filename: "test_interview.mp3",
      originalName: "test_interview.mp3",
      mimeType: "audio/mpeg",
      fileSize: 1000000,
      transcript: "This is a test transcript",
      insights: [
        {
          id: 1,
          type: "pain_point",
          summary: "Test pain point",
          category: "pain",
          quote: "Test quote",
          sentiment: -0.5,
          context: "Test context",
          priority: "high",
        },
      ],
      speakers: [
        { id: 1, name: "Interviewer", label: "Interviewer" },
        { id: 2, name: "Interviewee", label: "Interviewee" },
      ],
      overallSentiment: {
        score: 0.2,
        label: "neutral",
        summary: "Test sentiment",
      },
      metadata: {
        processedAt: new Date(),
        duration: 300,
      },
    });

    console.log("Saving test interview...");
    const saved = await testInterview.save();
    console.log("✅ Interview saved successfully!");
    console.log("ID:", saved._id);
    console.log("Created at:", saved.createdAt);

    // Verify it was saved
    const found = await Interview.findById(saved._id);
    if (found) {
      console.log("✅ Verified: Interview found in database!");
      console.log("Transcript:", found.transcript);
      console.log("Insights count:", found.insights.length);
    } else {
      console.log("❌ Error: Interview not found after save!");
    }

    // Clean up - delete test interview
    await Interview.findByIdAndDelete(saved._id);
    console.log("✅ Test interview deleted");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      errors: error.errors,
    });
    process.exit(1);
  }
}

testSave();
