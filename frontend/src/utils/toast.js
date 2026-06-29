import toast from "react-hot-toast";
import { getErrorMessage, isAuthError, isQuotaError } from "./errors";

const baseStyle = {
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  borderRadius: "0.75rem",
  padding: "12px 16px",
  fontSize: "0.9rem",
  boxShadow: "0 10px 25px rgba(14, 165, 233, 0.12)",
  maxWidth: "420px",
};

const errorStyle = {
  ...baseStyle,
  border: "1px solid #fecaca",
};

const warningStyle = {
  ...baseStyle,
  border: "1px solid #fde68a",
  background: "#fffbeb",
};

export const showToast = {
  success: (message) =>
    toast.success(message, {
      style: baseStyle,
      duration: 3500,
      iconTheme: { primary: "#0ea5e9", secondary: "#fff" },
    }),

  error: (message) =>
    toast.error(message, {
      style: errorStyle,
      duration: 5000,
      iconTheme: { primary: "#ef4444", secondary: "#fff" },
    }),

  warning: (message) =>
    toast(message, {
      style: warningStyle,
      duration: 6500,
      icon: "⚠️",
    }),

  info: (message) =>
    toast(message, {
      style: baseStyle,
      duration: 4000,
      icon: "ℹ️",
    }),

  loading: (message) =>
    toast.loading(message, {
      style: baseStyle,
    }),

  dismiss: (id) => toast.dismiss(id),

  /**
   * Show a toast from an API / network error with smart messaging.
   */
  apiError: (error, fallback = "Something went wrong. Please try again.") => {
    const message = getErrorMessage(error, fallback);

    if (isQuotaError(error)) {
      return toast(message, {
        style: warningStyle,
        duration: 8000,
        icon: "⚠️",
      });
    }

    if (isAuthError(error)) {
      return toast.error(message, {
        style: errorStyle,
        duration: 6000,
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
    }

    return toast.error(message, {
      style: errorStyle,
      duration: 5500,
      iconTheme: { primary: "#ef4444", secondary: "#fff" },
    });
  },

  promise: (promise, messages) =>
    toast.promise(promise, messages, {
      style: baseStyle,
      success: { iconTheme: { primary: "#0ea5e9", secondary: "#fff" } },
      error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
    }),
};

export { toast };
