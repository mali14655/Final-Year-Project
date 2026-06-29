import React, { useEffect, useState } from "react";
import Login from "./Login";
import Register from "./Register";
import AppHeader from "../common/AppHeader";
import { useAuth } from "../../context/AuthContext";

function AuthPage({
  initialMode = "login",
  onHome,
  onWorkspace,
  onSignIn,
  onSignUp,
}) {
  const [mode, setMode] = useState(initialMode);
  const { login, register } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const isLogin = mode === "login";

  const handleSignIn = () => {
    setMode("login");
    onSignIn?.();
  };

  const handleSignUp = () => {
    setMode("register");
    onSignUp?.();
  };

  return (
    <div className="auth-page app-shell">
      <AppHeader
        onLogoClick={onHome}
        onNavigateHome={onHome}
        onNavigateWorkspace={onWorkspace}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        authMode={mode}
      />

      <main className="auth-main">
        <div className="auth-content">
          <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={`auth-mode-btn${isLogin ? " is-active" : ""}`}
              onClick={handleSignIn}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={`auth-mode-btn${!isLogin ? " is-active" : ""}`}
              onClick={handleSignUp}
            >
              Create account
            </button>
          </div>

          <div key={mode} className="auth-panel auth-panel-animate">
            <div className="auth-intro">
              <p className="eyebrow auth-eyebrow">{isLogin ? "Welcome back" : "Get started"}</p>
              <h1 className="auth-title">{isLogin ? "Sign in to ParseAi" : "Create your account"}</h1>
              <p className="auth-subtitle">
                {isLogin
                  ? "Continue to your projects, interviews, and PRDs."
                  : "Create an account. An administrator must approve it before you can sign in."}
              </p>
            </div>

            {isLogin ? (
              <Login onLogin={login} />
            ) : (
              <Register onRegister={register} onPendingApproval={handleSignIn} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthPage;
