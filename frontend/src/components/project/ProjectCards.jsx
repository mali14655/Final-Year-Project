import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useConfirm } from "../common/ConfirmProvider";
import { showToast } from "../../utils/toast";

function ProjectCards({ onProjectSelect }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const confirm = useConfirm();

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
      console.error("Error loading projects:", err);
      setError("Failed to load projects");
      showToast.error("Failed to load projects");
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
      console.error("Error deleting project:", err);
      showToast.dismiss(toastId);
      showToast.error(err.response?.data?.error || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#fca5a5" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#e5e7eb" }}>Projects</h2>
        <button
          onClick={() => onProjectSelect(null, true)}
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
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            backgroundColor: "#020617",
            borderRadius: "1rem",
            border: "1px dashed #374151",
          }}
        >
          <p style={{ color: "#9ca3af", fontSize: "1rem", marginBottom: "1rem" }}>
            No projects yet
          </p>
          <button
            onClick={() => onProjectSelect(null, true)}
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
            Create Your First Project
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              style={{
                backgroundColor: "#020617",
                borderRadius: "1rem",
                padding: "1.5rem",
                border: "1px solid #1f2937",
                cursor: deletingId === project.id ? "default" : "pointer",
                transition: "all 0.2s",
                position: "relative",
                opacity: deletingId === project.id ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (deletingId) return;
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1f2937";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#e5e7eb",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {project.name}
                </h3>
                <button
                  type="button"
                  title="Delete project"
                  onClick={(e) => handleDelete(project, e)}
                  disabled={deletingId === project.id}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #7f1d1d",
                    backgroundColor: "transparent",
                    color: "#fca5a5",
                    fontSize: "0.75rem",
                    cursor: deletingId === project.id ? "default" : "pointer",
                  }}
                >
                  {deletingId === project.id ? "..." : "Delete"}
                </button>
              </div>

              {project.description && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#9ca3af",
                    marginBottom: "1rem",
                    lineHeight: "1.5",
                  }}
                >
                  {project.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.875rem",
                  color: "#d1d5db",
                  marginBottom: "0.75rem",
                }}
              >
                <span>
                  <span style={{ color: "#93c5fd" }}>📊</span> {project.interviewCount || 0} Interviews
                </span>
                {project.hasPRD && (
                  <span>
                    <span style={{ color: "#86efac" }}>📄</span> PRD
                  </span>
                )}
                {project.hasPatterns && (
                  <span>
                    <span style={{ color: "#fbbf24" }}>🔍</span> Patterns
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  borderTop: "1px solid #1f2937",
                  paddingTop: "0.75rem",
                }}
              >
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectCards;
