// ============================================================================
// src/types/auth.types.ts
//
// Authentication and session types.
//
// ⚠️ DESIGN NOTE
// ---------------------------------------------------------------------------
// We keep auth types in a SEPARATE file from exam.types.ts because they
// have different concerns:
//   - exam.types.ts  →  what the exam system operates on
//   - auth.types.ts  →  how users identify themselves
//
// The User type itself lives in exam.types.ts and is reused here.
//
// 🔌 AWS: Everything in this file maps to Cognito.
//         - LoginCredentials  →  Auth.signIn(email, password)
//         - MfaChallenge      →  Cognito's SMS/TOTP challenge
//         - AuthSession       →  the JWT returned by Cognito after MFA
//         - AuthError         →  Cognito error codes (NotAuthorizedException, etc.)
//
//         See src/services/api.ts for the corresponding functions.
// ============================================================================

import type { User } from './exam.types';

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

/**
 * What the user submits on the login form.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  /**
   * "Remember me" — in production this controls refresh-token lifetime.
   * Cognito users can have a 30-day refresh window vs. a 1-day one.
   */
  rememberMe?: boolean;
}

/**
 * What the user submits on the signup form.
 *
 * 🔌 AWS: Cognito SignUp. Email verification happens via a code sent to
 *         the user's inbox; you'll add a "verify email" step after signup.
 */
export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
  /** Must accept terms & privacy. */
  acceptedTerms: boolean;
}

// ---------------------------------------------------------------------------
// Social providers
// ---------------------------------------------------------------------------

/**
 * Which third-party identity providers we support.
 *
 * 🔌 AWS: Each of these is a Cognito Identity Provider. When you configure
 *         them in the Cognito console, you get a client ID + secret for
 *         each, and Cognito handles the OAuth flow.
 */
export type SocialProvider = 'google' | 'apple' | 'facebook';

// ---------------------------------------------------------------------------
// MFA
// ---------------------------------------------------------------------------

/**
 * The kind of MFA challenge the server is asking for.
 *
 * 🔌 AWS: Cognito supports these challenges natively. TOTP is the most
 *         secure; SMS is the fallback; EMAIL is a convenient middle ground.
 *         For high-stakes aviation exams, TOTP is strongly recommended.
 */
export type MfaMethod = 'totp' | 'sms' | 'email';

/**
 * The state the auth flow is in. The AuthContext exposes this so the UI
 * knows what to render.
 */
export type AuthState =
  | 'unauthenticated'
  | 'authenticating'
  | 'awaiting-mfa'
  | 'awaiting-email-verification'
  | 'awaiting-password-reset'
  | 'authenticated'
  | 'error';

/**
 * When a user submits credentials and the server responds "I need MFA",
 * this is what comes back.
 */
export interface MfaChallenge {
  /** Which user this challenge belongs to (still not fully authenticated). */
  userId: string;
  method: MfaMethod;
  /** Where the code was sent — partially masked, e.g. "j***@gmail.com". */
  destination: string;
  /**
   * When the code expires. UI should show a countdown.
   * ISO 8601.
   */
  expiresAt: string;
  /**
   * How many attempts the user has left before the challenge locks.
   * Cognito default is 3.
   */
  attemptsRemaining: number;
}

/**
 * What the user submits to answer an MFA challenge.
 */
export interface MfaResponse {
  userId: string;
  method: MfaMethod;
  code: string;
  /**
   * Set to true if the user wants this device to skip MFA next time.
   * Cognito supports this via device tracking.
   */
  trustDevice?: boolean;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * The AuthSession type lives in exam.types.ts (because the exam system
 * references it), but we re-export a richer version here that the auth
 * layer cares about.
 *
 * 🔌 AWS: The `token` and `refreshToken` are JWTs issued by Cognito. You
 *         store them in memory (for the access token) and either
 *         httpOnly cookies or secure storage (for the refresh token).
 *
 *         Never store the access token in localStorage in production —
 *         XSS can steal it. Use an httpOnly cookie set by your backend,
 *         or Amplify's built-in storage which handles this for you.
 */
export interface AuthSessionWithTokens {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
  mfaVerified: boolean;
  /**
   * Which MFA method was used to establish this session. Needed for
   * audit logs.
   */
  mfaMethodUsed?: MfaMethod;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Every possible auth failure. The UI maps these to user-friendly messages.
 * The raw code is kept so we can log it or debug.
 *
 * 🔌 AWS: These map 1:1 to Cognito error codes:
 *         - invalid-credentials    → NotAuthorizedException
 *         - user-not-found         → UserNotFoundException
 *         - user-not-confirmed     → UserNotConfirmedException
 *         - mfa-required           → (challenge response, not an error)
 *         - mfa-invalid-code       → CodeMismatchException
 *         - mfa-expired            → ExpiredCodeException
 *         - too-many-attempts      → TooManyRequestsException
 *         - password-reset-required → PasswordResetRequiredException
 *         - session-expired        → NotAuthorizedException (expired token)
 *         - network-error          → any transport failure
 *         - unknown                → catch-all
 */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'user-not-found'
  | 'user-not-confirmed'
  | 'mfa-required'
  | 'mfa-invalid-code'
  | 'mfa-expired'
  | 'too-many-attempts'
  | 'password-reset-required'
  | 'session-expired'
  | 'network-error'
  | 'unknown';

/**
 * A structured auth error. Includes a user-facing message plus the raw code
 * for logging.
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Step 1 of password reset: user provides email.
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Step 2: user provides the code they received plus their new password.
 */
export interface PasswordResetConfirm {
  email: string;
  code: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a user has any of the given roles.
 * Useful for conditional rendering in the UI.
 */
export function userHasRole(
  user: User | null | undefined,
  ...roles: string[]
): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r as never));
}

/**
 * Checks whether a user can administer the given subject.
 * Admins can administer any subject; instructors only those in their scope.
 *
 * This is a UI-side convenience. The real enforcement happens on the
 * backend (Cognito groups + Lambda authorizers on API Gateway).
 *
 * 🔌 AWS: In production, this same logic is duplicated in your Lambda
 *         authorizer so the server enforces it too. Never rely on
 *         frontend-only checks.
 */
export function userCanAccessSubject(
  user: User | null | undefined,
  subjectId: string,
): boolean {
  if (!user) return false;
  if (user.roles.includes('admin')) return true;
  if (user.roles.includes('auditor')) return true;
  if (!user.subjectScope || user.subjectScope.length === 0) return true;
  return user.subjectScope.includes(subjectId);
}

/**
 * Checks whether a user is allowed to author/edit questions or exams.
 */
export function userCanAuthorContent(
  user: User | null | undefined,
): boolean {
  if (!user) return false;
  return user.roles.includes('admin') || user.roles.includes('instructor');
}

/**
 * Checks whether a user can view audit logs.
 * Auditors and admins can. Instructors cannot.
 */
export function userCanViewAudit(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roles.includes('admin') || user.roles.includes('auditor');
}