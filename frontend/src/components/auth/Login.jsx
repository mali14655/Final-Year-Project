import React, { useState } from "react";
import { showToast } from "../../utils/toast";

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #374151",
  backgroundColor: "#030712",
  color: "#e5e7eb",
  fontSize: "0.9rem",
};

const labelStyle = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.5rem",
  color: "#d1d5db",
};

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onLogin(email, password);
      showToast.success("Welcome back!");
    } catch (err) {
      showToast.error(err.response?.data?.error || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="login-email" style={labelStyle}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
          placeholder="you@example.com"
        />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="login-password" style={labelStyle}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle}
          placeholder="Your password"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          border: "none",
          background: isSubmitting ? "#374151" : "linear-gradient(135deg, #4f46e5, #6366f1, #0ea5e9)",
          color: "#f9fafb",
          fontWeight: 600,
          fontSize: "0.95rem",
          cursor: isSubmitting ? "default" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      <p style={{ marginTop: "1rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: "none",
            border: "none",
            color: "#93c5fd",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Create one
        </button>
      </p>
    </form>
  );
}

export default Login;
