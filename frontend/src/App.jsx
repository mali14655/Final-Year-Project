import React, { useState, useEffect } from "react";

import { useAuth } from "./context/AuthContext";

import LandingPage from "./components/landing/LandingPage";
import AuthPage from "./components/auth/AuthPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import ProjectCards from "./components/project/ProjectCards";

import ProjectDetail from "./components/project/ProjectDetail";

import ProjectSelector from "./components/project/ProjectSelector";

import LoadingSpinner from "./components/common/LoadingSpinner";

import ProfileDrawer from "./components/common/ProfileDrawer";

import SettingsModal from "./components/common/SettingsModal";

import HowItWorksPage from "./components/common/HowItWorksPage";

import AdminApprovalsPanel from "./components/admin/AdminApprovalsPanel";

import AppHeader from "./components/common/AppHeader";

import { usePreferences } from "./hooks/usePreferences";



function App() {

  const { user, loading, isAuthenticated, logout, updateUser } = useAuth();

  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  const { compactView } = usePreferences();

  const [view, setView] = useState("projects");

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [guideSection, setGuideSection] = useState("overview");

  const [returnView, setReturnView] = useState("projects");

  const [publicView, setPublicView] = useState("landing");



  const goHome = () => {

    setPublicView("landing");

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  const goWorkspace = () => {

    if (isAuthenticated) {

      setPublicView("app");

      setView(isSuperAdmin ? "admin" : "projects");

      setSelectedProjectId(null);

      return;

    }

    setPublicView("login");

  };



  useEffect(() => {

    if (isSuperAdmin) {

      setPublicView("app");

      setView("admin");

    }

  }, [isSuperAdmin]);



  const openHowItWorks = (section = "overview") => {

    setReturnView(view);

    setGuideSection(section);

    setView("guide");

    setPublicView("app");

  };



  const handleBackFromGuide = () => {

    setView(returnView);

  };



  if (loading) {
    return <LoadingSpinner variant="fullPage" />;
  }



  const sharedDrawer = (

    <>

      <ProfileDrawer

        open={drawerOpen}

        onClose={() => setDrawerOpen(false)}

        user={user}

        onLogout={async () => {

          await logout();

          setPublicView("landing");

          setView("projects");

          setSelectedProjectId(null);

        }}

        onGoHome={goWorkspace}

        onOpenSettings={() => setSettingsOpen(true)}

        onOpenAdmin={() => setView("admin")}

      />



      <SettingsModal

        open={settingsOpen}

        onClose={() => setSettingsOpen(false)}

        user={user}

        onUserUpdate={updateUser}

        onRequireReauth={async () => {

          await logout();

          setSettingsOpen(false);

          setPublicView("landing");

        }}

      />

    </>

  );



  if (publicView === "landing" && !(isAuthenticated && isSuperAdmin)) {

    return (

      <>

        {isAuthenticated && sharedDrawer}

        <LandingPage

          user={user}

          onHome={goHome}

          onWorkspace={goWorkspace}

          onSignIn={() => setPublicView("login")}

          onSignUp={() => setPublicView("register")}

          onHowItWorks={() => openHowItWorks("overview")}

          onOpenProfile={() => setDrawerOpen(true)}

        />

      </>

    );

  }



  if (!isAuthenticated) {

    return (

      <AuthPage

        initialMode={publicView === "register" ? "register" : "login"}

        onHome={goHome}

        onWorkspace={goWorkspace}

        onSignIn={() => setPublicView("login")}

        onSignUp={() => setPublicView("register")}

      />

    );

  }



  if (isSuperAdmin) {

    return (

      <div className="app-shell app-shell--super-admin">

        {sharedDrawer}



        <AppHeader

          user={user}

          superAdminMode

          onLogoClick={() => setView("admin")}

          onOpenProfile={() => setDrawerOpen(true)}

        />



        <div className="app-container app-main">

          <ProtectedRoute>

            <AdminApprovalsPanel isHome userName={user?.name} />

          </ProtectedRoute>

        </div>

      </div>

    );

  }



  return (

    <div className={`app-shell${compactView ? " compact-view" : ""}`}>

      {sharedDrawer}



      <AppHeader

        user={user}

        onLogoClick={goHome}

        onNavigateHome={goHome}

        onNavigateWorkspace={goWorkspace}

        onHowItWorks={() => openHowItWorks("overview")}

        onOpenProfile={() => setDrawerOpen(true)}

        guideActive={view === "guide"}

      />



      <div className="app-container app-main">

        <ProtectedRoute>

          {view === "projects" && (

            <ProjectCards

              onOpenHowItWorks={openHowItWorks}

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

          )}



          {view === "detail" && (

            <ProjectDetail

              projectId={selectedProjectId}

              onBack={() => {

                setView("projects");

                setSelectedProjectId(null);

              }}

              onOpenHowItWorks={openHowItWorks}

              onCreateNew={() => {

                setShowCreateForm(true);

                setSelectedProjectId(null);

              }}

            />

          )}



          {view === "guide" && (

            <HowItWorksPage initialSection={guideSection} onBack={handleBackFromGuide} />

          )}



          {showCreateForm && (

            <div className="modal-overlay">

              <div className="modal-content modal-content-project">
                <p className="eyebrow">New project</p>
                <h2 className="heading-md modal-project-title">Create a research project</h2>

                <ProjectSelector
                  onProjectCreate={(id) => {
                    setSelectedProjectId(id);
                    setShowCreateForm(false);
                    setView("detail");
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    if (!selectedProjectId) {
                      setView("projects");
                    }
                  }}
                  className="btn btn-secondary btn-block modal-project-cancel"
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
