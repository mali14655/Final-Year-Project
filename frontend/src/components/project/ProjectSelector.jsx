import React, { useState } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";

function ProjectSelector({ onProjectCreate }) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast.error("Project name is required");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Creating project...");

    try {
      const response = await api.post("/api/projects", {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      });

      const newProject = response.data;
      showToast.dismiss(toastId);
      showToast.success(`Project "${newProject.name}" created`);

      if (onProjectCreate) {
        onProjectCreate(newProject.id);
      }
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.apiError(error, "Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCreateProject} className="project-create-form">
      <p className="project-create-hint">
        Give your research a name. You can upload interviews and generate PRDs inside the project.
      </p>

      <div className="form-group">
        <label htmlFor="project-name" className="label">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="e.g. Mobile onboarding research"
          required
          autoFocus
          maxLength={120}
          className="input"
        />
      </div>

      <div className="form-group project-create-field-last">
        <label htmlFor="project-description" className="label">
          Description <span className="label-optional">(optional)</span>
        </label>
        <textarea
          id="project-description"
          value={newProjectDescription}
          onChange={(e) => setNewProjectDescription(e.target.value)}
          placeholder="What are you researching? Who did you interview?"
          rows={3}
          maxLength={500}
          className="textarea"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !newProjectName.trim()}
        className="btn btn-primary btn-block btn-lg project-create-submit"
      >
        {isSubmitting ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}

export default ProjectSelector;
