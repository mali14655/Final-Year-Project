import React, { createContext, useCallback, useContext, useState } from "react";

const ConfirmContext = createContext(null);

const defaultOptions = {
  title: "Are you sure?",
  message: "This action cannot be undone.",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "default",
};

function ConfirmDialog({ open, options, onConfirm, onCancel, isLoading }) {
  if (!open) {
    return null;
  }

  const isDanger = options.variant === "danger";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="modal-overlay"
      style={{ zIndex: 10000 }}
      onClick={onCancel}
    >
      <div className="modal-content" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-dialog-title" className="heading-md" style={{ marginBottom: "0.75rem" }}>
          {options.title}
        </h3>
        <p className="text-muted" style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {options.message}
        </p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel} disabled={isLoading} className="btn btn-secondary">
            {options.cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn ${isDanger ? "btn-danger-ghost" : "btn-primary"}`}
            style={isDanger ? { padding: "0.625rem 1.25rem", fontSize: "0.875rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none" } : undefined}
          >
            {isLoading ? "Please wait..." : options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    options: defaultOptions,
    resolve: null,
    isLoading: false,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        options: { ...defaultOptions, ...options },
        resolve,
        isLoading: false,
      });
    });
  }, []);

  const handleCancel = () => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: null, isLoading: false }));
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null, isLoading: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        options={state.options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={state.isLoading}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}
