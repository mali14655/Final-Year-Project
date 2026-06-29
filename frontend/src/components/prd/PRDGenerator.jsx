import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import EditablePRD from "./EditablePRD";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errors";
import { downloadPrdMarkdown, openPrdPrintWindow } from "../../utils/prdExport";
import { StepEyebrow, WorkflowHintList } from "../../hooks/usePreferences";
import LoadingSpinner from "../common/LoadingSpinner";

// Treat a PRD with no real content as "empty" so we show the Generate screen
const isPrdEmpty = (prd) => {
  if (!prd) return true;

  const hasExecutiveSummary =
    typeof prd.executiveSummary === "string" && prd.executiveSummary.trim().length > 0;

  const ps = prd.problemStatement || {};
  const hasProblemStatement =
    (typeof ps.problem === "string" && ps.problem.trim().length > 0) ||
    (typeof ps.impact === "string" && ps.impact.trim().length > 0) ||
    (typeof ps.currentState === "string" && ps.currentState.trim().length > 0) ||
    (typeof ps.desiredState === "string" && ps.desiredState.trim().length > 0);

  const hasUserPersonas =
    Array.isArray(prd.userPersonas) &&
    prd.userPersonas.some(
      (persona) =>
        (typeof persona.name === "string" && persona.name.trim().length > 0) ||
        (typeof persona.description === "string" && persona.description.trim().length > 0)
    );

  const hasGoals = Array.isArray(prd.goals) && prd.goals.length > 0;
  const hasFeatures = Array.isArray(prd.features) && prd.features.length > 0;

  return !(hasExecutiveSummary || hasProblemStatement || hasUserPersonas || hasGoals || hasFeatures);
};

