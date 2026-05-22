import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wrench, Shield, Zap, MapPin, ArrowRight, Star, Clock, Users } from "lucide-react";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="lp-root">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="lp-hero">
        {/* Background glow orbs */}
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />

        <div className="lp-hero-inner">
          {/* Left: Headline & CTAs */}
          <div className="lp-hero-content">
            {/* Badge */}
            <div className="lp-badge">
              <Zap className="lp-badge-icon" />
              Rapid Response · 24/7 Network
            </div>

            <h1 className="lp-hero-title">
              Stranded on the Road?<br />
              <span className="lp-gold-text">Help Arrives in Minutes.</span>
            </h1>

            <p className="lp-hero-sub">
              MechaGo connects stranded motorists with certified, highly-rated mechanics in real-time. Track your responder live, get upfront flat-rate pricing, and stay safe.
            </p>

            <div className="lp-hero-actions">
              {user ? (
                <Link to={`/${user.role}`} className="lp-btn-primary">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="lp-btn-primary">
                    Get Emergency Help <ArrowRight size={16} />
                  </Link>
                  <Link to="/register" className="lp-btn-ghost">
                    Join as Mechanic
                  </Link>
                </>
              )}
            </div>

            {/* Trust row */}
            <div className="lp-trust-row">
              <div className="lp-trust-item">
                <span className="lp-trust-dot" />
                Live network active
              </div>
              <div className="lp-trust-sep" />
              <div className="lp-trust-item">No call centers · App-free</div>
              <div className="lp-trust-sep" />
              <div className="lp-trust-item">Admin-verified mechanics only</div>
            </div>
          </div>

          {/* Right: Visual Card */}
          <div className="lp-hero-visual">
            {/* Glass live map card */}
            <div className="lp-map-card">
              <div className="lp-map-card-header">
                <div className="lp-dots">
                  <span className="lp-dot lp-dot-red" />
                  <span className="lp-dot lp-dot-yellow" />
                  <span className="lp-dot lp-dot-green" />
                </div>
                <span className="lp-map-label">live_assistance_gateway</span>
              </div>

              {/* Animated map area */}
              <div className="lp-map-area">
                {/* Ping rings */}
                <div className="lp-ping-ring lp-ping-ring-1" />
                <div className="lp-ping-ring lp-ping-ring-2" />
                <div className="lp-ping-ring lp-ping-ring-3" />
                <div className="lp-ping-center">
                  <MapPin size={28} className="lp-ping-icon" />
                </div>
                <span className="lp-map-status">Locating Nearest Approved Responders...</span>
                {/* Mechanic blips */}
                <div className="lp-blip lp-blip-amber" style={{ top: "18%", right: "22%" }} />
                <div className="lp-blip lp-blip-gold" style={{ bottom: "28%", left: "18%" }} />
                <div className="lp-blip lp-blip-amber" style={{ top: "55%", right: "12%" }} />
              </div>

              {/* Stats footer */}
              <div className="lp-map-stats">
                <div className="lp-map-stat">
                  <Clock size={13} className="lp-map-stat-icon" />
                  <div>
                    <p className="lp-map-stat-val">12 Min</p>
                    <p className="lp-map-stat-label">Avg Arrival</p>
                  </div>
                </div>
                <div className="lp-map-stat-divider" />
                <div className="lp-map-stat">
                  <Users size={13} className="lp-map-stat-icon" />
                  <div>
                    <p className="lp-map-stat-val">450+</p>
                    <p className="lp-map-stat-label">Active Mechanics</p>
                  </div>
                </div>
                <div className="lp-map-stat-divider" />
                <div className="lp-map-stat">
                  <Star size={13} className="lp-map-stat-icon lp-icon-gold" />
                  <div>
                    <p className="lp-map-stat-val lp-gold-text-sm">4.92</p>
                    <p className="lp-map-stat-label">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════ */}
      <section className="lp-features">
        <div className="lp-section-tag">Platform Capabilities</div>
        <h2 className="lp-section-title">
          Everything You Need,{" "}
          <span className="lp-gold-text">Right When You Need It.</span>
        </h2>
        <p className="lp-section-sub">
          Built with real-time infrastructure to ensure the fastest, safest roadside experience possible.
        </p>

        <div className="lp-features-grid">
          {/* Feature 1 */}
          <div className="lp-feature-card">
            <div className="lp-feature-icon-wrap lp-icon-amber">
              <MapPin size={22} />
            </div>
            <h3 className="lp-feature-title">Precision Geotargeting</h3>
            <p className="lp-feature-desc">
              No need to know your address. Advanced browser geolocation pinpoints your exact coordinates and shares them instantly with the nearest mechanic.
            </p>
            <div className="lp-feature-rule" />
            <span className="lp-feature-tag">GPS · Live coords</span>
          </div>

          {/* Feature 2 */}
          <div className="lp-feature-card lp-feature-card-highlight">
            <div className="lp-feature-icon-wrap lp-icon-gold">
              <Wrench size={22} />
            </div>
            <h3 className="lp-feature-title">Verified Technicians</h3>
            <p className="lp-feature-desc">
              Every mechanic undergoes admin-controlled background checks and credential verification before their first job. Zero compromises.
            </p>
            <div className="lp-feature-rule lp-rule-gold" />
            <span className="lp-feature-tag lp-tag-gold">Admin-approved only</span>
          </div>

          {/* Feature 3 */}
          <div className="lp-feature-card">
            <div className="lp-feature-icon-wrap lp-icon-green">
              <Shield size={22} />
            </div>
            <h3 className="lp-feature-title">Secure Real-Time Ops</h3>
            <p className="lp-feature-desc">
              Persistent Socket.io connections broadcast requests instantly and power live Leaflet map tracking plus encrypted mechanic-customer chat.
            </p>
            <div className="lp-feature-rule" />
            <span className="lp-feature-tag">Socket.io · Leaflet</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      <section className="lp-stats-strip">
        <div className="lp-stats-grid">
          <div className="lp-stat-item">
            <span className="lp-stat-num">450<span className="lp-stat-plus">+</span></span>
            <span className="lp-stat-label">Verified Mechanics</span>
          </div>
          <div className="lp-stats-vline" />
          <div className="lp-stat-item">
            <span className="lp-stat-num">12<span className="lp-stat-unit"> min</span></span>
            <span className="lp-stat-label">Average Response Time</span>
          </div>
          <div className="lp-stats-vline" />
          <div className="lp-stat-item">
            <span className="lp-stat-num lp-stat-gold">4.92<span className="lp-stat-unit"> ★</span></span>
            <span className="lp-stat-label">Platform Rating</span>
          </div>
          <div className="lp-stats-vline" />
          <div className="lp-stat-item">
            <span className="lp-stat-num">24<span className="lp-stat-unit">/7</span></span>
            <span className="lp-stat-label">Always On Network</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA SECTION
      ══════════════════════════════════════════ */}
      <section className="lp-cta-section">
        <div className="lp-cta-card">
          <div className="lp-cta-orb" />
          <div className="lp-secure-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            SECURE · VERIFIED · INSTANT
          </div>
          <h2 className="lp-cta-title">
            Ready When the Worst Happens.
          </h2>
          <p className="lp-cta-sub">
            Join thousands of motorists who trust MechaGo for their roadside emergencies. Free to sign up, no subscription needed.
          </p>
          <div className="lp-cta-actions">
            <Link to="/register" className="lp-btn-primary">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="lp-btn-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
