import React, { useState } from "react";
import { showToast } from "../../utils/toast";
import PasswordInput from "./PasswordInput";

function Register({ onRegister, onPendingApproval }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onRegister(name, email, password);
      if (result?.pendingApproval) {
        showToast.success("Account submitted. You can sign in after admin approval.");
        onPendingApproval?.();
        return;
      }
      showToast.success("Account created!");
    } catch (err) {
      showToast.apiError(err, "Registration failed. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="register-name" className="label">
          Name
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="input"
          placeholder="Your name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-email" className="label">
          Email
        </label>
        <input
          id="register-email"
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
        <label htmlFor="register-password" className="label">
          Password
        </label>
        <PasswordInput
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block btn-lg auth-submit">
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

export default Register;
