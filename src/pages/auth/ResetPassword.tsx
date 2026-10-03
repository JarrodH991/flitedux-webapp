// ============================================================================
// src/pages/auth/ResetPassword.tsx
//
// Step 2 of password reset: the user enters the code they received plus
// a new password.
//
// Reads the pending email from AuthContext (set by ForgotPassword.tsx).
// If no reset is pending, redirects back to /forgot-password.
//
// On success, redirects to /login with a success indicator.
//
// 🔌 AWS: Calls Cognito confirmForgotPassword({ username, confirmationCode,
//         newPassword }).
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-rp-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-rp-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  animation: fxRpIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxRpIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-rp-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.fx-rp-logo-tile {
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
.fx-rp-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.fx-rp-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-rp-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  text-align: center;
  margin-bottom: 6px;
}
.fx-rp-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.25;
}
.fx-rp-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.5;
}

.fx-rp-email-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
  color: #64748b;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 22px;
}
.fx-rp-email-value {
  font-weight: 600;
  color: #334155;
  word-break: break-all;
}
.fx-rp-change-link {
  color: #d95300;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.fx-rp-change-link:hover {
  text-decoration: underline;
}

.fx-rp-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.fx-rp-input {
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
.fx-rp-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-rp-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}
.fx-rp-input.mfa-code {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 12px;
  padding: 14px;
  font-family: 'Courier New', monospace;
}

.fx-rp-field {
  margin-bottom: 16px;
}

.fx-rp-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 5px;
  line-height: 1.45;
}

