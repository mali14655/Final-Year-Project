import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import { useAuth } from "../../context/AuthContext";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const { login, register } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#020617",
          borderRadius: "1rem",
          padding: "2rem",
          border: "1px solid #1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#e5e7eb" }}>
          Cursor for Product Managers
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {mode === "login" ? "Sign in to manage your research projects" : "Create an account to get started"}
        </p>

        {mode === "login" ? (
          <Login onLogin={login} onSwitchToRegister={() => setMode("register")} />
        ) : (
          <Register onRegister={register} onSwitchToLogin={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}

export default AuthPage;
