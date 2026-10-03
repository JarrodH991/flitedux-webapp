// ============================================================================
// src/pages/auth/Signup.tsx
//
// Platform signup page. Used for everything on Flitedux — courses, quizzes,
// exams, certifications.
//
// Two steps in one component:
//   1. Enter name, email, password, accept terms
//   2. Enter the verification code sent by email
//
// On successful verification, the user is logged in directly and sent to
// the dashboard.
//
// 🔌 AWS: Step 1 calls Cognito SignUp. Step 2 calls Cognito ConfirmSignUp.
//         Email is delivered by SES.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-signup-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-signup-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  animation: fxSignupIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxSignupIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-signup-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.fx-signup-logo-tile {
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
.fx-signup-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.fx-signup-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-signup-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  text-align: center;
  margin-bottom: 6px;
}
.fx-signup-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.25;
}
.fx-signup-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 28px;
  line-height: 1.5;
}

.fx-signup-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.fx-signup-input {
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
.fx-signup-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-signup-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}
.fx-signup-input.mfa-code {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 12px;
  padding: 14px;
  font-family: 'Courier New', monospace;
}

.fx-signup-field {
  margin-bottom: 16px;
}

.fx-signup-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 5px;
  line-height: 1.45;
}

.fx-signup-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 16px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.fx-signup-checkbox:hover {
  border-color: #fdba74;
  background: #fffbf7;
}
.fx-signup-checkbox input {
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
}
.fx-signup-checkbox a {
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-signup-checkbox a:hover {
  text-decoration: underline;
}

.fx-signup-error {
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
  animation: fxSignupShake 0.4s ease both;
}
@keyframes fxSignupShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.fx-signup-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-signup-submit {
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
.fx-signup-submit:hover:not(:disabled),
.fx-signup-submit:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-signup-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.fx-signup-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fx-signup-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxSignupSpin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes fxSignupSpin { to { transform: rotate(360deg); } }

.fx-signup-back {
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
.fx-signup-back:hover { color: #d95300; }
.fx-signup-back:disabled { opacity: 0.5; cursor: not-allowed; }

.fx-signup-footer {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
.fx-signup-footer a {
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-signup-footer a:hover { text-decoration: underline; }

.fx-signup-mfa-meta {
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
.fx-signup-mfa-destination {
  font-weight: 600;
  color: #334155;
}

.fx-signup-resend {
  background: none;
  border: none;
  color: #d95300;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.fx-signup-resend:hover { color: #b54400; }
.fx-signup-resend:disabled { opacity: 0.5; cursor: not-allowed; }

.fx-signup-dev-panel {
  margin-top: 20px;
  padding: 12px 14px;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.5;
}
.fx-signup-dev-title {
  font-weight: 700;
  margin-bottom: 4px;
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    user,
    error,
    pendingSignupEmail,
    signup,
    confirmSignup,
    resendSignupCode,
    clearError,
    resetAuthFlow,
  } = useAuth();

  // ---- Form state (step 1) ----
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ---- Form state (step 2) ----
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ---- Refs ----
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // ---- Redirect on success ----
  useEffect(() => {
    if (state === 'authenticated' && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [state, user, navigate]);

  // ---- Autofocus the right input based on step ----
  useEffect(() => {
    if (state === 'awaiting-email-verification') {
      codeInputRef.current?.focus();
    } else {
      nameInputRef.current?.focus();
    }
  }, [state]);

  // ---- Clear errors when the user edits fields ----
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, email, password, confirmPassword, acceptedTerms, verificationCode]);

  // ---- Resend cooldown ticker ----
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ---- Client-side validation ----
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const emailLooksValid = /\S+@\S+\.\S+/.test(email);
  const nameFilled = displayName.trim().length > 0;

  const canSubmitSignup =
    nameFilled &&
    emailLooksValid &&
    passwordLongEnough &&
    passwordsMatch &&
    acceptedTerms;

  // ---- Step 1 submit ----
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitSignup) return;

    void signup({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      acceptedTerms,
    });
  };

  // ---- Step 2 submit ----
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) return;
    void confirmSignup(verificationCode);
  };

  // ---- Resend the code ----
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await resendSignupCode();
    setResendCooldown(60);
  };

  // ---- Back to step 1 ----
  const handleBackToSignup = () => {
    setVerificationCode('');
    resetAuthFlow();
  };

  // ---- Computed flags ----
  const isBusy = state === 'authenticating';
  const showVerification = state === 'awaiting-email-verification';

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fx-signup-page">
      <style>{pageCss}</style>

      <div className="fx-signup-card">
        {/* Brand header */}
        <div className="fx-signup-logo">
          <div className="fx-signup-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-signup-brand">Flitedux</span>
        </div>

        <div className="fx-signup-eyebrow">Create your account</div>

        {/* ================= STEP 1 — SIGNUP FORM ================= */}
        {!showVerification && (
          <>
            <h1 className="fx-signup-title">Join Flitedux</h1>
            <p className="fx-signup-subtitle">
              One account for courses, exams, and certifications.
            </p>

            {error && (
              <div className="fx-signup-error" role="alert">
                <span className="fx-signup-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} noValidate>
              <div className="fx-signup-field">
                <label htmlFor="fx-signup-name" className="fx-signup-label">
                  Full name
                </label>
                <input
                  id="fx-signup-name"
                  ref={nameInputRef}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="fx-signup-input"
                  disabled={isBusy}
                  required
                />
              </div>

              <div className="fx-signup-field">
                <label htmlFor="fx-signup-email" className="fx-signup-label">
                  Email address
                </label>
                <input
                  id="fx-signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="fx-signup-input"
                  disabled={isBusy}
                  required
                />
                {email.length > 0 && !emailLooksValid && (
                  <div className="fx-signup-hint" style={{ color: '#dc2626' }}>
                    Please enter a valid email address.
                  </div>
                )}
              </div>

              <div className="fx-signup-field">
                <label htmlFor="fx-signup-password" className="fx-signup-label">
                  Password
                </label>
                <input
                  id="fx-signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="fx-signup-input"
                  disabled={isBusy}
                  required
                />
                {password.length > 0 && !passwordLongEnough && (
                  <div className="fx-signup-hint" style={{ color: '#dc2626' }}>
                    Password must be at least 8 characters.
                  </div>
                )}
              </div>

              <div className="fx-signup-field">
                <label htmlFor="fx-signup-confirm" className="fx-signup-label">
                  Confirm password
                </label>
                <input
                  id="fx-signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="fx-signup-input"
                  disabled={isBusy}
                  required
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <div className="fx-signup-hint" style={{ color: '#dc2626' }}>
                    Passwords do not match.
                  </div>
                )}
              </div>

              <label className="fx-signup-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={isBusy}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                className="fx-signup-submit"
                disabled={isBusy || !canSubmitSignup}
              >
                {isBusy && <span className="fx-signup-spinner" />}
                {isBusy ? 'Creating your account…' : 'Create account'}
              </button>
            </form>

            <div className="fx-signup-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>

            {import.meta.env.DEV && (
              <div className="fx-signup-dev-panel">
                <div className="fx-signup-dev-title">🔧 Dev mode</div>
                <div>
                  Fill in any valid email + password. The verification code
                  will be printed to the browser console as{' '}
                  <strong>123456</strong>.
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= STEP 2 — VERIFICATION ================= */}
        {showVerification && (
          <>
            <h1 className="fx-signup-title">Verify your email</h1>
            <p className="fx-signup-subtitle">
              We sent a 6-digit code to your inbox. Enter it below to finish
              creating your account.
            </p>

            <div className="fx-signup-mfa-meta">
              <span>
                Sent to:{' '}
                <span className="fx-signup-mfa-destination">
                  {pendingSignupEmail ?? email}
                </span>
              </span>
              {resendCooldown > 0 ? (
                <span>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="fx-signup-resend"
                  onClick={handleResend}
                  disabled={isBusy}
                >
                  Resend code
                </button>
              )}
            </div>

            {error && (
              <div className="fx-signup-error" role="alert">
                <span className="fx-signup-error-icon">⚠</span>
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} noValidate>
              <div className="fx-signup-field">
                <label htmlFor="fx-signup-code" className="fx-signup-label">
                  6-digit code
                </label>
                <input
                  id="fx-signup-code"
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="123456"
                  className="fx-signup-input mfa-code"
                  disabled={isBusy}
                  required
                />
              </div>

              <button
                type="submit"
                className="fx-signup-submit"
                disabled={isBusy || verificationCode.length !== 6}
              >
                {isBusy && <span className="fx-signup-spinner" />}
                {isBusy ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>

            <button
              type="button"
              className="fx-signup-back"
              onClick={handleBackToSignup}
              disabled={isBusy}
            >
              ← Back to signup
            </button>

            {import.meta.env.DEV && (
              <div className="fx-signup-dev-panel">
                <div className="fx-signup-dev-title">🔧 Dev mode</div>
                <div>
                  Use code <strong>123456</strong> to complete verification.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};