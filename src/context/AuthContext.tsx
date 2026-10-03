// ============================================================================
// src/context/AuthContext.tsx
//
// The AuthProvider component.
//
// - Context object + type live in ./authContextValue.ts
// - Hooks live in ./authHooks.ts
// - This file exports ONLY the component, so Vite Fast Refresh stays happy.
//
// 🔌 AWS: Every method here calls a function in services/api.ts. When you
//         wire up Cognito, only those functions change — this file doesn't.
// ============================================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import * as api from '../services/api';
import { AuthContext } from './authContextValue';
import type { AuthContextValue } from './authContextValue';

import type { User } from '../types/exam.types';
import type {
  AuthError,
  AuthState,
  MfaChallenge,
  MfaMethod,
  AuthSessionWithTokens,
  SignupCredentials,
  SocialProvider,
} from '../types/auth.types';

// ---------------------------------------------------------------------------
// LOCAL STORAGE
//
// ⚠️ DEV NOTE: We store the token in localStorage so the session survives a
//    page refresh during development.
//
// 🔌 AWS: In production, DO NOT store the access token in localStorage.
//         XSS can steal it. Use Amplify's secure storage instead.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'flitedux_exam_token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage disabled — session won't persist across reloads. Not fatal. */
  }
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignored */
  }
}

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSessionWithTokens | null>(null);
  const [state, setState] = useState<AuthState>('unauthenticated');
  const [pendingMfa, setPendingMfa] = useState<MfaChallenge | null>(null);
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(
    null,
  );
  const [pendingResetEmail, setPendingResetEmail] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<AuthError | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Guard against setState-after-unmount when async calls resolve late.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // BOOTSTRAP: try to restore a session from a stored token
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedToken = readStoredToken();
      if (!storedToken) {
        if (!cancelled && mountedRef.current) {
          setState('unauthenticated');
          setIsBootstrapping(false);
        }
        return;
      }

      const result = await api.restoreSession(storedToken);
      if (cancelled || !mountedRef.current) return;

      if (result.ok) {
        setUser(result.data.user);
        setSession(result.data);
        setState('authenticated');
      } else {
        clearStoredToken();
        setState('unauthenticated');
      }
      setIsBootstrapping(false);
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // HELPER — apply a successful session
  // -------------------------------------------------------------------------
  const applySession = useCallback((s: AuthSessionWithTokens) => {
    setUser(s.user);
    setSession(s);
    writeStoredToken(s.token);
    setPendingMfa(null);
    setPendingSignupEmail(null);
    setPendingResetEmail(null);
    setError(null);
    setState('authenticated');
  }, []);

  // -------------------------------------------------------------------------
  // HELPER — set a structured error
  // -------------------------------------------------------------------------
  const setAuthError = useCallback((code: string, message?: string) => {
    const c = code as AuthError['code'];
    setError({
      code: c,
      message: message ?? api.authErrorMessage(c),
    });
  }, []);

  // -------------------------------------------------------------------------
  // LOGIN — step 1
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      setError(null);
      setState('authenticating');

      const result = await api.login({ email, password, rememberMe });
      if (!mountedRef.current) return;

      if (!result.ok) {
        setAuthError(result.error.code, result.error.message);
        setState('error');
        return;
      }

      if (result.data.kind === 'mfa-required') {
        setPendingMfa(result.data.challenge);
        setState('awaiting-mfa');
        return;
      }

      applySession(result.data.session);
    },
    [applySession, setAuthError],
  );

  // -------------------------------------------------------------------------
  // VERIFY MFA — step 2
  // -------------------------------------------------------------------------
  const verifyMfa = useCallback(
    async (code: string, trustDevice = false) => {
      if (!pendingMfa) {
        setAuthError(
          'unknown',
          'No MFA challenge in progress. Please start over.',
        );
        setState('error');
        return;
      }

      setError(null);
      setState('authenticating');

      const result = await api.verifyMfa({
        userId: pendingMfa.userId,
        method: pendingMfa.method as MfaMethod,
        code,
        trustDevice,
      });
      if (!mountedRef.current) return;

      if (!result.ok) {
        const errCode = result.error.code;
        setAuthError(errCode, result.error.message);

        if (errCode === 'mfa-expired' || errCode === 'too-many-attempts') {
          setPendingMfa(null);
          setState('error');
        } else {
          setState('awaiting-mfa');
        }
        return;
      }

      applySession(result.data);
    },
    [pendingMfa, applySession, setAuthError],
  );

    // -------------------------------------------------------------------------
  // SIGNUP — step 1: create the account
  // -------------------------------------------------------------------------
  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      setError(null);
      setState('authenticating');

      const result = await api.signup(credentials);
      if (!mountedRef.current) return;

      if (!result.ok) {
        setAuthError(result.error.code, result.error.message);
        setState('error');
        return;
      }

      // Account created — Cognito has sent a verification email.
      setPendingSignupEmail(credentials.email);
      setState('awaiting-email-verification');
    },
    [setAuthError],
  );

  // -------------------------------------------------------------------------
  // SIGNUP — step 2: confirm the verification code
  // -------------------------------------------------------------------------
  const confirmSignup = useCallback(
    async (code: string) => {
      if (!pendingSignupEmail) {
        setAuthError(
          'unknown',
          'No signup in progress. Please start over.',
        );
        setState('error');
        return;
      }

      setError(null);
      setState('authenticating');

      const result = await api.confirmSignup({
        email: pendingSignupEmail,
        code,
      });
      if (!mountedRef.current) return;

      if (!result.ok) {
        const errCode = result.error.code;
        setAuthError(errCode, result.error.message);

        // Keep them on the verification screen if the code was wrong.
        if (errCode === 'mfa-expired' || errCode === 'too-many-attempts') {
          setPendingSignupEmail(null);
          setState('error');
        } else {
          setState('awaiting-email-verification');
        }
        return;
      }

      // Account is now verified — the mock/real backend may or may not
      // log the user in directly. Assume it does:
      applySession(result.data);
    },
    [pendingSignupEmail, applySession, setAuthError],
  );

  // -------------------------------------------------------------------------
  // SIGNUP — resend the verification code
  // -------------------------------------------------------------------------
  const resendSignupCode = useCallback(async () => {
    if (!pendingSignupEmail) return;
    setError(null);
    const result = await api.resendSignupCode({ email: pendingSignupEmail });
    if (!mountedRef.current) return;
    if (!result.ok) {
      setAuthError(result.error.code, result.error.message);
    }
  }, [pendingSignupEmail, setAuthError]);

  // -------------------------------------------------------------------------
  // PASSWORD RESET — step 1: request the reset email
  // -------------------------------------------------------------------------
  const requestPasswordReset = useCallback(
    async (email: string) => {
      setError(null);
      setState('authenticating');

      const result = await api.requestPasswordReset({ email });
      if (!mountedRef.current) return;

      if (!result.ok) {
        setAuthError(result.error.code, result.error.message);
        setState('error');
        return;
      }

      setPendingResetEmail(email);
      setState('awaiting-password-reset');
    },
    [setAuthError],
  );

  // -------------------------------------------------------------------------
  // PASSWORD RESET — step 2: submit code + new password
  // -------------------------------------------------------------------------
  const confirmPasswordReset = useCallback(
    async (code: string, newPassword: string) => {
      if (!pendingResetEmail) {
        setAuthError(
          'unknown',
          'No password reset in progress. Please start over.',
        );
        setState('error');
        return;
      }

      setError(null);
      setState('authenticating');

      const result = await api.confirmPasswordReset({
        email: pendingResetEmail,
        code,
        newPassword,
      });
      if (!mountedRef.current) return;

      if (!result.ok) {
        setAuthError(result.error.code, result.error.message);
        setState('awaiting-password-reset');
        return;
      }

      // Reset successful — return to login.
      setPendingResetEmail(null);
      setState('unauthenticated');
    },
    [pendingResetEmail, setAuthError],
  );

  // -------------------------------------------------------------------------
  // SOCIAL LOGIN
  //
  // In dev, this simulates a successful OAuth redirect and logs the user in
  // as a dev user for that provider.
  //
  // 🔌 AWS: In production, this redirects the browser to the Cognito
  //         Hosted UI, which handles the OAuth flow with Google/Apple/
  //         Facebook and redirects back to /exam/auth/callback.
  // -------------------------------------------------------------------------
  const loginWithSocial = useCallback(
    async (provider: SocialProvider) => {
      setError(null);
      setState('authenticating');

      const result = await api.loginWithSocial(provider);
      if (!mountedRef.current) return;

      if (!result.ok) {
        setAuthError(result.error.code, result.error.message);
        setState('error');
        return;
      }

      applySession(result.data);
    },
    [applySession, setAuthError],
  );

  // -------------------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    await api.logout();
    clearStoredToken();
    setUser(null);
    setSession(null);
    setPendingMfa(null);
    setPendingSignupEmail(null);
    setPendingResetEmail(null);
    setError(null);
    setState('unauthenticated');
  }, []);

  // -------------------------------------------------------------------------
  // UTILITIES
  // -------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setError(null);
    setState((prev) => (prev === 'error' ? 'unauthenticated' : prev));
  }, []);

  const resetAuthFlow = useCallback(() => {
    setPendingMfa(null);
    setPendingSignupEmail(null);
    setPendingResetEmail(null);
    setError(null);
    setState('unauthenticated');
  }, []);

  // -------------------------------------------------------------------------
  // CONTEXT VALUE
  // -------------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      state,
      pendingMfa,
      pendingSignupEmail,
      pendingResetEmail,
      error,
      isBootstrapping,
      login,
      verifyMfa,
      signup,
      confirmSignup,
      resendSignupCode,
      requestPasswordReset,
      confirmPasswordReset,
      loginWithSocial,
      logout,
      clearError,
      resetAuthFlow,
    }),
    [
      user,
      session,
      state,
      pendingMfa,
      pendingSignupEmail,
      pendingResetEmail,
      error,
      isBootstrapping,
      login,
      verifyMfa,
      signup,
      confirmSignup,
      resendSignupCode,
      requestPasswordReset,
      confirmPasswordReset,
      loginWithSocial,
      logout,
      clearError,
      resetAuthFlow,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};