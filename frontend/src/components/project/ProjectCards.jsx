import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useConfirm } from "../common/ConfirmProvider";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errors";
import LoadingSpinner from "../common/LoadingSpinner";
import { usePreferences } from "../../hooks/usePreferences";

function getProjectInitials(name) {
  if (!name) return "P";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2 0v12.5A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5V6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10v6M14 10v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ProjectCards({ onProjectSelect, onOpenHowItWorks }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const confirm = useConfirm();
  const { showWorkflowHints } = usePreferences();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(`/api/projects`);
      setProjects(response.data.projects || []);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load projects");
      setError(message);
      showToast.apiError(err, message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (project, e) => {
    e.stopPropagation();

    const interviewCount = project.interviewCount || 0;
    const confirmed = await confirm({
      title: "Delete project?",
      message: `This will permanently delete "${project.name}"${
        interviewCount > 0
          ? ` and all ${interviewCount} interview${interviewCount === 1 ? "" : "s"} including stored audio, video, and PDF files`
          : ""
      }. This action cannot be undone.`,
      confirmLabel: "Delete Project",
      cancelLabel: "Keep Project",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    const toastId = showToast.loading("Deleting project...");

    try {
      await api.delete(`/api/projects/${project.id}`);
      showToast.dismiss(toastId);
      showToast.success(`Project "${project.name}" deleted`);
      await loadProjects();
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <LoadingSpinner variant="overlay" />
        <div className="page-boot-placeholder" aria-hidden="true" />
      </>
    );
  }

  if (error) {
    return (
      <div className="text-error" style={{ textAlign: "center", padding: "2rem" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="projects-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 className="heading-lg">Your projects</h2>
        </div>
        <button type="button" onClick={() => onProjectSelect(null, true)} className="btn btn-primary btn-lg">
          New project
        </button>
      </div>

      <div className="how-it-works-cta surface-card">
        <div className="how-it-works-cta-copy">
          <p className="eyebrow" style={{ margin: "0 0 0.35rem" }}>Guide</p>
          <h3 className="heading-md" style={{ margin: "0 0 0.35rem" }}>How it works</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5, maxWidth: "36rem" }}>
            Learn the full workflow — interviews, insight tags (Pain, Need, Quote, and more), pattern analysis, PRD sections, and every feature explained step by step.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenHowItWorks?.("overview")}>
          Open guide
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          {showWorkflowHints && <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Get started</p>}
          <h3 className="heading-md" style={{ marginBottom: "0.5rem" }}>No projects yet</h3>
          {showWorkflowHints && (
            <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
              Create a project to upload interviews, analyze patterns, and generate a PRD.
            </p>
          )}
          <button type="button" onClick={() => onProjectSelect(null, true)} className="btn btn-primary btn-lg">
            Create first project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <article
              key={project.id}
              onClick={() => deletingId !== project.id && onProjectSelect(project.id)}
              className={`project-card ${deletingId === project.id ? "is-disabled" : ""}`}
            >
              <button
                type="button"
                title="Delete project"
                aria-label={`Delete ${project.name}`}
                onClick={(e) => handleDelete(project, e)}
                disabled={deletingId === project.id}
                className="project-card-delete"
              >
                {deletingId === project.id ? (
                  <span className="project-card-delete-spinner" />
                ) : (
                  <TrashIcon />
                )}
              </button>

              <div className="project-card-body">
                <div className="project-avatar">{getProjectInitials(project.name)}</div>
                <div className="project-card-meta">
                  <h3 className="project-card-title">{project.name}</h3>
                  {project.description ? (
                    <p className="project-card-desc">{project.description}</p>
                  ) : (
                    <p className="project-card-desc project-card-desc-empty">No description</p>
                  )}
                </div>
              </div>

              <div className="stat-row">
                <span className={`stat-chip ${project.interviewCount > 0 ? "is-active" : ""}`}>
                  <span className={`stat-dot ${project.interviewCount > 0 ? "" : "muted"}`} />
                  {project.interviewCount || 0} interviews
                </span>
                {project.hasPatterns && (
                  <span className="stat-chip is-active">
                    <span className="stat-dot" />
                    Patterns
                  </span>
                )}
                {project.hasPRD && (
                  <span className="stat-chip is-active">
                    <span className="stat-dot" />
                    PRD
                  </span>
                )}
              </div>

              <footer className="project-card-footer">
                Updated {new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectCards;
