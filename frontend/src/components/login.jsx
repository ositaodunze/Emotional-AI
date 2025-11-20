import React, { useState } from "react";
import "../auth.css";

export default function Login({ onSignUp, onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    // For now, just pretend login works
    alert(`Logged in as ${form.email}`);
    if (onLoginSuccess) onLoginSuccess(); // App can move to "connect" or something later
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Feed Music AI</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="you@school.edu"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>

          <button type="submit" className="auth-primary-btn">
            Sign In
          </button>
        </form>

        <button
          type="button"
          className="auth-link-btn"
          onClick={onSignUp}
        >
          Need an account? <span>Create one</span>
        </button>

        <p className="auth-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}


