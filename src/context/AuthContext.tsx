// ============================================================================
// src/context/AuthContext.tsx
//
// The AuthProvider component.
//
// - Context object + type live in ./authContextValue.ts
// - Hooks live in ./authHooks.ts
// - This file exports ONLY the component, so Vite Fast Refresh stays happy
//   (no more "only-export-components" warning).
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
} from '../types/auth.types';

// ---------------------------------------------------------------------------
// LOCAL STORAGE
//
// ⚠️ DEV NOTE: We store the token in localStorage so the session survives a
//    page refresh during development.
//
// 🔌 AWS: In production, DO NOT store the access token in localStorage.
//         XSS can steal it. Use one of:
//           - httpOnly cookies set by your backend
//           - AWS Amplify's secure storage (handles this for you)
//           - In-memory only + refresh on every page load
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
  // LOGIN — step 1
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      setError(null);
      setState('authenticating');

      const result = await api.login({ email, password, rememberMe });
      if (!mountedRef.current) return;

      if (!result.ok) {
        setError({
          code: result.error.code as AuthError['code'],
          message: api.authErrorMessage(result.error.code as never),
          raw: result.error,
        });
        setState('error');
        return;
      }

      if (result.data.kind === 'mfa-required') {
        setPendingMfa(result.data.challenge);
        setState('awaiting-mfa');
        return;
      }

      const s = result.data.session;
      setUser(s.user);
      setSession(s);
      writeStoredToken(s.token);
      setPendingMfa(null);
      setState('authenticated');
    },
    [],
  );

  // -------------------------------------------------------------------------
  // VERIFY MFA — step 2
  // -------------------------------------------------------------------------
  const verifyMfa = useCallback(
    async (code: string, trustDevice = false) => {
      if (!pendingMfa) {
        setError({
          code: 'unknown',
          message: 'No MFA challenge in progress. Please start over.',
        });
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
        const errCode = result.error.code as AuthError['code'];
        setError({
          code: errCode,
          message: api.authErrorMessage(errCode),
          raw: result.error,
        });

        if (errCode === 'mfa-expired' || errCode === 'too-many-attempts') {
          setPendingMfa(null);
          setState('error');
        } else {
          setState('awaiting-mfa');
        }
        return;
      }

      const s = result.data;
      setUser(s.user);
      setSession(s);
      writeStoredToken(s.token);
      setPendingMfa(null);
      setState('authenticated');
    },
    [pendingMfa],
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
    setError(null);
    setState('unauthenticated');
  }, []);

  // -------------------------------------------------------------------------
  // CONTEXT VALUE (memoised so consumers don't re-render unnecessarily)
  // -------------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      state,
      pendingMfa,
      error,
      isBootstrapping,
      login,
      verifyMfa,
      logout,
      clearError,
      resetAuthFlow,
    }),
    [
      user,
      session,
      state,
      pendingMfa,
      error,
      isBootstrapping,
      login,
      verifyMfa,
      logout,
      clearError,
      resetAuthFlow,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};