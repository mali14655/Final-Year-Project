import React, { useState } from "react";
import { showToast } from "../../utils/toast";
import PasswordInput from "./PasswordInput";

function Login({ onLogin }) {
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
      showToast.apiError(err, "Login failed. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="login-email" className="label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div className="form-group auth-form-field-last">
        <label htmlFor="login-password" className="label">
          Password
        </label>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Your password"
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block btn-lg auth-submit">
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default Login;
