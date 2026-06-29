import React from "react";
import AppLogo from "./AppLogo";
import UserAvatar from "./UserAvatar";

function AppHeader({
  user,
  onLogoClick,
  onNavigateHome,
  onNavigateWorkspace,
  onSignIn,
  onSignUp,
  onHowItWorks,
  onOpenProfile,
  guideActive = false,
  showAnchorLinks = false,
  authMode = null,
  superAdminMode = false,
}) {
  const isAuthenticated = Boolean(user);

  return (
    <header className={`app-header${superAdminMode ? " app-header--super-admin" : ""}`}>
      <div className="app-header-inner">
        <div className="app-brand">
          <button type="button" className="app-brand-btn" onClick={onLogoClick} aria-label="Go to home">
            <AppLogo variant="dark" size="md" />
          </button>
          {superAdminMode && <span className="app-header-super-admin-label">Super Admin</span>}
        </div>

        {!superAdminMode && (
          <nav className="app-header-nav" aria-label="Main navigation">
          <button type="button" className="app-header-nav-link" onClick={onNavigateHome}>
            Home
          </button>
          <button type="button" className="app-header-nav-link" onClick={onNavigateWorkspace}>
            Workspace
          </button>
          {showAnchorLinks && (
            <>
              <a href="#features" className="app-header-nav-link app-header-nav-anchor">
                Features
              </a>
              <a href="#workflow" className="app-header-nav-link app-header-nav-anchor">
                Workflow
              </a>
            </>
          )}
        </nav>
        )}

        <div className="app-header-actions">
          {isAuthenticated ? (
            <>
              {!superAdminMode && (
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm app-how-it-works-btn${guideActive ? " is-active" : ""}`}
                  onClick={onHowItWorks}
                >
                  How it works
                </button>
              )}

              <button
                type="button"
                className="profile-trigger"
                onClick={onOpenProfile}
                aria-label="Open profile menu"
              >
                <UserAvatar user={user} size="sm" className="profile-trigger-avatar" />
                <span className="profile-trigger-text">
                  <span className="profile-trigger-name">{user?.name}</span>
                  <span className="profile-trigger-hint">{superAdminMode ? "Admin account" : "Account"}</span>
                </span>
                <svg className="profile-trigger-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`btn btn-ghost btn-sm app-header-signin${authMode === "login" ? " is-active" : ""}`}
                onClick={onSignIn}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`btn btn-primary btn-sm app-header-cta${authMode === "register" ? " is-active" : ""}`}
                onClick={onSignUp}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
