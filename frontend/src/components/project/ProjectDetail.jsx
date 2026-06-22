import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import ChatEditor from "./ChatEditor";
import PRDGenerator from "../prd/PRDGenerator";
import InterviewMediaViewer from "./InterviewMediaViewer";
import { useConfirm } from "../common/ConfirmProvider";
import { showToast } from "../../utils/toast";

function ProjectDetail({ projectId, onBack, onCreateNew }) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("interviews"); // interviews → patterns → prd
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [editedInsights, setEditedInsights] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingInsights, setIsExtractingInsights] = useState(false);
  const [uploadMode, setUploadMode] = useState("audio"); // "audio" | "text"
  const [textTranscript, setTextTranscript] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const confirm = useConfirm();

  const getInterviewId = (interview) => interview?.id || interview?._id;

  const selectInterview = (interview) => {
    if (!interview) return;
    setSelectedInterview(interview);
    setEditedTranscript(interview.transcript || "");
    setEditedInsights(interview.insights || []);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      setIsLoading(false);
      setProject(null);
    }
  }, [projectId]);

  const loadProject = async (selectInterviewId = null) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(`/api/projects/${projectId}`);
      setProject(response.data);

      const interviews = response.data.interviews || [];
      if (interviews.length > 0) {
        let interview = interviews[0];
        if (selectInterviewId) {
          const found = interviews.find(
            (i) => String(getInterviewId(i)) === String(selectInterviewId)
          );
          if (found) interview = found;
        }
        selectInterview(interview);
      } else {
        setSelectedInterview(null);
        setEditedTranscript("");
        setEditedInsights([]);
      }
    } catch (err) {
      console.error("Error loading project:", err);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!hasUnsavedChanges) {
      showToast.info("No changes to save");
      return;
    }

    const toastId = showToast.loading("Saving changes...");

    try {
      if (selectedInterview && (editedTranscript !== selectedInterview.transcript || JSON.stringify(editedInsights) !== JSON.stringify(selectedInterview.insights))) {
        await api.put(`/api/interviews/${selectedInterview.id || selectedInterview._id}`, {
          transcript: editedTranscript,
          insights: editedInsights,
        });
      }

      setHasUnsavedChanges(false);
      showToast.dismiss(toastId);
      showToast.success("Changes saved successfully");
      loadProject(getInterviewId(selectedInterview));
    } catch (err) {
      console.error("Error saving project:", err);
      showToast.dismiss(toastId);
      showToast.error("Failed to save changes. Please try again.");
    }
  };

  const handleChatEdit = (type, changes) => {
    if (type === "transcript") {
      setEditedTranscript(changes);
      setHasUnsavedChanges(true);
    } else if (type === "insights") {
      setEditedInsights(changes);
      setHasUnsavedChanges(true);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !projectId) {
      showToast.error("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const toastId = showToast.loading("Processing interview...");

    try {
      const response = await api.post("/api/process", formData, {
        timeout: 120000,
      });

      await api.post(`/api/projects/${projectId}/save`, {
        interviewId: response.data.id,
      });

      await loadProject(response.data.id);
      setFile(null);
      showToast.dismiss(toastId);
      const insightCount = response.data.insights?.length || 0;
      if (insightCount === 0) {
        showToast.error("Transcript saved but insights failed (API quota). Click Extract Insights to retry.");
      } else {
        showToast.success("Interview processed and saved");
      }
    } catch (err) {
      console.error("Error uploading interview:", err);
      showToast.dismiss(toastId);
      const message =
        err.response?.data?.error ||
        (err.code === "ECONNABORTED"
          ? "Upload timed out. Try a shorter audio file or paste the transcript as text."
          : err.message === "Network Error"
            ? "Network error — file may be too large for Vercel (max ~4MB) or the server timed out."
            : "Failed to upload interview");
      showToast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async (e) => {
    e.preventDefault();
    if (!textTranscript.trim() || !projectId) {
      showToast.error("Please paste a transcript first");
      return;
    }

    setIsUploading(true);
    const toastId = showToast.loading("Processing transcript...");

    try {
      const response = await api.post("/api/process-text", {
        transcript: textTranscript.trim(),
        title: textTitle.trim() || undefined,
        projectId,
      });

      if (!response.data.linkedToProject && response.data.id) {
        await api.post(`/api/projects/${projectId}/save`, {
          interviewId: response.data.id,
        });
      }

      await loadProject(response.data.id);
      setTextTranscript("");
      setTextTitle("");
      showToast.dismiss(toastId);
      showToast.success("Transcript processed and saved as PDF");
    } catch (err) {
      console.error("Error processing transcript:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to process transcript");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzePatterns = async () => {
    const interviews = project?.interviews || [];
    if (interviews.length < 2) {
      showToast.info("Add at least 2 interviews to analyze patterns");
      return;
    }

    const interviewIds = interviews.map(getInterviewId).filter(Boolean);
    setIsAnalyzingPatterns(true);
    const toastId = showToast.loading("Analyzing patterns across interviews...");

    try {
      await api.post("/api/analyze-patterns", {
        interviewIds,
        projectId,
      });
      await loadProject(getInterviewId(selectedInterview));
      setActiveTab("patterns");
      showToast.dismiss(toastId);
      showToast.success("Patterns analyzed successfully");
    } catch (err) {
      console.error("Error analyzing patterns:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to analyze patterns");
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  const handleExtractInsights = async () => {
    const id = getInterviewId(selectedInterview);
    if (!id || !editedTranscript.trim()) {
      showToast.error("No transcript available to analyze");
      return;
    }

    setIsExtractingInsights(true);
    const toastId = showToast.loading("Extracting insights...");

    try {
      const response = await api.post(`/api/interviews/${id}/extract-insights`);
      await loadProject(id);
      showToast.dismiss(toastId);
      showToast.success(`Extracted ${response.data.insightsCount} insights`);
    } catch (err) {
      console.error("Error extracting insights:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to extract insights");
    } finally {
      setIsExtractingInsights(false);
    }
  };

  const handleDeleteInterview = async () => {
    const id = getInterviewId(selectedInterview);
    if (!id) return;

    const name = selectedInterview.filename || selectedInterview.originalName || "this interview";
    const confirmed = await confirm({
      title: "Delete interview?",
      message: `This will permanently delete "${name}" and its stored file (audio, video, or PDF). This cannot be undone.`,
      confirmLabel: "Delete Interview",
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    const toastId = showToast.loading("Deleting interview...");

    try {
      await api.delete(`/api/interviews/${id}`);
      setSelectedInterview(null);
      setEditedTranscript("");
      setEditedInsights([]);
      await loadProject();
      showToast.dismiss(toastId);
      showToast.success("Interview deleted");
    } catch (err) {
      console.error("Error deleting interview:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to delete interview");
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    const count = project.interviews?.length || 0;
    const confirmed = await confirm({
      title: "Delete project?",
      message: `This will permanently delete "${project.name}"${
        count > 0 ? ` and all ${count} interview${count === 1 ? "" : "s"} with stored files` : ""
      }, including any PRD and patterns. This cannot be undone.`,
      confirmLabel: "Delete Project",
      cancelLabel: "Keep Project",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDeletingProject(true);
    const toastId = showToast.loading("Deleting project...");

    try {
      await api.delete(`/api/projects/${projectId}`);
      showToast.dismiss(toastId);
      showToast.success(`Project "${project.name}" deleted`);
      onBack();
    } catch (err) {
      console.error("Error deleting project:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const interviewCount = project?.interviews?.length || 0;
  const allInterviewIds = (project?.interviews || []).map(getInterviewId).filter(Boolean);
  const hasPatterns = project?.patterns?.patterns?.length > 0;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
        Loading project...
      </div>
    );
  }

  if (!projectId) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#e5e7eb" }}>Create New Project</h1>
          <button
            onClick={onBack}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              backgroundColor: "#030712",
              color: "#e5e7eb",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ backgroundColor: "#020617", borderRadius: "1rem", padding: "2rem", border: "1px solid #1f2937" }}>
          <p style={{ color: "#9ca3af", marginBottom: "1rem" }}>
            Please create a project first to get started.
          </p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Create Project
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#fca5a5" }}>
        {error || "Project not found"}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #1f2937",
        }}
      >
        <div>
          <button
            onClick={onBack}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              backgroundColor: "#030712",
              color: "#e5e7eb",
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: "0.5rem",
            }}
          >
            ← Back to Projects
          </button>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#e5e7eb", margin: 0 }}>
            {project.name}
          </h1>
          {project.description && (
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={handleDeleteProject}
            disabled={isDeletingProject}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid #7f1d1d",
              backgroundColor: "transparent",
              color: "#fca5a5",
              fontSize: "0.875rem",
              cursor: isDeletingProject ? "default" : "pointer",
              fontWeight: 500,
              opacity: isDeletingProject ? 0.6 : 1,
            }}
          >
            {isDeletingProject ? "Deleting..." : "Delete Project"}
          </button>
          <button
            onClick={handleSaveProject}
            disabled={!hasUnsavedChanges}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: hasUnsavedChanges
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "#374151",
              color: "#fff",
              fontSize: "0.9rem",
              cursor: hasUnsavedChanges ? "pointer" : "default",
              fontWeight: 600,
              opacity: hasUnsavedChanges ? 1 : 0.6,
            }}
          >
            {hasUnsavedChanges ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #1f2937",
        }}
      >
        <button
          onClick={() => setActiveTab("interviews")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "interviews" ? "2px solid #3b82f6" : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "interviews" ? "#3b82f6" : "#9ca3af",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: activeTab === "interviews" ? 600 : 400,
          }}
        >
          1. Interviews ({project.interviews?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("patterns")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "patterns" ? "2px solid #3b82f6" : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "patterns" ? "#3b82f6" : "#9ca3af",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: activeTab === "patterns" ? 600 : 400,
          }}
        >
          2. Patterns {hasPatterns ? "✓" : ""}
        </button>
        <button
          onClick={() => setActiveTab("prd")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "prd" ? "2px solid #3b82f6" : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "prd" ? "#3b82f6" : "#9ca3af",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: activeTab === "prd" ? 600 : 400,
          }}
        >
          3. PRD {project.prd?.document ? "✓" : ""}
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.8rem", marginBottom: "1.25rem", marginTop: "-0.75rem" }}>
        Add all interviews first → analyze patterns across them → generate one PRD for the whole project.
      </p>

      {/* Tab Content */}
      {activeTab === "interviews" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Interview List */}
          <div
            style={{
              backgroundColor: "#020617",
              borderRadius: "1rem",
              padding: "1.5rem",
              border: "1px solid #1f2937",
              maxHeight: "600px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#e5e7eb" }}>
                Interviews
              </h3>
            </div>

            {/* Upload toggle + form */}
            <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#030712", borderRadius: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setUploadMode("audio")}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #374151",
                    backgroundColor: uploadMode === "audio" ? "#1e3a8a" : "#0f172a",
                    color: uploadMode === "audio" ? "#93c5fd" : "#9ca3af",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: uploadMode === "audio" ? 600 : 400,
                  }}
                >
                  Upload Audio/Video
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("text")}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #374151",
                    backgroundColor: uploadMode === "text" ? "#1e3a8a" : "#0f172a",
                    color: uploadMode === "text" ? "#93c5fd" : "#9ca3af",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: uploadMode === "text" ? 600 : 400,
                  }}
                >
                  Paste Transcript
                </button>
              </div>

              {uploadMode === "audio" ? (
                <form onSubmit={handleFileUpload}>
                  <label
                    htmlFor="interviewFile"
                    style={{
                      display: "block",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      border: "1px dashed #4b5563",
                      cursor: "pointer",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      color: "#9ca3af",
                    }}
                  >
                    <input
                      id="interviewFile"
                      type="file"
                      accept="audio/*,video/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                    {file ? file.name : "+ Upload Interview"}
                  </label>
                  {file && (
                    <button
                      type="submit"
                      disabled={isUploading}
                      style={{
                        marginTop: "0.5rem",
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: isUploading ? "#374151" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                        color: "#fff",
                        fontSize: "0.875rem",
                        cursor: isUploading ? "default" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {isUploading ? "Processing..." : "Process Interview"}
                    </button>
                  )}
                </form>
              ) : (
                <form onSubmit={handleTextUpload}>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Interview title (optional)"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #374151",
                      backgroundColor: "#0f172a",
                      color: "#e5e7eb",
                      fontSize: "0.875rem",
                    }}
                  />
                  <textarea
                    value={textTranscript}
                    onChange={(e) => setTextTranscript(e.target.value)}
                    placeholder="Paste your interview transcript here..."
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #374151",
                      backgroundColor: "#0f172a",
                      color: "#e5e7eb",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isUploading || !textTranscript.trim()}
                    style={{
                      marginTop: "0.5rem",
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      background: isUploading || !textTranscript.trim() ? "#374151" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                      color: "#fff",
                      fontSize: "0.875rem",
                      cursor: isUploading || !textTranscript.trim() ? "default" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {isUploading ? "Processing..." : "Process Transcript"}
                  </button>
                </form>
              )}
            </div>
            {project.interviews && project.interviews.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {project.interviews.map((interview, index) => (
                  <div
                    key={interview.id || interview._id || index}
                    onClick={() => selectInterview(interview)}
                    style={{
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      backgroundColor:
                        String(getInterviewId(selectedInterview)) === String(getInterviewId(interview))
                          ? "#0f172a"
                          : "#030712",
                      border:
                        String(getInterviewId(selectedInterview)) === String(getInterviewId(interview))
                          ? "1px solid #3b82f6"
                          : "1px solid #1f2937",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: "0.5rem" }}>
                      {interview.filename || interview.originalName || `Interview ${index + 1}`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      {interview.insights?.length || 0} insights •{" "}
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No interviews yet</p>
            )}
          </div>

          {/* Interview Detail with Chat */}
          {selectedInterview && (
            <div
              style={{
                backgroundColor: "#020617",
                borderRadius: "1rem",
                padding: "1.5rem",
                border: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <InterviewMediaViewer interview={selectedInterview} />
              {(editedInsights.length === 0 || selectedInterview?.insights?.length === 0) && editedTranscript.trim() && (
                <div
                  style={{
                    padding: "0.875rem 1rem",
                    backgroundColor: "#422006",
                    border: "1px solid #92400e",
                    borderRadius: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <p style={{ color: "#fcd34d", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    No insights yet. This usually means Gemini API quota failed during upload — transcript is still saved.
                  </p>
                  <button
                    type="button"
                    onClick={handleExtractInsights}
                    disabled={isExtractingInsights}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      background: isExtractingInsights ? "#374151" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: isExtractingInsights ? "default" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isExtractingInsights ? "Extracting..." : "Extract Insights"}
                  </button>
                </div>
              )}
              <ChatEditor
                transcript={editedTranscript}
                insights={editedInsights}
                onTranscriptChange={(newTranscript) => handleChatEdit("transcript", newTranscript)}
                onInsightsChange={(newInsights) => handleChatEdit("insights", newInsights)}
              />
              <button
                type="button"
                onClick={handleDeleteInterview}
                style={{
                  alignSelf: "flex-start",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #7f1d1d",
                  backgroundColor: "transparent",
                  color: "#fca5a5",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Delete Interview
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "patterns" && (
        <div
          style={{
            backgroundColor: "#020617",
            borderRadius: "1rem",
            padding: "1.5rem",
            border: "1px solid #1f2937",
          }}
        >
          {interviewCount < 2 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#e5e7eb", marginBottom: "0.75rem" }}>
                2. Patterns & Trends
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto" }}>
                Add at least <strong style={{ color: "#d1d5db" }}>2 interviews</strong> in step 1, then come back here to find themes that repeat across users.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("interviews")}
                style={{
                  marginTop: "1.25rem",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#0f172a",
                  color: "#93c5fd",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Go to Interviews
              </button>
            </div>
          ) : (
            <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#e5e7eb", margin: 0 }}>
              2. Patterns & Trends
            </h3>
            <button
              onClick={handleAnalyzePatterns}
              disabled={isAnalyzingPatterns}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: isAnalyzingPatterns ? "#374151" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                fontSize: "0.875rem",
                cursor: isAnalyzingPatterns ? "default" : "pointer",
                fontWeight: 600,
              }}
            >
              {isAnalyzingPatterns ? "Analyzing..." : hasPatterns ? "Re-analyze Patterns" : "Analyze Patterns"}
            </button>
          </div>

          {project.patterns?.summary && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#030712", borderRadius: "0.5rem", border: "1px solid #1f2937" }}>
              {project.patterns.summary.topThemes?.length > 0 && (
                <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#93c5fd" }}>Top themes:</strong> {project.patterns.summary.topThemes.join(", ")}
                </p>
              )}
              {project.patterns.summary.criticalIssues?.length > 0 && (
                <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#fca5a5" }}>Critical issues:</strong> {project.patterns.summary.criticalIssues.join(", ")}
                </p>
              )}
              {project.patterns.summary.emergingTrends?.length > 0 && (
                <p style={{ color: "#d1d5db", fontSize: "0.875rem", margin: 0 }}>
                  <strong style={{ color: "#86efac" }}>Emerging trends:</strong> {project.patterns.summary.emergingTrends.join(", ")}
                </p>
              )}
            </div>
          )}

          {hasPatterns ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {project.patterns.patterns.map((pattern, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#030712",
                    borderRadius: "0.5rem",
                    border: "1px solid #1f2937",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                    <h4 style={{ color: "#e5e7eb", fontWeight: 600 }}>{pattern.name}</h4>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "#1e3a8a",
                        color: "#93c5fd",
                      }}
                    >
                      {pattern.frequencyPercentage}%
                    </span>
                  </div>
                  <p style={{ color: "#d1d5db", fontSize: "0.9rem" }}>{pattern.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#9ca3af" }}>
              No patterns identified yet. Click &quot;Analyze Patterns&quot; to find themes across your {interviewCount} interviews.
            </p>
          )}
            </>
          )}
        </div>
      )}

      {activeTab === "prd" && (
        <div>
          <PRDGenerator
            insights={editedInsights.length > 0 ? editedInsights : (selectedInterview?.insights || [])}
            interviewId={getInterviewId(selectedInterview)}
            interviewIds={allInterviewIds}
            projectId={projectId}
            interviewCount={interviewCount}
            onSave={() => {
              loadProject(getInterviewId(selectedInterview));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
