import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import EditablePRD from "./EditablePRD";
import { showToast } from "../../utils/toast";

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

  // Load project data if projectId is provided
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
      console.error("Error loading project:", error);
    }
  };

  // Helper functions for export (full PRD)
  const generateMarkdown = (prd, projectName) => {
    let md = `# ${prd.title || projectName || "Product Requirements Document"}\n\n`;
    md += `**Version:** ${prd.version || "1.0"}\n`;
    md += `**Date:** ${prd.date || new Date().toISOString().split("T")[0]}\n\n`;
    md += `---\n\n`;

    // Executive Summary
    if (prd.executiveSummary) {
      md += `## Executive Summary\n\n${prd.executiveSummary}\n\n`;
    }

    // Problem Statement
    if (prd.problemStatement) {
      md += `## Problem Statement\n\n`;
      if (prd.problemStatement.problem) md += `### Problem\n${prd.problemStatement.problem}\n\n`;
      if (prd.problemStatement.impact) md += `### Impact\n${prd.problemStatement.impact}\n\n`;
      if (prd.problemStatement.currentState) md += `### Current State\n${prd.problemStatement.currentState}\n\n`;
      if (prd.problemStatement.desiredState) md += `### Desired State\n${prd.problemStatement.desiredState}\n\n`;
    }

    // User Personas
    if (prd.userPersonas && prd.userPersonas.length > 0) {
      md += `## User Personas\n\n`;
      prd.userPersonas.forEach((persona, index) => {
        md += `### ${persona.name || `Persona ${index + 1}`}\n`;
        if (persona.basedOnInterview) md += `*Based on: ${persona.basedOnInterview}*\n\n`;
        if (persona.description) md += `${persona.description}\n\n`;
        if (persona.needs && persona.needs.length > 0) {
          md += `**Needs:**\n`;
          persona.needs.forEach((need) => {
            md += `- ${need}\n`;
          });
          md += `\n`;
        }
        if (persona.painPoints && persona.painPoints.length > 0) {
          md += `**Pain Points:**\n`;
          persona.painPoints.forEach((pain) => {
            md += `- ${pain}\n`;
          });
          md += `\n`;
        }
      });
    }

    // Features (match simplified UI: name + description)
    if (prd.features && prd.features.length > 0) {
      md += `## Features & Requirements\n\n`;
      prd.features.forEach((feature, index) => {
        md += `### ${feature.name || `Feature ${index + 1}`}\n`;
        if (feature.description) md += `${feature.description}\n\n`;
      });
    }

    return md;
  };

  const generatePrintHTML = (prd, projectName) => {
    let html = `<h1>${prd.title || projectName || "Product Requirements Document"}</h1>`;
    html += `<p><strong>Version:</strong> ${prd.version || "1.0"} • <strong>Date:</strong> ${prd.date || new Date().toISOString().split("T")[0]}</p><hr>`;

    // Mirror PRDPreview structure so PDF matches UI
    if (prd.executiveSummary) html += `<section><h2>Executive Summary</h2><p>${prd.executiveSummary}</p></section>`;

    if (prd.problemStatement) {
      html += `<section><h2>Problem Statement</h2>`;
      if (prd.problemStatement.problem) html += `<div><h3>Problem</h3><p>${prd.problemStatement.problem}</p></div>`;
      if (prd.problemStatement.impact) html += `<div><h3>Impact</h3><p>${prd.problemStatement.impact}</p></div>`;
      if (prd.problemStatement.currentState) html += `<div><h3>Current State</h3><p>${prd.problemStatement.currentState}</p></div>`;
      if (prd.problemStatement.desiredState) html += `<div><h3>Desired State</h3><p>${prd.problemStatement.desiredState}</p></div>`;
      html += `</section>`;
    }

    if (prd.userPersonas && prd.userPersonas.length > 0) {
      html += `<section><h2>User Personas</h2>`;
      prd.userPersonas.forEach((persona, index) => {
        html += `<div class="section-block">`;
        html += `<h3>${persona.name || `Persona ${index + 1}`}</h3>`;
        if (persona.description) html += `<p>${persona.description}</p>`;
        if (persona.needs && persona.needs.length > 0) {
          html += `<p><strong>Needs:</strong></p><ul>`;
          persona.needs.forEach((need) => (html += `<li>${need}</li>`));
          html += `</ul>`;
        }
        if (persona.painPoints && persona.painPoints.length > 0) {
          html += `<p><strong>Pain Points:</strong></p><ul>`;
          persona.painPoints.forEach((pain) => (html += `<li>${pain}</li>`));
          html += `</ul>`;
        }
        html += `</div>`;
      });
      html += `</section>`;
    }

    // Features (match simplified UI: name + description)
    if (prd.features && prd.features.length > 0) {
      html += `<section><h2>Features & Requirements</h2>`;
      prd.features.forEach((feature, index) => {
        html += `<div class="section-block">`;
        html += `<h3>${feature.name || `Feature ${index + 1}`}</h3>`;
        if (feature.description) html += `<p>${feature.description}</p>`;
        html += `</div>`;
      });
      html += `</section>`;
    }

    return html;
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
      setError(
        err.response?.data?.error || "Failed to generate PRD. Please try again."
      );
      showToast.error(err.response?.data?.error || "Failed to generate PRD");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "1rem",
        padding: "1.5rem",
        border: "1px solid #1f2937",
      }}
    >
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "#e5e7eb",
        }}
      >
        3. Generate PRD
      </h2>

      <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.5 }}>
        {interviewCount >= 2
          ? `Uses all ${interviewCount} interviews and saved patterns. Regenerating replaces the current PRD.`
          : interviewCount === 1
            ? "Uses your 1 interview. Add more interviews and run Patterns first for a stronger PRD."
            : "Add interviews in step 1 before generating a PRD."}
      </p>

      {!prd ? (
        <div>
          {projectId && projectData ? (
            <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#0f172a", borderRadius: "0.5rem", border: "1px solid #1f2937" }}>
              <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.5rem" }}>Project:</p>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#e5e7eb" }}>{projectData.name}</p>
              {projectData.description && (
                <p style={{ fontSize: "0.875rem", color: "#d1d5db", marginTop: "0.5rem" }}>{projectData.description}</p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="projectName"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "#d1d5db",
                }}
              >
                Project Name *
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#030712",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="projectDescription"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
                color: "#d1d5db",
              }}
            >
              Project Description (Optional)
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief description of the product..."
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#030712",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!projectId && !projectName.trim())}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              background: isGenerating || (!projectId && !projectName.trim())
                ? "#374151"
                : "linear-gradient(135deg, #4f46e5, #6366f1, #0ea5e9)",
              color: "#f9fafb",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: isGenerating || (!projectId && !projectName.trim()) ? "default" : "pointer",
              opacity: isGenerating || (!projectId && !projectName.trim()) ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isGenerating ? "Generating PRD..." : "Generate PRD"}
          </button>

          {error && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.85rem",
                color: "#fca5a5",
              }}
            >
              {error}
            </p>
          )}
        </div>
      ) : (
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
              console.error("Error saving PRD:", err);
              showToast.dismiss(toastId);
              showToast.error("Failed to save PRD");
            } finally {
              setIsSaving(false);
            }
          }}
          onExport={(format, currentPrd) => {
            const prdToUse = currentPrd || prd;
            if (format === "markdown") {
              const markdown = generateMarkdown(prdToUse, projectName);
              const blob = new Blob([markdown], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${(prdToUse.title || projectName || "prd")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}_prd.md`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else if (format === "pdf") {
              // Use the PDF export helpers
              const printWindow = window.open("", "_blank");
              const printContent = generatePrintHTML(prdToUse, projectName);
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>${prdToUse.title || projectName || "PRD"}</title>
                    <meta charset="utf-8">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #000; background: #fff; padding: 2rem; max-width: 800px; margin: 0 auto; }
                      h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #000; page-break-after: avoid; }
                      h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #000; page-break-after: avoid; }
                      h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #000; page-break-after: avoid; }
                      p { margin-bottom: 1rem; color: #000; }
                      ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; color: #000; }
                      li { margin-bottom: 0.5rem; }
                      section { margin-bottom: 2rem; page-break-inside: avoid; }
                      hr { margin: 2rem 0; border: none; border-top: 1px solid #ccc; }
                      .section-block { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border: 1px solid #e5e7eb; }
                      @media print { body { padding: 1rem; } .section-block { background: #fff; border: 1px solid #000; page-break-inside: avoid; } section { page-break-inside: avoid; } }
                    </style>
                  </head>
                  <body>${printContent}</body>
                </html>
              `);
              printWindow.document.close();
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
              }, 250);
            }
          }}
          onRegenerate={() => setPrd(null)}
        />
      )}
    </div>
  );
}

export default PRDGenerator;
