import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const CAR_IMAGE_URL =
  "https://ik.imagekit.io/cdsjgzx6p/mechaGo_customer_problems/photos/85tTK9n0J9LxzLyixceAP_dQfDfOyIQ?updatedAt=1779185838932";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate(`/${user.role}`);
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all credentials");
      return;
    }
    try {
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        navigate(`/${result.user.role}`);
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ─── Left Panel: Car Image ─── */}
      <div className="login-left">
        <img
          src={CAR_IMAGE_URL}
          alt="Premium sports car on dark road"
          className="login-car-img"
        />
        {/* Dark overlay */}
        <div className="login-left-overlay" />

        {/* Brand tag at bottom */}
        <div className="login-brand">
          <div className="login-brand-logo">
            {/* Wrench SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="login-brand-name">MechaGo</span>
          </div>
          <p className="login-brand-tagline">
            Technological assurance for the modern driver.<br />
            Experience rapid-response vehicle care at your fingertips.
          </p>
        </div>

        {/* Horizontal accent line at bottom of image */}
        <div className="login-left-line" />
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="login-right">
        {/* Secure Access badge */}
        <div className="login-secure-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          SECURE ACCESS
        </div>

        {/* Glass card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Enter your credentials to manage your fleet.</p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="lf-group">
              <label className="lf-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executive@mechago.com"
                required
                className="lf-input"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="lf-group">
              <div className="lf-label-row">
                <label className="lf-label" htmlFor="login-password">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Password
                </label>
                <button type="button" className="lf-forgot">Forgot Password?</button>
              </div>
              <div className="lf-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="lf-input lf-input-pw"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lf-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="lf-btn-primary"
            >
              {loading ? (
                <span className="lf-spinner" />
              ) : (
                <>
                  Secure Login
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="login-signup-text">
            New to MechaGo?{" "}
            <Link to="/register" className="login-signup-link">Sign Up</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <span>© 2024 MechaGo Engineering Ltd.</span>
          <div className="login-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
