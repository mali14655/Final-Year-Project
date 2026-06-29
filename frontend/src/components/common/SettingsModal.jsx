import React, { useEffect, useRef, useState } from "react";
import PasswordInput from "../auth/PasswordInput";
import UserAvatar from "./UserAvatar";
import AvatarCropModal from "./AvatarCropModal";
import ToggleSwitch from "./ToggleSwitch";
import { showToast } from "../../utils/toast";
import {
  updateProfileRequest,
  changePasswordRequest,
  updatePreferencesRequest,
  uploadAvatarRequest,
  removeAvatarRequest,
} from "../../services/api";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
];

const DEFAULT_PREFERENCES = {
  showWorkflowHints: true,
  compactView: false,
};

function SettingsModal({ open, onClose, user, onUserUpdate, onRequireReauth }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [cropFile, setCropFile] = useState(null);
  const fileInputRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPreferences({
        showWorkflowHints: user.preferences?.showWorkflowHints ?? true,
        compactView: user.preferences?.compactView ?? false,
      });
      setActiveTab("profile");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    wasOpenRef.current = open;
  }, [open, user]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !cropFile) onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, cropFile]);

  if (!open || !user) {
    return null;
  }

  const handleFilePick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image must be smaller than 5MB.");
      return;
    }

    setCropFile(file);
  };

  const handleCropConfirm = async (croppedFile) => {
    setAvatarUploading(true);
    const toastId = showToast.loading("Uploading photo...");

    try {
      const updatedUser = await uploadAvatarRequest(croppedFile);
      onUserUpdate?.(updatedUser);
      setAvatarRefreshKey((k) => k + 1);
      showToast.dismiss(toastId);
      showToast.success("Profile photo updated");
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to upload photo.");
    } finally {
      setAvatarUploading(false);
      setCropFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const toastId = showToast.loading("Removing photo...");

    try {
      const updatedUser = await removeAvatarRequest();
      onUserUpdate?.(updatedUser);
      setAvatarRefreshKey((k) => k + 1);
      showToast.dismiss(toastId);
      showToast.success("Profile photo removed");
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to remove photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    const toastId = showToast.loading("Saving profile...");

    try {
      const updatedUser = await updateProfileRequest({ name, email });
      onUserUpdate?.(updatedUser);
      showToast.dismiss(toastId);
      showToast.success("Profile updated");
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast.error("New passwords do not match.");
      return;
    }

    setSaving(true);
    const toastId = showToast.loading("Updating password...");

    try {
      await changePasswordRequest({ currentPassword, newPassword });
      showToast.dismiss(toastId);
      showToast.success("Password updated. Signing you out...");
      onRequireReauth?.();
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.apiError(err, "Failed to change password.");
      setSaving(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const previous = { ...preferences };
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);

    try {
      const updatedUser = await updatePreferencesRequest({
        showWorkflowHints: nextPreferences.showWorkflowHints,
        compactView: nextPreferences.compactView,
      });
      onUserUpdate?.(updatedUser);

      const label = key === "showWorkflowHints" ? "Workflow hints" : "Compact view";
      showToast.success(value ? `${label} enabled` : `${label} disabled`);
    } catch (err) {
      setPreferences(previous);
      showToast.apiError(err, "Failed to save preferences.");
    }
  };

  return (
    <>
      <div className="modal-overlay settings-modal-overlay" role="presentation" onClick={onClose}>
        <div
          className="modal-content settings-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Account settings"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-modal-header">
            <div>
              <p className="eyebrow">Account</p>
              <h2 className="heading-md settings-title">Settings</h2>
              <p className="settings-subtitle">Manage your profile, security, and workspace preferences</p>
            </div>
            <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="settings-tabs" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`settings-tab ${activeTab === tab.id ? "settings-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="settings-body">
            {activeTab === "profile" && (
              <div className="settings-section">
                <div className="settings-card settings-avatar-card">
                  <div className="settings-card-label">Profile photo</div>
                  <div className="settings-avatar-row">
                    <UserAvatar user={user} size="lg" refreshKey={avatarRefreshKey} />
                    <div className="settings-avatar-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="settings-file-input"
                        onChange={handleFilePick}
                      />
                      <div className="settings-avatar-buttons">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={avatarUploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {avatarUploading ? "Uploading..." : user.hasAvatar ? "Change photo" : "Upload photo"}
                        </button>
                        {user.hasAvatar && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={avatarUploading}
                            onClick={handleRemoveAvatar}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="settings-hint">JPEG, PNG, WebP, or GIF. You can reposition before saving.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="settings-card settings-form-card">
                  <div className="settings-card-label">Personal information</div>

                  <div className="settings-field">
                    <label className="label" htmlFor="settings-name">
                      Full name
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="label" htmlFor="settings-email">
                      Email address
                    </label>
                    <input
                      id="settings-email"
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="settings-form-footer">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleSavePassword} className="settings-card settings-form-card">
                <div className="settings-card-label">Password</div>
                <p className="settings-hint settings-security-note">
                  After updating your password, you will be signed out on all devices for security.
                </p>

                <div className="settings-field">
                  <label className="label" htmlFor="settings-current-password">
                    Current password
                  </label>
                  <PasswordInput
                    id="settings-current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="settings-field">
                  <label className="label" htmlFor="settings-new-password">
                    New password
                  </label>
                  <PasswordInput
                    id="settings-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>

                <div className="settings-field">
                  <label className="label" htmlFor="settings-confirm-password">
                    Confirm new password
                  </label>
                  <PasswordInput
                    id="settings-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>

                <div className="settings-form-footer">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "preferences" && (
              <div className="settings-section">
                <div className="settings-card settings-pref-card">
                  <div className="settings-card-label">Workspace</div>

                  <div className="settings-pref-list">
                    <div className="settings-pref-row">
                      <div>
                        <div className="settings-pref-title">Workflow hints</div>
                        <div className="settings-pref-desc">Show tips for interviews, patterns, and PRD steps</div>
                      </div>
                      <ToggleSwitch
                        id="pref-hints"
                        label="Workflow hints"
                        checked={preferences.showWorkflowHints}
                        onChange={(value) => handlePreferenceChange("showWorkflowHints", value)}
                      />
                    </div>

                    <div className="settings-pref-row">
                      <div>
                        <div className="settings-pref-title">Compact view</div>
                        <div className="settings-pref-desc">Use tighter spacing in project lists and panels</div>
                      </div>
                      <ToggleSwitch
                        id="pref-compact"
                        label="Compact view"
                        checked={preferences.compactView}
                        onChange={(value) => handlePreferenceChange("compactView", value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AvatarCropModal
        open={Boolean(cropFile)}
        file={cropFile}
        onClose={() => setCropFile(null)}
        onConfirm={handleCropConfirm}
      />
    </>
  );
}

export default SettingsModal;
