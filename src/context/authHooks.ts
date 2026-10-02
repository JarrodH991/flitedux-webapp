// ============================================================================
// src/context/authHooks.ts
//
// Hooks that consume AuthContext.
//
// Kept in a separate file from AuthContext.tsx so that AuthContext.tsx can
// be a "pure component file" and Vite's Fast Refresh works cleanly.
//
// Import from here:
//   import { useAuth, useIsAuthenticated, useRequiredUser } from '../context/authHooks';
// ============================================================================

import { useContext } from 'react';
import { AuthContext } from './authContextValue';
import type { AuthContextValue } from './authContextValue';
import type { User } from '../types/exam.types';

/**
 * Primary hook for accessing auth state and actions.
 *
 * Throws if used outside <AuthProvider>, which is a bug in your component
 * tree — not something to handle at runtime.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be used inside <AuthProvider>. Check your App.tsx.',
    );
  }
  return ctx;
}

/**
 * Convenience: are we fully logged in?
 */
export function useIsAuthenticated(): boolean {
  const { state } = useAuth();
  return state === 'authenticated';
}

/**
 * Get the current user, throwing if there isn't one.
 * Use this inside components that are only rendered when logged in.
 */
export function useRequiredUser(): User {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useRequiredUser was called outside an authenticated route.');
  }
  return user;
}