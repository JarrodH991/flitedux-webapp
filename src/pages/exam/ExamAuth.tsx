// ============================================================================
// src/pages/exam/ExamAuth.tsx
//
// The login screen for the exam system. Handles both steps:
//   1. Email + password
//   2. MFA challenge (6-digit code)
//
// On successful login it navigates to /exam/dashboard.
//
// Styling matches the Flitedux brand (orange accent, light background) but
// with a slightly more clinical feel — this is the entry point to a
// high-stakes system, and it should feel that way without being cold.
//
// 🔌 AWS: The actual authentication happens inside AuthContext → services/api.
//         This file just renders the UI and calls the context methods.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import { DEV_PASSWORDS } from '../../data/dev/devUsers';

// ---------------------------------------------------------------------------
// STYLES (kept as a template string so we can drop them in with <style>)
// ---------------------------------------------------------------------------

const pageCss = `
.fx-auth-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-auth-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  animation: fxAuthIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

@keyframes fxAuthIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.fx-auth-logo-tile {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #d95300, #b54400);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.fx-auth-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}

.fx-auth-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-auth-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  text-align: center;
  margin-bottom: 6px;
}

.fx-auth-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.25;
}

.fx-auth-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 28px;
  line-height: 1.5;
}

.fx-auth-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.fx-auth-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.fx-auth-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-auth-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.fx-auth-field {
  margin-bottom: 18px;
}

.fx-auth-mfa-code {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 12px;
  padding: 14px;
  font-family: 'Courier New', monospace;
}

.fx-auth-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.88rem;
  line-height: 1.5;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 18px;
  animation: fxAuthShake 0.4s ease both;
}

@keyframes fxAuthShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}

.fx-auth-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-auth-submit {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 13px 20px;
  background: #d95300;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.fx-auth-submit:hover:not(:disabled),
.fx-auth-submit:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-auth-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.fx-auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fx-auth-back {
  display: block;
  width: 100%;
  text-align: center;
  background: none;
  border: none;
  padding: 12px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  margin-top: 10px;
  transition: color 0.2s ease;
}
.fx-auth-back:hover { color: #d95300; }

.fx-auth-mfa-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 20px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.fx-auth-mfa-destination {
  font-weight: 600;
  color: #334155;
}

.fx-auth-mfa-attempts {
  color: #94a3b8;
}
.fx-auth-mfa-attempts.low { color: #dc2626; font-weight: 700; }

/* Dev credentials panel */
.fx-auth-dev-panel {
  margin-top: 24px;
  padding: 14px;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.6;
}
.fx-auth-dev-title {
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fx-auth-dev-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  transition: color 0.15s ease;
  border: none;
  background: none;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  width: 100%;
  text-align: left;
}
.fx-auth-dev-row:hover { color: #b45309; }
.fx-auth-dev-role {
  font-weight: 700;
  text-transform: capitalize;
}
.fx-auth-dev-fill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #b45309;
  opacity: 0.7;
}

.fx-auth-loading {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxAuthSpin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes fxAuthSpin { to { transform: rotate(360deg); } }
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ExamAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, user, error, pendingMfa, login, verifyMfa, clearError, resetAuthFlow } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const mfaInputRef = useRef<HTMLInputElement>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (state === 'authenticated' && user) {
      // Where were we trying to go? (set by ProtectedRoute, if we have one)
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/exam/dashboard', { replace: true });
    }
  }, [state, user, navigate, location.state]);

  // Autofocus the right input depending on which step we're on
  useEffect(() => {
    if (state === 'awaiting-mfa') {
      mfaInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [state]);

  // Clear any stale error when the user edits a field
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, mfaCode]);

  // Handle step 1 — submit credentials
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    login(email.trim(), password, rememberMe);
  };

  // Handle step 2 — submit MFA code
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(mfaCode)) return;
    verifyMfa(mfaCode);
  };

  // Handle "back to login" from MFA step
  const handleBackToLogin = () => {
    setMfaCode('');
    resetAuthFlow();
  };

  // Dev helper — fill credentials from the panel
  const fillDevCredentials = (role: 'candidate' | 'instructor' | 'admin' | 'auditor') => {
    const emails: Record<typeof role, string> = {
      candidate: 'candidate@test.com',
      instructor: 'instructor@test.com',
      admin: 'admin@test.com',
      auditor: 'auditor@test.com',
    };
    setEmail(emails[role]);
    setPassword(DEV_PASSWORDS[role]);
    clearError();
  };

  const isBusy = state === 'authenticating';
  const showMfa = state === 'awaiting-mfa' && pendingMfa;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fx-auth-page">
      <style>{pageCss}</style>

      <div className="fx-auth-card">
        {/* Brand header */}
        <div className="fx-auth-logo">
          <div className="fx-auth-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-auth-brand">Flitedux</span>
        </div>

        <div className="fx-auth-eyebrow">Exam Portal</div>

        {/* ================= STEP 1 — LOGIN ================= */}
        {!showMfa && (
          <>
            <h1 className="fx-auth-title">Sign in to your account</h1>
            <p className="fx-auth-subtitle">
              Access your exams, results, and certifications.
            </p>

            {error && (
              <div className="fx-auth-error" role="alert">
                <span className="fx-auth-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="fx-auth-field">
                <label htmlFor="fx-email" className="fx-auth-label">
                  Email address
                </label>
                <input
                  id="fx-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="fx-auth-input"
                  disabled={isBusy}
                  required
                />
              </div>

              <div className="fx-auth-field">
                <label htmlFor="fx-password" className="fx-auth-label">
                  Password
                </label>
                <input
                  id="fx-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="fx-auth-input"
                  disabled={isBusy}
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <input
                  id="fx-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isBusy}
                  style={{ cursor: 'pointer' }}
                />
                <label
                  htmlFor="fx-remember"
                  style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}
                >
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                className="fx-auth-submit"
                disabled={isBusy || !email.trim() || !password}
              >
                {isBusy && <span className="fx-auth-loading" />}
                {isBusy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: '0.85rem' }}>
              <Link
                to="/contact"
                style={{ color: '#64748b', textDecoration: 'none' }}
              >
                Need an account? Contact us →
              </Link>
            </div>

            {/* ============ DEV CREDENTIALS PANEL ============ */}
            {/* Only renders in dev (import.meta.env.DEV is false in production builds) */}
            {import.meta.env.DEV && (
              <div className="fx-auth-dev-panel">
                <div className="fx-auth-dev-title">🔧 Dev credentials</div>
                <div style={{ marginBottom: 6, opacity: 0.8 }}>
                  Click any role to auto-fill. MFA code: <strong>123456</strong>
                </div>
                {(['candidate', 'instructor', 'admin', 'auditor'] as const).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      className="fx-auth-dev-row"
                      onClick={() => fillDevCredentials(role)}
                    >
                      <span className="fx-auth-dev-role">{role}</span>
                      <span className="fx-auth-dev-fill">click to fill →</span>
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* ================= STEP 2 — MFA ================= */}
        {showMfa && (
          <>
            <h1 className="fx-auth-title">Verify your identity</h1>
            <p className="fx-auth-subtitle">
              Enter the 6-digit code from your authenticator app.
            </p>

            <div className="fx-auth-mfa-meta">
              <span>
                Sent to: <span className="fx-auth-mfa-destination">{pendingMfa.destination}</span>
              </span>
              <span
                className={
                  'fx-auth-mfa-attempts' +
                  (pendingMfa.attemptsRemaining <= 1 ? ' low' : '')
                }
              >
                {pendingMfa.attemptsRemaining} attempts left
              </span>
            </div>

            {error && (
              <div className="fx-auth-error" role="alert">
                <span className="fx-auth-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleMfaSubmit} noValidate>
              <div className="fx-auth-field">
                <label htmlFor="fx-mfa" className="fx-auth-label">
                  6-digit code
                </label>
                <input
                  id="fx-mfa"
                  ref={mfaInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="fx-auth-input fx-auth-mfa-code"
                  disabled={isBusy}
                  required
                />
              </div>

              <button
                type="submit"
                className="fx-auth-submit"
                disabled={isBusy || mfaCode.length !== 6}
              >
                {isBusy && <span className="fx-auth-loading" />}
                {isBusy ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>

            <button
              type="button"
              className="fx-auth-back"
              onClick={handleBackToLogin}
              disabled={isBusy}
            >
              ← Back to sign in
            </button>

            {/* Dev hint for MFA code */}
            {import.meta.env.DEV && (
              <div className="fx-auth-dev-panel">
                <div className="fx-auth-dev-title">🔧 Dev MFA</div>
                <div>
                  Any 6-digit code starting with <strong>1</strong> will pass.
                  E.g. <strong>123456</strong>, <strong>111111</strong>.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};