.fx-rp-error {
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
  animation: fxRpShake 0.4s ease both;
}
@keyframes fxRpShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.fx-rp-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-rp-submit {
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
.fx-rp-submit:hover:not(:disabled),
.fx-rp-submit:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-rp-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.fx-rp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fx-rp-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxRpSpin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes fxRpSpin { to { transform: rotate(360deg); } }

.fx-rp-footer {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
.fx-rp-footer a {
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-rp-footer a:hover { text-decoration: underline; }

.fx-rp-password-strength {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
.fx-rp-strength-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}
.fx-rp-strength-bar.filled.weak   { background: #dc2626; }
.fx-rp-strength-bar.filled.medium { background: #f59e0b; }
.fx-rp-strength-bar.filled.strong { background: #16a34a; }

.fx-rp-strength-label {
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 5px;
}
.fx-rp-strength-label.weak   { color: #dc2626; }
.fx-rp-strength-label.medium { color: #b45309; }
.fx-rp-strength-label.strong { color: #16a34a; }

.fx-rp-dev-panel {
  margin-top: 20px;
  padding: 12px 14px;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.5;
}
.fx-rp-dev-title {
  font-weight: 700;
  margin-bottom: 4px;
}
`;

// ---------------------------------------------------------------------------
// PASSWORD STRENGTH HELPER
// ---------------------------------------------------------------------------

type Strength = 'weak' | 'medium' | 'strong';

function evaluatePasswordStrength(pw: string): {
  score: 0 | 1 | 2 | 3;
  label: Strength | 'empty';
} {
  if (pw.length === 0) return { score: 0, label: 'empty' };
  if (pw.length < 8) return { score: 1, label: 'weak' };

  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (pw.length >= 12 && score >= 3) return { score: 3, label: 'strong' };
  if (score >= 3) return { score: 3, label: 'strong' };
  if (score === 2) return { score: 2, label: 'medium' };
  return { score: 1, label: 'weak' };
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    pendingResetEmail,
    error,
    confirmPasswordReset,
    clearError,
    resetAuthFlow,
  } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Guard: if no reset is in progress, redirect back to /forgot-password
  useEffect(() => {
    if (!pendingResetEmail && state !== 'authenticating') {
      navigate('/forgot-password', { replace: true });
    }
  }, [pendingResetEmail, state, navigate]);

  // Autofocus the code field
  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  // Clear errors when the user edits
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, newPassword, confirmPassword]);

  // On success, state returns to 'unauthenticated' and the reset email
  // is cleared — redirect to login with a success flag.
  useEffect(() => {
    if (!pendingResetEmail && state === 'unauthenticated') {
      navigate('/login?reset=success', { replace: true });
    }
  }, [pendingResetEmail, state, navigate]);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordLongEnough = newPassword.length >= 8;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const codeValid = /^\d{6}$/.test(code);
  const canSubmit = codeValid && passwordLongEnough && passwordsMatch;

  const isBusy = state === 'authenticating';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void confirmPasswordReset(code, newPassword);
  };

  const handleStartOver = () => {
    resetAuthFlow();
    navigate('/forgot-password', { replace: true });
  };

  return (
    <div className="fx-rp-page">
      <style>{pageCss}</style>

      <div className="fx-rp-card">
        <div className="fx-rp-logo">
          <div className="fx-rp-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-rp-brand">Flitedux</span>
        </div>

        <div className="fx-rp-eyebrow">Almost there</div>
        <h1 className="fx-rp-title">Set a new password</h1>
        <p className="fx-rp-subtitle">
          Enter the reset code we sent you and choose a new password.
        </p>

        {pendingResetEmail && (
          <div className="fx-rp-email-badge">
            <span>
              Sent to:{' '}
              <span className="fx-rp-email-value">{pendingResetEmail}</span>
            </span>
            <button
              type="button"
              className="fx-rp-change-link"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={handleStartOver}
            >
              Change
            </button>
          </div>
        )}

        {error && (
          <div className="fx-rp-error" role="alert">
            <span className="fx-rp-error-icon">⚠</span>
            <span>{error.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="fx-rp-field">
            <label htmlFor="fx-rp-code" className="fx-rp-label">
              Reset code
            </label>
            <input
              id="fx-rp-code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="fx-rp-input mfa-code"
              disabled={isBusy}
              required
            />
          </div>

          <div className="fx-rp-field">
            <label htmlFor="fx-rp-new" className="fx-rp-label">
              New password
            </label>
            <input
              id="fx-rp-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="fx-rp-input"
              disabled={isBusy}
              required
            />
            {newPassword.length > 0 && (
              <>
                <div className="fx-rp-password-strength">
                  <div
                    className={`fx-rp-strength-bar${
                      strength.score >= 1 ? ` filled ${strength.label}` : ''
                    }`}
                  />
                  <div
                    className={`fx-rp-strength-bar${
                      strength.score >= 2 ? ` filled ${strength.label}` : ''
                    }`}
                  />
                  <div
                    className={`fx-rp-strength-bar${
                      strength.score >= 3 ? ` filled ${strength.label}` : ''
                    }`}
                  />
                </div>
                {strength.label !== 'empty' && (
                  <div
                    className={`fx-rp-strength-label ${strength.label}`}
                  >
                    {strength.label === 'weak' && 'Weak password'}
                    {strength.label === 'medium' && 'Okay password'}
                    {strength.label === 'strong' && 'Strong password'}
                  </div>
                )}
                {!passwordLongEnough && (
                  <div className="fx-rp-hint" style={{ color: '#dc2626' }}>
                    Password must be at least 8 characters.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="fx-rp-field">
            <label htmlFor="fx-rp-confirm" className="fx-rp-label">
              Confirm new password
            </label>
            <input
              id="fx-rp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="fx-rp-input"
              disabled={isBusy}
              required
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <div className="fx-rp-hint" style={{ color: '#dc2626' }}>
                Passwords do not match.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="fx-rp-submit"
            disabled={isBusy || !canSubmit}
          >
            {isBusy && <span className="fx-rp-spinner" />}
            {isBusy ? 'Resetting password…' : 'Reset password'}
          </button>
        </form>

        <div className="fx-rp-footer">
          <Link to="/login">← Back to sign in</Link>
        </div>

        {import.meta.env.DEV && (
          <div className="fx-rp-dev-panel">
            <div className="fx-rp-dev-title">🔧 Dev mode</div>
            <div>
              Use reset code <strong>123456</strong> and any password 8+
              characters long.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};