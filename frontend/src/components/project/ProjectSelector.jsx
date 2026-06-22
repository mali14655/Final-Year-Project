import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";

function ProjectSelector({ selectedProjectId, onProjectSelect, onProjectCreate }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/projects");
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast.error("Project name is required");
      return;
    }

    const toastId = showToast.loading("Creating project...");

    try {
      const response = await api.post("/api/projects", {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      });

      const newProject = response.data;
      setProjects([newProject, ...projects]);
      setNewProjectName("");
      setNewProjectDescription("");
      setShowCreateForm(false);
      showToast.dismiss(toastId);
      showToast.success(`Project "${newProject.name}" created`);

      if (onProjectCreate) {
        onProjectCreate(newProject.id);
      }
      if (onProjectSelect) {
        onProjectSelect(newProject.id);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showToast.dismiss(toastId);
      showToast.error("Failed to create project. Please try again.");
    }
  };

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "1rem",
        padding: "1.5rem",
        border: "1px solid #1f2937",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#e5e7eb",
          }}
        >
          Project
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #374151",
            backgroundColor: showCreateForm ? "#3b82f6" : "#030712",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {showCreateForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateProject} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#030712", borderRadius: "0.5rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "#d1d5db" }}>
              Project Name *
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "#d1d5db" }}>
              Description (Optional)
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Project description..."
              rows={2}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
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
        </form>
      )}

      {!showCreateForm && (
        <div>
          {isLoading ? (
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              No projects yet. Create one to get started!
            </p>
          ) : (
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                if (onProjectSelect) {
                  onProjectSelect(e.target.value || null);
                }
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#030712",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.interviewCount > 0 ? `(${project.interviewCount} interviews)` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectSelector;
