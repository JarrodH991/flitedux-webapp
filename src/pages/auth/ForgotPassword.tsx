// ============================================================================
// src/pages/auth/ForgotPassword.tsx
//
// Step 1 of password reset: user enters their email, we send a reset code.
//
// In dev: the code is printed to the console.
// In production: Cognito sends a real email via SES.
//
// On success, transitions to /reset-password where the user enters the
// code + new password.
//
// 🔌 AWS: Calls Cognito forgotPassword(). Rate limited to 1 request per
//         minute per user.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-fp-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-fp-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  animation: fxFpIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxFpIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-fp-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.fx-fp-logo-tile {
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
.fx-fp-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.fx-fp-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-fp-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  text-align: center;
  margin-bottom: 6px;
}
.fx-fp-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.25;
}
.fx-fp-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 28px;
  line-height: 1.5;
}

.fx-fp-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.fx-fp-input {
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
.fx-fp-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-fp-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.fx-fp-field {
  margin-bottom: 18px;
}

.fx-fp-error {
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
  animation: fxFpShake 0.4s ease both;
}
@keyframes fxFpShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.fx-fp-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-fp-submit {
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
.fx-fp-submit:hover:not(:disabled),
.fx-fp-submit:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-fp-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.fx-fp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fx-fp-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxFpSpin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes fxFpSpin { to { transform: rotate(360deg); } }

.fx-fp-footer {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
.fx-fp-footer a {
  color: #d95300;
  font-weight: 600;
  text-decoration: none;
}
.fx-fp-footer a:hover { text-decoration: underline; }

.fx-fp-info-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #075985;
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 22px;
}
.fx-fp-info-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-fp-dev-panel {
  margin-top: 20px;
  padding: 12px 14px;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.5;
}
.fx-fp-dev-title {
  font-weight: 700;
  margin-bottom: 4px;
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    pendingResetEmail,
    error,
    requestPasswordReset,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Autofocus on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Clear errors when the user types
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // When the reset flow advances to "awaiting-password-reset", redirect
  // to the reset page.
  useEffect(() => {
    if (state === 'awaiting-password-reset') {
      navigate('/reset-password', { replace: true });
    }
  }, [state, navigate]);

  const emailLooksValid = /\S+@\S+\.\S+/.test(email);
  const isBusy = state === 'authenticating';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLooksValid) return;
    void requestPasswordReset(email.trim());
  };

  return (
    <div className="fx-fp-page">
      <style>{pageCss}</style>

      <div className="fx-fp-card">
        {/* Brand */}
        <div className="fx-fp-logo">
          <div className="fx-fp-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-fp-brand">Flitedux</span>
        </div>

        <div className="fx-fp-eyebrow">Password reset</div>
        <h1 className="fx-fp-title">Forgot your password?</h1>
        <p className="fx-fp-subtitle">
          Enter your email and we'll send you a code to reset it.
        </p>

        {!pendingResetEmail && (
          <div className="fx-fp-info-box">
            <span className="fx-fp-info-icon" aria-hidden="true">
              ℹ
            </span>
            <span>
              If an account exists for that email, you'll receive a reset code
              within a minute. Check your spam folder if it doesn't arrive.
            </span>
          </div>
        )}

        {error && (
          <div className="fx-fp-error" role="alert">
            <span className="fx-fp-error-icon">⚠</span>
            <span>{error.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="fx-fp-field">
            <label htmlFor="fx-fp-email" className="fx-fp-label">
              Email address
            </label>
            <input
              id="fx-fp-email"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="fx-fp-input"
              disabled={isBusy}
              required
            />
          </div>

          <button
            type="submit"
            className="fx-fp-submit"
            disabled={isBusy || !emailLooksValid}
          >
            {isBusy && <span className="fx-fp-spinner" />}
            {isBusy ? 'Sending reset code…' : 'Send reset code'}
          </button>
        </form>

        <div className="fx-fp-footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </div>

        {import.meta.env.DEV && (
          <div className="fx-fp-dev-panel">
            <div className="fx-fp-dev-title">🔧 Dev mode</div>
            <div>
              Any email works. The reset code will be printed to the browser
              console as <strong>123456</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};