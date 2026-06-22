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

function Register({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onRegister(name, email, password);
      showToast.success("Account created!");
    } catch (err) {
      showToast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="register-name" style={labelStyle}>
          Name
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          style={inputStyle}
          placeholder="Your name"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="register-email" style={labelStyle}>
          Email
        </label>
        <input
          id="register-email"
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
        <label htmlFor="register-password" style={labelStyle}>
          Password
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          style={inputStyle}
          placeholder="At least 6 characters"
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
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>

      <p style={{ marginTop: "1rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: "none",
            border: "none",
            color: "#93c5fd",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

export default Register;
