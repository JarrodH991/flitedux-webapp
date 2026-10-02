// ============================================================================
// src/context/authContextValue.ts
//
// The React context object and its value shape. Separated from the provider
// so that AuthContext.tsx (the provider) and authHooks.ts (the hooks) can
// both import from it without creating circular imports or Fast Refresh
// warnings.
//
// ⚠️ This is the single source of truth for the AuthContext type. If you
//    add a new field or method to the provider, add it here first — the
//    provider will then refuse to compile until you've implemented it.
// ============================================================================

import { createContext } from 'react';
import type { User } from '../types/exam.types';
import type {
  AuthError,
  AuthState,
  MfaChallenge,
  AuthSessionWithTokens,
} from '../types/auth.types';

export interface AuthContextValue {
  /** The currently logged-in user, or null. */
  user: User | null;

  /** The current session (token + expiry), or null. */
  session: AuthSessionWithTokens | null;

  /** Current state of the auth flow. */
  state: AuthState;

  /** If state is 'awaiting-mfa', this is the challenge to render. */
  pendingMfa: MfaChallenge | null;

  /** If state is 'error', this is the error to display. */
  error: AuthError | null;

  /** True while the initial session-restore check runs on app boot. */
  isBootstrapping: boolean;

  /** Step 1: submit email + password. */
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;

  /** Step 2: submit MFA code. */
  verifyMfa: (code: string, trustDevice?: boolean) => Promise<void>;

  /** Sign out. Clears session and token. */
  logout: () => Promise<void>;

  /** Clear any pending error. */
  clearError: () => void;

  /** Restart the auth flow (e.g. "back to login" from MFA screen). */
  resetAuthFlow: () => void;
}

/**
 * ⚠️ The type parameter on createContext is what makes `ctx.state`,
 *    `ctx.user`, etc. work in consumers.
 *
 * If you accidentally write `createContext({})` here, every consumer will
 * see `{}` and TypeScript will say "Property 'state' does not exist on
 * type '{}'". That's the single most common mistake with React Context.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);