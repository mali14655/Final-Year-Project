import toast from "react-hot-toast";

const baseStyle = {
  background: "#0f172a",
  color: "#e5e7eb",
  border: "1px solid #334155",
  borderRadius: "0.75rem",
  padding: "12px 16px",
  fontSize: "0.9rem",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
};

export const showToast = {
  success: (message) =>
    toast.success(message, {
      style: baseStyle,
      iconTheme: { primary: "#10b981", secondary: "#fff" },
    }),
  error: (message) =>
    toast.error(message, {
      style: { ...baseStyle, border: "1px solid #7f1d1d" },
      iconTheme: { primary: "#ef4444", secondary: "#fff" },
    }),
  info: (message) =>
    toast(message, {
      style: baseStyle,
      icon: "ℹ️",
    }),
  loading: (message) =>
    toast.loading(message, {
      style: baseStyle,
    }),
  dismiss: (id) => toast.dismiss(id),
  promise: (promise, messages) =>
    toast.promise(promise, messages, {
      style: baseStyle,
      success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
      error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
    }),
};

export { toast };
