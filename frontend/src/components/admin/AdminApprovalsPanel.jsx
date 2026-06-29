import React, { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { useConfirm } from "../common/ConfirmProvider";
import {
  approveUserRequest,
  deleteUserRequest,
  fetchManagedUsers,
  fetchPendingUsers,
  inactivateAllUsersRequest,
  inactivateUserRequest,
  reactivateUserRequest,
  rejectUserRequest,
} from "../../services/api";
import { showToast } from "../../utils/toast";

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Active",
  rejected: "Rejected",
  inactive: "Inactive",
};

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "rejected", label: "Rejected" },
];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-user-status admin-user-status--${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function AdminUserRow({ user, busy, onApprove, onReject, onInactivate, onReactivate, onDelete }) {
  return (
    <article className="admin-user-row surface-card">
      <div className="admin-user-row-identity">
        <span className="admin-user-avatar" aria-hidden="true">
          {getInitials(user.name)}
        </span>
        <div className="admin-user-row-meta">
          <div className="admin-user-row-title">
            <h3 className="admin-approval-name">{user.name}</h3>
            <StatusBadge status={user.status} />
          </div>
          <p className="admin-approval-email">{user.email}</p>
          <p className="text-muted admin-approval-date">
            {user.status === "pending" ? "Requested" : "Joined"} {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="admin-approval-actions">
        {user.status === "pending" && (
          <>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onApprove(user.id)}>
              {busy ? "Working..." : "Approve"}
            </button>
            <button type="button" className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={() => onReject(user.id)}>
              Reject
            </button>
          </>
        )}
        {user.status !== "pending" && (
          <>
            {user.status === "inactive" || user.status === "rejected" ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onReactivate(user.id)}>
                Reactivate
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onInactivate(user.id)}>
                Inactivate
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              disabled={busy}
              onClick={() => onDelete(user.id, user.name)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function AdminApprovalsPanel({ onBack, isHome = false, userName = "" }) {
  const confirm = useConfirm();
  const [managedUsers, setManagedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, managedData] = await Promise.all([fetchPendingUsers(), fetchManagedUsers()]);
      const pendingIds = new Set((pendingData.users || []).map((user) => user.id));
      const merged = (managedData.users || []).map((user) =>
        pendingIds.has(user.id) ? { ...user, status: "pending" } : user
      );
      setManagedUsers(merged);
    } catch (err) {
      showToast.apiError(err, "Failed to load users.");
      setManagedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const counts = { total: managedUsers.length, pending: 0, approved: 0, inactive: 0, rejected: 0 };
    for (const user of managedUsers) {
      if (counts[user.status] !== undefined) {
        counts[user.status] += 1;
      }
    }
    return counts;
  }, [managedUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return managedUsers.filter((user) => {
      const matchesFilter = activeFilter === "all" || user.status === activeFilter;
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [managedUsers, activeFilter, searchQuery]);

  const updateManagedUser = (userId, nextStatus) => {
    setManagedUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user))
    );
  };

  const removeManagedUser = (userId) => {
    setManagedUsers((current) => current.filter((user) => user.id !== userId));
  };

  const handleApprove = async (userId) => {
    setActionId(userId);
    try {
      await approveUserRequest(userId);
      showToast.success("User approved. They can now sign in.");
      updateManagedUser(userId, "approved");
    } catch (err) {
      showToast.apiError(err, "Failed to approve user.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (userId) => {
    const confirmed = await confirm({
      title: "Reject signup?",
      message: "This user will not be able to sign in unless you reactivate them later.",
      confirmLabel: "Reject",
      variant: "danger",
    });
    if (!confirmed) return;

    setActionId(userId);
    try {
      await rejectUserRequest(userId);
      showToast.success("User rejected.");
      updateManagedUser(userId, "rejected");
    } catch (err) {
      showToast.apiError(err, "Failed to reject user.");
    } finally {
      setActionId(null);
    }
  };

  const handleInactivate = async (userId) => {
    const confirmed = await confirm({
      title: "Inactivate user?",
      message: "They will be signed out and cannot sign in until reactivated.",
      confirmLabel: "Inactivate",
      variant: "danger",
    });
    if (!confirmed) return;

    setActionId(userId);
    try {
      await inactivateUserRequest(userId);
      showToast.success("User inactivated.");
      updateManagedUser(userId, "inactive");
    } catch (err) {
      showToast.apiError(err, "Failed to inactivate user.");
    } finally {
      setActionId(null);
    }
  };

  const handleReactivate = async (userId) => {
    setActionId(userId);
    try {
      await reactivateUserRequest(userId);
      showToast.success("User reactivated. They can sign in again.");
      updateManagedUser(userId, "approved");
    } catch (err) {
      showToast.apiError(err, "Failed to reactivate user.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (userId, name) => {
    const confirmed = await confirm({
      title: "Delete user permanently?",
      message: `${name}'s account, projects, and interviews will be removed. They will see "No account found" if they try to sign in.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    setActionId(userId);
    try {
      await deleteUserRequest(userId);
      showToast.success("User deleted.");
      removeManagedUser(userId);
    } catch (err) {
      showToast.apiError(err, "Failed to delete user.");
    } finally {
      setActionId(null);
    }
  };

  const handleInactivateAll = async () => {
    const activeCount = managedUsers.filter((user) => user.status !== "inactive").length;
    if (activeCount === 0) {
      showToast.info("All users are already inactive.");
      return;
    }

    const confirmed = await confirm({
      title: "Inactivate all users?",
      message: `This will inactivate ${activeCount} user${activeCount === 1 ? "" : "s"} and sign them out immediately. Super admin is not affected.`,
      confirmLabel: "Inactivate all",
      variant: "danger",
    });
    if (!confirmed) return;

    setBulkLoading(true);
    try {
      const result = await inactivateAllUsersRequest();
      showToast.success(result.message || "All users inactivated.");
      await loadUsers();
    } catch (err) {
      showToast.apiError(err, "Failed to inactivate all users.");
    } finally {
      setBulkLoading(false);
    }
  };

  const firstName = userName?.trim().split(" ")[0] || "Admin";

  return (
    <div className="admin-console">
      {isHome && (
        <section className="super-admin-hero">
          <div className="super-admin-hero-content">
            <div className="super-admin-hero-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3 4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-4Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="eyebrow super-admin-hero-eyebrow">Super Admin Console</p>
              <h1 className="super-admin-hero-title">Welcome back, {firstName}</h1>
              <p className="super-admin-hero-copy">
                Review signups, approve access, and manage who can use ParseAi.
              </p>
            </div>
          </div>
        </section>
      )}

      {!isHome && (
        <div className="admin-console-topbar">
          {onBack ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
              Back to projects
            </button>
          ) : null}
          <div>
            <p className="eyebrow">Super admin</p>
            <h1 className="heading-lg admin-approvals-title">User management</h1>
          </div>
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="admin-stat-card surface-card">
          <span className="admin-stat-label">Total users</span>
          <strong className="admin-stat-value">{stats.total}</strong>
        </div>
        <div className="admin-stat-card surface-card admin-stat-card--pending">
          <span className="admin-stat-label">Pending</span>
          <strong className="admin-stat-value">{stats.pending}</strong>
        </div>
        <div className="admin-stat-card surface-card admin-stat-card--active">
          <span className="admin-stat-label">Active</span>
          <strong className="admin-stat-value">{stats.approved}</strong>
        </div>
        <div className="admin-stat-card surface-card admin-stat-card--inactive">
          <span className="admin-stat-label">Inactive</span>
          <strong className="admin-stat-value">{stats.inactive + stats.rejected}</strong>
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="admin-pending-banner" role="status">
          <span className="admin-pending-banner-dot" aria-hidden="true" />
          <p>
            <strong>{stats.pending}</strong> signup{stats.pending === 1 ? "" : "s"} waiting for your approval.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveFilter("pending")}>
            Review now
          </button>
        </div>
      )}

      <section className="admin-users-panel surface-card">
        <div className="admin-users-panel-head">
          <div>
            <h2 className="heading-md admin-users-panel-title">Users</h2>
            <p className="text-muted admin-users-panel-copy">Search, filter, and manage accounts.</p>
          </div>
          <div className="admin-approvals-header-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadUsers} disabled={loading || bulkLoading}>
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              onClick={handleInactivateAll}
              disabled={loading || bulkLoading}
            >
              {bulkLoading ? "Working..." : "Inactivate all"}
            </button>
          </div>
        </div>

        <div className="admin-users-toolbar">
          <label className="admin-search-field">
            <span className="sr-only">Search users</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="input admin-search-input"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div className="admin-filter-tabs" role="tablist" aria-label="Filter users by status">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.id === "all"
                  ? managedUsers.length
                  : managedUsers.filter((user) => user.status === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === tab.id}
                  className={`admin-filter-tab${activeFilter === tab.id ? " is-active" : ""}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                  <span className="admin-filter-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="admin-users-loading">
            <LoadingSpinner variant="section" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-approvals-empty">
            <div className="admin-empty-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="heading-md" style={{ margin: "0 0 0.35rem" }}>
              {searchQuery || activeFilter !== "all" ? "No users match your filters" : "No users yet"}
            </p>
            <p className="text-muted" style={{ margin: 0 }}>
              {searchQuery || activeFilter !== "all"
                ? "Try a different search or clear the status filter."
                : "New signups will appear here when someone creates an account."}
            </p>
          </div>
        ) : (
          <div className="admin-approvals-list">
            {filteredUsers.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                busy={actionId === user.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onInactivate={handleInactivate}
                onReactivate={handleReactivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminApprovalsPanel;
