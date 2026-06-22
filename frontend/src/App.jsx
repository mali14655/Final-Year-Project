import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./components/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProjectCards from "./components/project/ProjectCards";
import ProjectDetail from "./components/project/ProjectDetail";
import ProjectSelector from "./components/project/ProjectSelector";

function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [view, setView] = useState("projects");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#9ca3af",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleBackToProjects = () => {
    setView("projects");
    setSelectedProjectId(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1400px" }}>
        <header
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#e5e7eb",
              }}
            >
              Cursor for Product Managers
            </h1>
            <p style={{ marginTop: "0.25rem", color: "#9ca3af" }}>
              Manage interviews, insights, and PRDs in organized projects.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ color: "#d1d5db", fontSize: "0.875rem" }}>{user?.name}</span>
            <button
              type="button"
              onClick={logout}
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
              Log out
            </button>
          </div>
        </header>

        <ProtectedRoute>
          {view === "projects" ? (
            <ProjectCards
              onProjectSelect={(projectId, isNew) => {
                if (isNew) {
                  setShowCreateForm(true);
                  setView("detail");
                } else if (projectId) {
                  setSelectedProjectId(projectId);
                  setView("detail");
                }
              }}
            />
          ) : (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={handleBackToProjects}
              onCreateNew={() => {
                setShowCreateForm(true);
                setSelectedProjectId(null);
              }}
            />
          )}

          {showCreateForm && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: "#020617",
                  borderRadius: "1rem",
                  padding: "2rem",
                  border: "1px solid #1f2937",
                  maxWidth: "500px",
                  width: "90%",
                }}
              >
                <ProjectSelector
                  selectedProjectId={null}
                  onProjectSelect={(id) => {
                    if (id) {
                      setSelectedProjectId(id);
                      setShowCreateForm(false);
                      setView("detail");
                    }
                  }}
                  onProjectCreate={(id) => {
                    setSelectedProjectId(id);
                    setShowCreateForm(false);
                    setView("detail");
                  }}
                />
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    if (!selectedProjectId) {
                      setView("projects");
                    }
                  }}
                  style={{
                    marginTop: "1rem",
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
                  Cancel
                </button>
              </div>
            </div>
          )}
        </ProtectedRoute>
      </div>
    </div>
  );
}

export default App;
