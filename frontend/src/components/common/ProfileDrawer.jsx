import React, { useEffect } from "react";
import UserAvatar from "./UserAvatar";

function ProfileDrawer({ open, onClose, user, onLogout, onGoHome, onOpenSettings, onOpenAdmin }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="drawer-root" role="presentation">
      <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close menu" />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Profile menu">
        <div className="drawer-profile">
          <UserAvatar user={user} size="md" className="drawer-avatar" />
          <h2 className="drawer-name">{user?.name || "User"}</h2>
          <p className="drawer-email">{user?.email || ""}</p>
          {user?.isSuperAdmin && <span className="drawer-role-badge">Super Admin</span>}
        </div>

        <nav className="drawer-nav">
          {user?.isSuperAdmin ? (
            <button
              type="button"
              className="drawer-nav-item"
              onClick={() => {
                onClose();
                onOpenAdmin?.();
              }}
            >
              <span className="drawer-nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3 4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              User management
            </button>
          ) : (
            <button
              type="button"
              className="drawer-nav-item"
              onClick={() => {
                onGoHome?.();
                onClose();
              }}
            >
              <span className="drawer-nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                </svg>
              </span>
              Projects
            </button>
          )}
          <button
            type="button"
            className="drawer-nav-item"
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
          >
            <span className="drawer-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </span>
            Settings
          </button>
        </nav>

        <div className="drawer-footer">
          <button
            type="button"
            className="drawer-nav-item drawer-nav-item-danger"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <span className="drawer-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ProfileDrawer;
