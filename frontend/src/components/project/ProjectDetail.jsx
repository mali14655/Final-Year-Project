import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import ChatEditor from "./ChatEditor";
import InsightsPanel from "./InsightsPanel";
import PatternsPanel from "./PatternsPanel";
import InterviewList from "./InterviewList";
import PRDGenerator from "../prd/PRDGenerator";
import InterviewMediaViewer from "./InterviewMediaViewer";
import InterviewUpload from "./InterviewUpload";
import { useConfirm } from "../common/ConfirmProvider";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errors";
import LoadingSpinner from "../common/LoadingSpinner";
import { StepEyebrow, WorkflowTip, TAB_HINTS } from "../../hooks/usePreferences";
import WorkflowGuide from "../common/WorkflowGuide";

function ProjectDetail({ projectId, onBack, onCreateNew, onOpenHowItWorks }) {
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
      const message = getErrorMessage(err, "Failed to load project");
      setError(message);
      showToast.apiError(err, message);
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
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to save changes. Please try again.");
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
        showToast.warning(
          "Interview saved, but AI could not extract insights — likely due to API limits. Click Extract Insights to retry."
        );
      } else {
        showToast.success("Interview processed and saved");
      }
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to upload interview");
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
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to process transcript");
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
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to analyze patterns across interviews");
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
      setActiveTab("insights");
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to extract insights from this interview");
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
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to delete interview");
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
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const interviewCount = project?.interviews?.length || 0;
  const allInterviewIds = (project?.interviews || []).map(getInterviewId).filter(Boolean);
  const hasPatterns = project?.patterns?.patterns?.length > 0;
  const hasPrd = Boolean(project?.prd?.document);
  const totalInsightsCount = (project?.interviews || []).reduce(
    (sum, interview) => sum + (interview.insights?.length || 0),
    0
  );
  const hasInsights = totalInsightsCount > 0;
  const selectedInsightCount = selectedInterview?.insights?.length || editedInsights.length || 0;

  if (isLoading) {
    return (
      <>
        <LoadingSpinner variant="overlay" />
        <div className="page-boot-placeholder" aria-hidden="true" />
      </>
    );
  }

  if (!projectId) {
    return (
      <div>
        <div className="detail-header">
          <div>
            <p className="eyebrow">New project</p>
            <h1 className="detail-title">Create a project</h1>
          </div>
          <button type="button" onClick={onBack} className="btn btn-secondary">
            Back
          </button>
        </div>
        <div className="surface-card">
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
            Create a project to start uploading interviews and generating insights.
          </p>
          {onCreateNew && (
            <button type="button" onClick={onCreateNew} className="btn btn-primary btn-lg">
              Create project
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#dc2626" }}>
        {error || "Project not found"}
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-main">
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm detail-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to projects
          </button>
          <p className="eyebrow">Project</p>
          <h1 className="detail-title">{project.name}</h1>
          {project.description && (
            <p className="detail-description">{project.description}</p>
          )}
          {hasUnsavedChanges && (
            <WorkflowTip variant="inline" title="Unsaved changes" className="detail-save-hint">
              You edited the transcript or insights. Click &quot;Save changes&quot; to keep your updates in this project.
            </WorkflowTip>
          )}
        </div>
        <div className="detail-actions">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSaveProject}
              className="btn btn-primary btn-sm"
            >
              Save changes
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteProject}
            disabled={isDeletingProject}
            className="btn btn-danger-ghost btn-sm"
          >
            {isDeletingProject ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <WorkflowGuide
        activeStep={activeTab}
        interviewCount={interviewCount}
        hasInsights={hasInsights}
        hasPatterns={hasPatterns}
        hasPrd={hasPrd}
        onStepClick={setActiveTab}
        onOpenGuide={onOpenHowItWorks}
      />

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          onClick={() => setActiveTab("interviews")}
          className={`tab ${activeTab === "interviews" ? "tab-active" : ""}`}
        >
          Interviews
          <span className="tab-badge">{project.interviews?.length || 0}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("insights")}
          className={`tab ${activeTab === "insights" ? "tab-active" : ""}`}
        >
          Insights
          <span className={`tab-badge ${hasInsights ? "tab-badge-active" : ""}`}>
            {totalInsightsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("patterns")}
          className={`tab ${activeTab === "patterns" ? "tab-active" : ""}`}
        >
          Patterns
          <span className={`tab-status ${hasPatterns ? "is-complete" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prd")}
          className={`tab ${activeTab === "prd" ? "tab-active" : ""}`}
        >
          PRD
          <span className={`tab-status ${project.prd?.document ? "is-complete" : ""}`} />
        </button>
      </div>

      <WorkflowTip variant="prominent" className="tab-context-hint">
        {TAB_HINTS[activeTab]}
      </WorkflowTip>

      {/* Tab Content */}
      {activeTab === "interviews" && (
        <div className="two-col">
          {/* Interview List */}
          <div className="surface-card interviews-sidebar">
            <div className="interviews-sidebar-header">
              <StepEyebrow step={1} />
              <h3 className="heading-md">Interviews</h3>
              <p className="interviews-sidebar-desc">
                Upload audio or video, or paste a transcript. Each interview is saved separately.
              </p>
            </div>

            <InterviewUpload
              uploadMode={uploadMode}
              onUploadModeChange={setUploadMode}
              file={file}
              onFileChange={setFile}
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              textTitle={textTitle}
              onTextTitleChange={setTextTitle}
              textTranscript={textTranscript}
              onTextTranscriptChange={setTextTranscript}
              onTextUpload={handleTextUpload}
            />

            {project.interviews && project.interviews.length > 0 ? (
              <InterviewList
                interviews={project.interviews}
                selectedInterview={selectedInterview}
                onSelect={selectInterview}
                getInterviewId={getInterviewId}
              />
            ) : (
              <p className="interviews-empty-copy">No interviews yet. Upload your first one above.</p>
            )}
          </div>

          {selectedInterview ? (
            <div className="surface-card interview-detail-panel">
              <InterviewMediaViewer interview={selectedInterview} />
              <ChatEditor
                transcript={editedTranscript}
                onTranscriptChange={(newTranscript) => handleChatEdit("transcript", newTranscript)}
              />
              {selectedInsightCount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setActiveTab("insights")}
                >
                  View {selectedInsightCount} insight{selectedInsightCount === 1 ? "" : "s"}
                </button>
              )}
              <button type="button" onClick={handleDeleteInterview} className="btn btn-danger-ghost interview-delete-btn">
                Delete interview
              </button>
            </div>
          ) : (
            interviewCount > 0 && (
              <div className="surface-card interview-detail-empty">
                <p className="heading-md" style={{ margin: "0 0 0.35rem" }}>Select an interview</p>
                <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  Choose an interview from the list to play media and review the transcript.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="two-col">
          <div className="surface-card interviews-sidebar">
            <div className="interviews-sidebar-header">
              <StepEyebrow step={2} label="Step 2" />
              <h3 className="heading-md">By interview</h3>
              <p className="interviews-sidebar-desc">
                Each interview has its own insight set. Select one to review pains, needs, and opportunities.
              </p>
            </div>
            {project.interviews?.length > 0 ? (
              <InterviewList
                interviews={project.interviews}
                selectedInterview={selectedInterview}
                onSelect={selectInterview}
                getInterviewId={getInterviewId}
              />
            ) : (
              <p className="interviews-empty-copy">
                Upload interviews first, then return here to extract and review insights.
              </p>
            )}
          </div>

          <InsightsPanel
            interview={selectedInterview}
            insights={editedInsights}
            onInsightsChange={(newInsights) => handleChatEdit("insights", newInsights)}
            onExtractInsights={handleExtractInsights}
            isExtracting={isExtractingInsights}
          />
        </div>
      )}

      {activeTab === "patterns" && (
        <PatternsPanel
          interviewCount={interviewCount}
          patterns={project.patterns}
          hasPatterns={hasPatterns}
          isAnalyzing={isAnalyzingPatterns}
          onAnalyze={handleAnalyzePatterns}
          onGoToInterviews={() => setActiveTab("interviews")}
        />
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

      {(isUploading || isExtractingInsights || isAnalyzingPatterns) && (
        <LoadingSpinner variant="overlay" />
      )}
    </div>
  );
}

export default ProjectDetail;
