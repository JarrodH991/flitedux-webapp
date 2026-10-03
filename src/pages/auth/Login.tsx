// ============================================================================
// src/pages/auth/Login.tsx
//
// Platform sign-in page. Used for everything on Flitedux — courses, exams,
// certifications.
//
// Two steps:
//   1. Email + password
//   2. MFA challenge (only if the user's account has MFA enabled)
//
// Also supports:
//   - Social login: Google, Apple, Facebook
//   - "Forgot password?" link
//   - "Create an account" link
//   - "Password reset successful" banner via ?reset=success
//
// 🔌 AWS: Calls Cognito signIn / confirmSignIn. Social buttons redirect
//         to the Cognito Hosted UI.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import type { SocialProvider } from '../../types/auth.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-login-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  animation: fxLoginIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxLoginIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.fx-login-logo-tile {
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
.fx-login-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.fx-login-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-login-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  text-align: center;
  margin-bottom: 6px;
}
.fx-login-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.25;
}
.fx-login-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 28px;
  line-height: 1.5;
}

.fx-login-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.fx-login-input {
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
.fx-login-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-login-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}
.fx-login-input.mfa-code {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 12px;
  padding: 14px;
  font-family: 'Courier New', monospace;
}

.fx-login-field {
  margin-bottom: 16px;
}