function PRDGenerator({ insights, interviewId, interviewIds, projectId, interviewCount = 0, onSave }) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prd, setPrd] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      const project = response.data;
      setProjectData(project);
      setProjectName(project.name || "");
      setProjectDescription(project.description || "");

      // If project already has a non-empty PRD, load it. Otherwise, show Generate screen.
      if (project.prd && project.prd.document && !isPrdEmpty(project.prd.document)) {
        setPrd(project.prd.document);
      } else {
        setPrd(null);
      }
    } catch (error) {
      showToast.apiError(error, "Failed to load project for PRD");
    }
  };

  const handleGenerate = async () => {
    if (!projectId && !projectName.trim()) {
      setError("Please create or select a project first");
      return;
    }

    // If projectId exists but no projectName, use project name from loaded data
    const nameToUse = projectId && projectData ? projectData.name : projectName.trim();
    if (!nameToUse) {
      setError("Project name is required");
      return;
    }

    setIsGenerating(true);
    setError("");
    setPrd(null);
    const toastId = showToast.loading("Generating PRD...");

    try {
      const descToUse = projectId && projectData ? projectData.description : projectDescription.trim();
      
      const requestBody = {
        projectContext: {
          name: nameToUse,
          description: descToUse || "Generated from user interview",
        },
      };

      if (projectId) {
        requestBody.projectId = projectId;
      }

      const ids = Array.isArray(interviewIds)
        ? interviewIds.filter(Boolean)
        : interviewId
          ? [interviewId]
          : [];

      if (ids.length >= 2) {
        requestBody.interviewIds = ids;
      } else if (ids.length === 1) {
        requestBody.interviewId = ids[0];
      } else if (insights && Array.isArray(insights) && insights.length > 0) {
        requestBody.insights = insights;
      } else {
        throw new Error("No insights or interview IDs available");
      }

      const response = await api.post("/api/generate-prd", requestBody);

      setPrd(response.data.prd);

      if (projectId && response.data.prd) {
        await loadProject();
      }

      if (onSave) {
        onSave(response.data.prd);
      }

      showToast.dismiss(toastId);
      showToast.success("PRD generated successfully");
    } catch (err) {
      showToast.dismiss(toastId);
      const message = getErrorMessage(err, "Failed to generate PRD. Add more insights and try again.");
      setError(message);
      showToast.apiError(err, message);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasPatterns = projectData?.patterns?.patterns?.length > 0;

  return (
    <>
      {isGenerating && <LoadingSpinner variant="overlay" />}
      <div className="surface-card prd-generator-panel">
      <div className="panel-header-row">
        <div className="panel-header-copy">
          <StepEyebrow step={4} label="Step 4" />
          <h2 className="heading-md">Product requirements</h2>
          <p className="panel-header-desc">
            {interviewCount >= 2
              ? `Generate a PRD from ${interviewCount} interviews${hasPatterns ? " and saved patterns" : ""}. Edit sections inline and export when ready.`
              : interviewCount === 1
                ? "A PRD can be generated from 1 interview. Add more interviews and run Patterns for stronger requirements."
                : "Add interviews first. The PRD is built from your research data and any patterns you identify."}
          </p>
        </div>
      </div>

      <div className="prd-readiness-stats">
        <span className="prd-stat-chip">
          {interviewCount} interview{interviewCount === 1 ? "" : "s"}
        </span>
        <span className={`prd-stat-chip ${hasPatterns ? "is-ready" : ""}`}>
          {hasPatterns ? "Patterns ready" : "No patterns yet"}
        </span>
      </div>

      {!prd ? (
        <div className="prd-generate-form">
          <WorkflowHintList
            title="Before you generate"
            items={[
              "Confirm interviews are processed and insights look accurate.",
              "Run Patterns (Step 3) when you have 2+ interviews for cross-user themes.",
              "Generation replaces any existing PRD in this project.",
              "After generating, edit sections inline and export as Markdown or PDF.",
            ]}
          />
          {projectId && projectData ? (
            <div className="project-info-card">
              <p className="project-info-label">Project</p>
              <p className="project-info-name">{projectData.name}</p>
              {projectData.description && (
                <p className="project-info-desc">{projectData.description}</p>
              )}
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="projectName" className="form-label">
                Project name *
              </label>
              <input
                id="projectName"
                type="text"
                className="input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="projectDescription" className="form-label">
              Project description (optional)
            </label>
            <textarea
              id="projectDescription"
              className="textarea"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief description of the product…"
              rows={3}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || (!projectId && !projectName.trim())}
            className="btn btn-primary btn-block"
          >
            {isGenerating ? "Generating PRD…" : "Generate PRD"}
          </button>

          {error && <p className="form-error">{error}</p>}
        </div>
      ) : (
        <>
          <WorkflowHintList
            title="Editing your PRD"
            items={[
              "Click any section to edit text inline.",
              "Save changes to store the updated PRD in this project.",
              "Export as Markdown (.md) or open the print view to save as PDF.",
              "Regenerate from the generate screen if you add new interviews or patterns.",
            ]}
          />
          <EditablePRD
          prd={prd}
          projectName={projectName}
          onSave={async (editedPrd) => {
            if (!projectId) {
              showToast.error("Please create or select a project first");
              return;
            }
            setIsSaving(true);
            const toastId = showToast.loading("Saving PRD...");
            try {
              await api.put(`/api/projects/${projectId}/prd`, {
                prd: editedPrd,
              });

              if (interviewId) {
                await api.post(`/api/projects/${projectId}/save`, {
                  interviewId: interviewId,
                  prd: editedPrd,
                });
              }

              if (onSave) {
                onSave(editedPrd);
              }
              showToast.dismiss(toastId);
              showToast.success("PRD saved to project");
            } catch (err) {
              showToast.dismiss(toastId);
              showToast.apiError(err, "Failed to save PRD");
            } finally {
              setIsSaving(false);
            }
          }}
          onExport={(format, currentPrd) => {
            const prdToUse = currentPrd || prd;
            if (format === "markdown") {
              downloadPrdMarkdown(prdToUse, projectName);
            } else if (format === "pdf") {
              openPrdPrintWindow(prdToUse, projectName);
            }
          }}
          onRegenerate={() => setPrd(null)}
        />
        </>
      )}
    </div>
    </>
  );
}

export default PRDGenerator;
