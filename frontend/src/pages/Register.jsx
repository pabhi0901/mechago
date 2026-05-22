import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Upload } from "lucide-react";

const CAR_IMAGE_URL =
  "https://ik.imagekit.io/cdsjgzx6p/mechaGo_customer_problems/photos/85tTK9n0J9LxzLyixceAP_dQfDfOyIQ?updatedAt=1779185838932";

const Register = () => {
  const { registerCustomer, registerMechanic, user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  React.useEffect(() => {
    if (user) navigate(`/${user.role}`);
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !email || !phone || !password) {
      setError("Please complete all required fields");
      return;
    }
    if (phone.length < 10 || phone.length > 15) {
      setError("Phone number must be between 10 and 15 digits");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (role === "mechanic" && (!upiId || !upiName)) {
      setError("UPI ID and UPI Holder Name are required for Mechanic Registration");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("password", password);
    formData.append("role", role);
    if (imageFile) formData.append("image", imageFile);
    if (role === "mechanic") {
      formData.append("upiId", upiId.trim());
      formData.append("upiName", upiName.trim());
    }

    try {
      setLoading(true);
      if (role === "customer") {
        const result = await registerCustomer(formData);
        if (result.success) {
          setSuccessMsg("Customer account registered successfully!");
          setTimeout(() => navigate("/customer"), 1500);
        } else {
          setError(result.message);
        }
      } else {
        const result = await registerMechanic(formData);
        if (result.success) {
          setSuccessMsg(
            result.message || "Registration applied! Waiting for admin approval."
          );
          setName(""); setEmail(""); setPhone(""); setPassword("");
          setUpiId(""); setUpiName(""); setImageFile(null); setImagePreview(null);
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError("An unexpected error occurred during signup");
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
        <div className="login-left-overlay" />

        <div className="login-brand">
          <div className="login-brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="login-brand-name">MechaGo</span>
          </div>
          <p className="login-brand-tagline">
            {role === "customer"
              ? "Emergency roadside diagnostics, at your exact location."
              : "Deliver professional roadside service on your schedule."}
          </p>
        </div>

        <div className="login-left-line" />
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="login-right">
        {/* Secure Access badge */}
        <div className="login-secure-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          CREATE ACCOUNT
        </div>

        {/* Glass card */}
        <div className="login-card reg-card">
          <div className="login-card-header">
            <h1 className="login-title">Join MechaGo</h1>
            <p className="login-subtitle">Register to access the rapid vehicle assistance network.</p>
          </div>

          {/* Role tabs */}
          <div className="reg-role-tabs">
            <button
              type="button"
              className={`reg-role-tab ${role === "customer" ? "reg-role-tab--active" : ""}`}
              onClick={() => { setRole("customer"); setError(""); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Customer
            </button>
            <button
              type="button"
              className={`reg-role-tab ${role === "mechanic" ? "reg-role-tab--active" : ""}`}
              onClick={() => { setRole("mechanic"); setError(""); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Mechanic
            </button>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="login-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Avatar */}
            <div className="reg-avatar-row">
              <div className="reg-avatar-circle">
                {imagePreview ? (
                  <img src={imagePreview} alt="Avatar preview" className="reg-avatar-img" />
                ) : (
                  <Upload size={20} color="#6b7a99" />
                )}
              </div>
              <div className="reg-avatar-info">
                <span className="reg-avatar-label">Profile Photo</span>
                <label className="reg-avatar-upload-btn">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div className="lf-group">
              <label className="lf-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="lf-input"
              />
            </div>

            {/* Email */}
            <div className="lf-group">
              <label className="lf-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="lf-input"
                autoComplete="email"
              />
            </div>

            {/* Phone */}
            <div className="lf-group">
              <label className="lf-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.56 4.9 2 2 0 0 1 3.54 2.72h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +919876543210"
                required
                className="lf-input"
              />
            </div>

            {/* Password */}
            <div className="lf-group">
              <label className="lf-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Password
              </label>
              <div className="lf-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="lf-input lf-input-pw"
                  autoComplete="new-password"
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

            {/* Mechanic UPI fields */}
            {role === "mechanic" && (
              <div className="reg-upi-box">
                <div className="reg-upi-title">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Payout / UPI Details
                </div>
                <div className="reg-upi-grid">
                  <div className="lf-group" style={{ marginBottom: 0 }}>
                    <label className="lf-label">UPI Address (ID)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. name@okaxis"
                      required
                      className="lf-input"
                    />
                  </div>
                  <div className="lf-group" style={{ marginBottom: 0 }}>
                    <label className="lf-label">UPI Holder Name</label>
                    <input
                      type="text"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="lf-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="lf-btn-primary"
            >
              {loading ? (
                <span className="lf-spinner" />
              ) : (
                <>
                  {role === "customer" ? "Create Account" : "Apply as Mechanic"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-signup-text">
            Already have an account?{" "}
            <Link to="/login" className="login-signup-link">Sign In</Link>
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

export default Register;