.fx-login-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.fx-login-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}
.fx-login-remember input {
  cursor: pointer;
}
.fx-login-forgot {
  font-size: 0.85rem;
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-login-forgot:hover {
  text-decoration: underline;
}

.fx-login-error {
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
  animation: fxLoginShake 0.4s ease both;
}
@keyframes fxLoginShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.fx-login-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-login-success {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-size: 0.88rem;
  line-height: 1.5;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 18px;
}
.fx-login-success-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-login-submit {
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
.fx-login-submit:hover:not(:disabled),
.fx-login-submit:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-login-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.fx-login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fx-login-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxLoginSpin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes fxLoginSpin { to { transform: rotate(360deg); } }

.fx-login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fx-login-divider::before,
.fx-login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.fx-login-social {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 20px;
}
@media (min-width: 480px) {
  .fx-login-social {
    grid-template-columns: repeat(3, 1fr);
  }
}

.fx-login-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-login-social-btn:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.08);
}
.fx-login-social-btn:focus-visible {
  outline: 2px solid #d95300;
  outline-offset: 2px;
}
.fx-login-social-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fx-login-social-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fx-login-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
.fx-login-footer a {
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-login-footer a:hover { text-decoration: underline; }

.fx-login-mfa-meta {
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
.fx-login-mfa-destination {
  font-weight: 600;
  color: #334155;
}
.fx-login-mfa-attempts {
  color: #94a3b8;
}
.fx-login-mfa-attempts.low {
  color: #dc2626;
  font-weight: 700;
}

.fx-login-back {
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
.fx-login-back:hover { color: #d95300; }
.fx-login-back:disabled { opacity: 0.5; cursor: not-allowed; }

.fx-login-dev-panel {
  margin-top: 20px;
  padding: 14px;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.6;
}
.fx-login-dev-title {
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fx-login-dev-row {
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
.fx-login-dev-row:hover { color: #b45309; }
.fx-login-dev-role {
  font-weight: 700;
  text-transform: capitalize;
}
.fx-login-dev-fill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #b45309;
  opacity: 0.7;
}
`;

// ---------------------------------------------------------------------------
// SOCIAL ICONS
//
// Small inline SVGs for the three providers. No icon library needed.
// ---------------------------------------------------------------------------

const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.835.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);

const AppleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#000000"
      d="M13.75 9.55c-.02-2.13 1.74-3.15 1.82-3.2-1-1.45-2.55-1.65-3.1-1.67-1.32-.13-2.57.78-3.24.78-.67 0-1.7-.76-2.79-.74-1.43.02-2.75.83-3.49 2.11-1.49 2.58-.38 6.4 1.07 8.49.71 1.02 1.56 2.17 2.67 2.13 1.07-.04 1.47-.69 2.77-.69 1.29 0 1.66.69 2.79.67 1.15-.02 1.88-1.04 2.58-2.07.82-1.19 1.15-2.34 1.17-2.4-.03-.01-2.24-.86-2.26-3.4zM11.65 3.2c.59-.71.99-1.71.88-2.7-.85.03-1.88.57-2.48 1.28-.55.63-1.02 1.65-.89 2.62.95.07 1.9-.48 2.49-1.2z"
    />
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#1877F2"
      d="M18 9.055C18 4.055 13.97 0 9 0S0 4.055 0 9.055C0 13.57 3.29 17.317 7.594 18v-6.329H5.309V9.055h2.285V7.061c0-2.27 1.34-3.524 3.393-3.524.983 0 2.011.176 2.011.176v2.226h-1.133c-1.116 0-1.464.697-1.464 1.413v1.703h2.492l-.398 2.616h-2.094V18C14.71 17.317 18 13.57 18 9.055z"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    state,
    user,
    error,
    pendingMfa,
    login,
    verifyMfa,
    loginWithSocial,
    clearError,
    resetAuthFlow,
  } = useAuth();

  // Password reset success banner
  const resetSuccess = searchParams.get('reset') === 'success';

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [socialBusy, setSocialBusy] = useState<SocialProvider | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const mfaInputRef = useRef<HTMLInputElement>(null);

  // Already authenticated → redirect to dashboard (or `from`)
  useEffect(() => {
    if (state === 'authenticated' && user) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
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

  // Clear errors when the user edits a field
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, mfaCode]);

  // Handle step 1 — submit credentials
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    void login(email.trim(), password, rememberMe);
  };

  // Handle step 2 — submit MFA code
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(mfaCode)) return;
    void verifyMfa(mfaCode);
  };

  // Handle "back to login" from MFA step
  const handleBackToLogin = () => {
    setMfaCode('');
    resetAuthFlow();
  };

  // Handle social login
  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialBusy(provider);
    try {
      // In dev, this resolves after ~1.5s and logs the user in.
      // In production, this redirects the browser to Cognito — the
      // setSocialBusy state never gets cleared because the page navigates.
      await loginWithSocial(provider);
    } finally {
      setSocialBusy(null);
    }
  };

  // Dev helper — fill credentials from the panel
  const fillDevCredentials = (
    role: 'candidate' | 'instructor' | 'admin' | 'auditor',
  ) => {
    const emails: Record<typeof role, string> = {
      candidate: 'candidate@test.com',
      instructor: 'instructor@test.com',
      admin: 'admin@test.com',
      auditor: 'auditor@test.com',
    };
    setEmail(emails[role]);
    setPassword(`${role}123`);
    clearError();
  };

  const isBusy = state === 'authenticating';
  const showMfa = state === 'awaiting-mfa' && pendingMfa;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fx-login-page">
      <style>{pageCss}</style>

      <div className="fx-login-card">
        {/* Brand header */}
        <div className="fx-login-logo">
          <div className="fx-login-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-login-brand">Flitedux</span>
        </div>

        <div className="fx-login-eyebrow">Welcome back</div>

        {/* ================= STEP 1 — LOGIN ================= */}
        {!showMfa && (
          <>
            <h1 className="fx-login-title">Sign in to your account</h1>
            <p className="fx-login-subtitle">
              Access your courses, exams, and certifications.
            </p>

            {resetSuccess && (
              <div className="fx-login-success" role="status">
                <span className="fx-login-success-icon">✓</span>
                <span>
                  Your password has been reset. Please sign in with your new
                  password.
                </span>
              </div>
            )}

            {error && (
              <div className="fx-login-error" role="alert">
                <span className="fx-login-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="fx-login-field">
                <label htmlFor="fx-login-email" className="fx-login-label">
                  Email address
                </label>
                <input
                  id="fx-login-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="fx-login-input"
                  disabled={isBusy || socialBusy !== null}
                  required
                />
              </div>

              <div className="fx-login-field">
                <label htmlFor="fx-login-password" className="fx-login-label">
                  Password
                </label>
                <input
                  id="fx-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="fx-login-input"
                  disabled={isBusy || socialBusy !== null}
                  required
                />
              </div>

              <div className="fx-login-row">
                <label className="fx-login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isBusy || socialBusy !== null}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="fx-login-forgot">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="fx-login-submit"
                disabled={
                  isBusy || socialBusy !== null || !email.trim() || !password
                }
              >
                {isBusy && <span className="fx-login-spinner" />}
                {isBusy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* ============ SOCIAL LOGIN ============ */}
            <div className="fx-login-divider">Or continue with</div>

            <div className="fx-login-social">
              <button
                type="button"
                className="fx-login-social-btn"
                onClick={() => handleSocialLogin('google')}
                disabled={isBusy || socialBusy !== null}
              >
                <span className="fx-login-social-icon">
                  {socialBusy === 'google' ? (
                    <span className="fx-login-spinner" style={{ borderTopColor: '#d95300', borderColor: 'rgba(217, 83, 0, 0.2)' }} />
                  ) : (
                    <GoogleIcon />
                  )}
                </span>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="fx-login-social-btn"
                onClick={() => handleSocialLogin('apple')}
                disabled={isBusy || socialBusy !== null}
              >
                <span className="fx-login-social-icon">
                  {socialBusy === 'apple' ? (
                    <span className="fx-login-spinner" style={{ borderTopColor: '#d95300', borderColor: 'rgba(217, 83, 0, 0.2)' }} />
                  ) : (
                    <AppleIcon />
                  )}
                </span>
                <span>Apple</span>
              </button>
              <button
                type="button"
                className="fx-login-social-btn"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isBusy || socialBusy !== null}
              >
                <span className="fx-login-social-icon">
                  {socialBusy === 'facebook' ? (
                    <span className="fx-login-spinner" style={{ borderTopColor: '#d95300', borderColor: 'rgba(217, 83, 0, 0.2)' }} />
                  ) : (
                    <FacebookIcon />
                  )}
                </span>
                <span>Facebook</span>
              </button>
            </div>

            <div className="fx-login-footer">
              Don't have an account? <Link to="/signup">Create one</Link>
            </div>

            {/* ============ DEV CREDENTIALS PANEL ============ */}
            {import.meta.env.DEV && (
              <div className="fx-login-dev-panel">
                <div className="fx-login-dev-title">🔧 Dev credentials</div>
                <div style={{ marginBottom: 6, opacity: 0.8 }}>
                  Click any role to auto-fill. MFA code: <strong>123456</strong>
                </div>
                {(['candidate', 'instructor', 'admin', 'auditor'] as const).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      className="fx-login-dev-row"
                      onClick={() => fillDevCredentials(role)}
                    >
                      <span className="fx-login-dev-role">{role}</span>
                      <span className="fx-login-dev-fill">click to fill →</span>
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
            <h1 className="fx-login-title">Verify your identity</h1>
            <p className="fx-login-subtitle">
              Enter the 6-digit code from your authenticator app.
            </p>

            <div className="fx-login-mfa-meta">
              <span>
                Sent to:{' '}
                <span className="fx-login-mfa-destination">
                  {pendingMfa.destination}
                </span>
              </span>
              <span
                className={
                  'fx-login-mfa-attempts' +
                  (pendingMfa.attemptsRemaining <= 1 ? ' low' : '')
                }
              >
                {pendingMfa.attemptsRemaining} attempts left
              </span>
            </div>

            {error && (
              <div className="fx-login-error" role="alert">
                <span className="fx-login-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleMfaSubmit} noValidate>
              <div className="fx-login-field">
                <label htmlFor="fx-login-mfa" className="fx-login-label">
                  6-digit code
                </label>
                <input
                  id="fx-login-mfa"
                  ref={mfaInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="123456"
                  className="fx-login-input mfa-code"
                  disabled={isBusy}
                  required
                />
              </div>

              <button
                type="submit"
                className="fx-login-submit"
                disabled={isBusy || mfaCode.length !== 6}
              >
                {isBusy && <span className="fx-login-spinner" />}
                {isBusy ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>

            <button
              type="button"
              className="fx-login-back"
              onClick={handleBackToLogin}
              disabled={isBusy}
            >
              ← Back to sign in
            </button>

            {import.meta.env.DEV && (
              <div className="fx-login-dev-panel">
                <div className="fx-login-dev-title">🔧 Dev MFA</div>
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