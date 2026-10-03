// ============================================================================
// src/pages/auth/SocialCallback.tsx
//
// OAuth redirect handler. After the user completes a social login with
// Google / Apple / Facebook, Cognito redirects the browser back here with
// a `code` query parameter.
//
// In dev (mock mode), we don't actually redirect — the loginWithSocial
// call resolves in-process. But this page still exists because:
//   1. It's where real OAuth redirects will land
//   2. It gives us a place to show "signing you in" while the code exchange
//      runs
//   3. It handles the "user cancelled" case (query param `error`)
//
// 🔌 AWS: In production, this page:
//           1. Reads `?code=...` from the URL
//           2. POSTs it to Cognito's /oauth2/token endpoint
//           3. Receives access + id + refresh tokens
//           4. Decodes the id token for user info
//           5. Builds an AuthSessionWithTokens and stores it
//           6. Redirects to /dashboard
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-sc-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-sc-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  padding: 40px 36px 36px;
  box-sizing: border-box;
  text-align: center;
  animation: fxScIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxScIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fx-sc-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}
.fx-sc-logo-tile {
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
.fx-sc-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.fx-sc-brand {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.fx-sc-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 20px;
}

.fx-sc-icon.loading { background: #f1f5f9; }
.fx-sc-icon.success { background: #dcfce7; color: #16a34a; }
.fx-sc-icon.error   { background: #fee2e2; color: #dc2626; }

.fx-sc-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #cbd5e1;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxScSpin 0.7s linear infinite;
}
@keyframes fxScSpin { to { transform: rotate(360deg); } }

.fx-sc-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.25;
}
.fx-sc-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 24px;
}

.fx-sc-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 18px;
  text-align: left;
}
.fx-sc-error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.fx-sc-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.fx-sc-btn {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-sc-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-sc-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
}
.fx-sc-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-sc-btn.secondary:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

type Status = 'processing' | 'success' | 'error';

export const SocialCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithSocial, clearError } = useAuth();

  // Read query params — synchronous, safe to use during render.
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // ─────────────────────────────────────────────────────────────────────
  // Compute the INITIAL error/status DURING RENDER.
  //
  // The URL params are available immediately, so there's no reason to
  // defer this decision to an effect. Doing it during render means we
  // never call setState synchronously inside an effect body — which
  // React warns about ("cascading renders").
  // ─────────────────────────────────────────────────────────────────────
  const initialError: string | null = errorParam
    ? errorDescription || `Sign-in was cancelled or failed (${errorParam}).`
    : !code && !import.meta.env.DEV
      ? 'No authorization code was provided by the provider.'
      : null;

  const [status, setStatus] = useState<Status>(
    initialError ? 'error' : 'processing',
  );
  const [localError, setLocalError] = useState<string | null>(initialError);

  const hasRunRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────
  // Handle the async part: the code exchange (prod) or the mock login
  // (dev). Runs once on mount. Only touches setState inside async
  // callbacks — no synchronous setState in the effect body.
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // If the URL already told us there's an error, nothing to do.
    if (initialError) return;

    // Case A: we have a code — the production OAuth flow.
    if (code) {
      const providerFromState = stateParam || 'google';
      void (async () => {
        try {
          // 🔌 AWS: Replace this with a POST to Cognito's /oauth2/token.
          await new Promise((r) => setTimeout(r, 1200));
          if (!hasRunRef.current) return;
          void providerFromState;
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } catch (e) {
          if (!hasRunRef.current) return;
          setStatus('error');
          setLocalError(
            e instanceof Error ? e.message : 'Could not complete sign-in.',
          );
        }
      })();
      return;
    }

    // Case B: dev fallback — no code, no error, in dev mode.
    // Simulate an OAuth round-trip and sign in as the candidate user.
    void (async () => {
      await new Promise((r) => setTimeout(r, 1500));
      if (!hasRunRef.current) return;

      await loginWithSocial('google');
      if (!hasRunRef.current) return;

      // The mock backend always succeeds; in production, real OAuth
      // returns a ?code= and Case A handles it.
      setStatus('success');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear any auth error when the component unmounts.
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="fx-sc-page">
      <style>{pageCss}</style>

      <div className="fx-sc-card">
        <div className="fx-sc-logo">
          <div className="fx-sc-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-sc-brand">Flitedux</span>
        </div>

        {status === 'processing' && (
          <>
            <div className="fx-sc-icon loading" aria-hidden="true">
              <div className="fx-sc-spinner" />
            </div>
            <h1 className="fx-sc-title">Signing you in…</h1>
            <p className="fx-sc-subtitle">
              Please wait while we finish connecting your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="fx-sc-icon success" aria-hidden="true">
              ✓
            </div>
            <h1 className="fx-sc-title">You're in</h1>
            <p className="fx-sc-subtitle">Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="fx-sc-icon error" aria-hidden="true">
              ⚠
            </div>
            <h1 className="fx-sc-title">Sign-in failed</h1>
            <p className="fx-sc-subtitle">
              We couldn't complete the sign-in. You can try again or use
              another method.
            </p>

            {localError && (
              <div className="fx-sc-error" role="alert">
                <span className="fx-sc-error-icon">⚠</span>
                <span>{localError}</span>
              </div>
            )}

            <div className="fx-sc-actions">
              <Link to="/login" className="fx-sc-btn primary">
                Back to sign in
              </Link>
              <Link to="/signup" className="fx-sc-btn secondary">
                Create an account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};