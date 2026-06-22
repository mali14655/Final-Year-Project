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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#020617",
          borderRadius: "1rem",
          padding: "1.5rem",
          border: "1px solid #1f2937",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-dialog-title"
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#e5e7eb",
          }}
        >
          {options.title}
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "0.9rem",
            color: "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          {options.message}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              backgroundColor: "#030712",
              color: "#e5e7eb",
              fontSize: "0.875rem",
              cursor: isLoading ? "default" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {options.cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: isDanger
                ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                : "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isLoading ? "default" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
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
