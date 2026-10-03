// ============================================================================
// src/context/authContextValue.ts
//
// The React context object and its value shape for authentication.
//
// ⚠️ This is the single source of truth for the AuthContext type. If you
//    add a new field or method to the provider, add it here first.
//
// 🔌 AWS: Every method here maps 1:1 to a Cognito API call (see services/api.ts).
// ============================================================================

import { createContext } from 'react';
import type { User } from '../types/exam.types';
import type {
  AuthError,
  AuthState,
  MfaChallenge,
  AuthSessionWithTokens,
  SignupCredentials,
  SocialProvider,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '../types/auth.types';

export interface AuthContextValue {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** The currently logged-in user, or null. */
  user: User | null;

  /** The current session (token + expiry), or null. */
  session: AuthSessionWithTokens | null;

  /** Current state of the auth flow. */
  state: AuthState;

  /** If state is 'awaiting-mfa', this is the challenge to render. */
  pendingMfa: MfaChallenge | null;

  /**
   * If state is 'awaiting-email-verification', this holds the email the
   * user signed up with so we can show "we sent a code to ...".
   */
  pendingSignupEmail: string | null;

  /**
   * If state is 'awaiting-password-reset', this holds the email the user
   * requested the reset for.
   */
  pendingResetEmail: string | null;

  /** If state is 'error', this is the error to display. */
  error: AuthError | null;

  /** True while the initial session-restore check runs on app boot. */
  isBootstrapping: boolean;

  // ---------------------------------------------------------------------------
  // Actions — email + password flow
  // ---------------------------------------------------------------------------

  /** Step 1: submit email + password. */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;

  /** Step 2: submit MFA code. */
  verifyMfa: (code: string, trustDevice?: boolean) => Promise<void>;

  /** Sign out. Clears session and token. */
  logout: () => Promise<void>;

  // ---------------------------------------------------------------------------
  // Actions — signup flow
  // ---------------------------------------------------------------------------

  /**
   * Step 1: create an account. Sends a verification email.
   * On success, transitions to state 'awaiting-email-verification'.
   */
  signup: (credentials: SignupCredentials) => Promise<void>;

  /**
   * Step 2: confirm the email verification code.
   * On success, logs the user in directly.
   */
  confirmSignup: (code: string) => Promise<void>;

  /**
   * Resend the verification email for the pending signup.
   * Cognito rate-limits this — usually 1 per minute.
   */
  resendSignupCode: () => Promise<void>;

  // ---------------------------------------------------------------------------
  // Actions — password reset flow
  // ---------------------------------------------------------------------------

  /**
   * Step 1: request a password reset email.
   * On success, transitions to state 'awaiting-password-reset'.
   */
  requestPasswordReset: (email: string) => Promise<void>;

  /**
   * Step 2: submit the reset code + new password.
   * On success, the user can log in with the new password.
   */
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;

  // ---------------------------------------------------------------------------
  // Actions — social login
  // ---------------------------------------------------------------------------

  /**
   * Initiate sign-in with a social provider.
   *
   * In dev, this simulates the redirect and logs the user in as a
   * dev user for that provider. In production, it redirects the browser
   * to the Cognito Hosted UI.
   */
  loginWithSocial: (provider: SocialProvider) => Promise<void>;

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** Clear any pending error. */
  clearError: () => void;

  /** Return to the initial unauthenticated state, discarding any pending flow. */
  resetAuthFlow: () => void;
}

/**
 * ⚠️ The type parameter on createContext is what makes `ctx.state`,
 *    `ctx.user`, etc. work in consumers. If you accidentally write
 *    `createContext({})`, every consumer will see `{}`.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);