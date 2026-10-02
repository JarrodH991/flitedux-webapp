// ============================================================================
// src/data/dev/devUsers.ts
//
// ⚠️ DEV ONLY — this file is a stand-in for AWS Cognito.
//
// Every user in this file exists ONLY during development. When you wire up
// Cognito, this file stops being imported and can be deleted (or moved to
// scripts/ for seeding Cognito test users).
//
// See the 🔌 AWS comments in src/services/api.ts to see where real
// authentication plugs in.
// ============================================================================

import type { User } from '../../types/exam.types';

/**
 * A dev user is a User plus a plaintext password field.
 *
 * ⚠️ Real passwords are NEVER stored in plaintext. This exists only so you
 *    can log in during development. Cognito hashes and manages passwords
 *    for you in production.
 */
export interface DevUser extends User {
  /** ⚠️ DEV ONLY. Never send this to the client in production. */
  password: string;
}

// ---------------------------------------------------------------------------
// Passwords for dev testing
// ---------------------------------------------------------------------------
// The login screen (src/pages/exam/ExamAuth.tsx) displays these on-screen
// during development so you can quickly switch between roles without
// remembering them. That display is gated behind an `import.meta.env.DEV`
// check and will not appear in production builds.
// ---------------------------------------------------------------------------

export const DEV_PASSWORDS: Record<string, string> = {
  candidate: 'candidate123',
  instructor: 'instructor123',
  admin: 'admin123',
  auditor: 'auditor123',
};

export const devUsers: DevUser[] = [
  // -------------------------------------------------------------------------
  // CANDIDATE
  // -------------------------------------------------------------------------
  {
    id: 'user-candidate-001',
    email: 'candidate@test.com',
    displayName: 'Test Candidate',
    password: DEV_PASSWORDS.candidate,
    roles: ['candidate'],
    mfaEnabled: true,
    createdAt: '2025-01-15T08:00:00Z',
    lastLoginAt: '2025-09-28T14:22:00Z',
    subjectScope: [], // candidates can see all subjects they're enrolled in
  },

  // -------------------------------------------------------------------------
  // INSTRUCTOR
  // -------------------------------------------------------------------------
  {
    id: 'user-instructor-001',
    email: 'instructor@test.com',
    displayName: 'Test Instructor',
    password: DEV_PASSWORDS.instructor,
    roles: ['instructor'],
    mfaEnabled: true,
    createdAt: '2025-01-10T09:30:00Z',
    lastLoginAt: '2025-09-30T07:45:00Z',
    /**
     * An instructor with limited scope: can see DG and AVSEC content,
     * cannot see other subjects' content even if they're added later.
     * Demonstrates the RBAC subject-scoping feature.
     *
     * An empty array (see candidate) means no explicit restriction.
     * An admin's empty array means "all subjects".
     */
    subjectScope: ['subj-dg', 'subj-avsec'],
  },

  // -------------------------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------------------------
  {
    id: 'user-admin-001',
    email: 'admin@test.com',
    displayName: 'Test Admin',
    password: DEV_PASSWORDS.admin,
    roles: ['admin'],
    mfaEnabled: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastLoginAt: '2025-09-30T16:05:00Z',
    subjectScope: [], // admin with no scope = full access to all subjects
  },

  // -------------------------------------------------------------------------
  // AUDITOR
  // -------------------------------------------------------------------------
  {
    id: 'user-auditor-001',
    email: 'auditor@test.com',
    displayName: 'Test Auditor',
    password: DEV_PASSWORDS.auditor,
    roles: ['auditor'],
    mfaEnabled: true,
    createdAt: '2025-02-01T11:15:00Z',
    lastLoginAt: '2025-09-29T10:10:00Z',
    subjectScope: [], // auditors typically see all subjects, read-only
  },
];

// ---------------------------------------------------------------------------
// Helper: find a dev user by email (case-insensitive)
// ---------------------------------------------------------------------------
export function findDevUserByEmail(email: string): DevUser | undefined {
  const normalised = email.trim().toLowerCase();
  return devUsers.find((u) => u.email.toLowerCase() === normalised);
}

// ---------------------------------------------------------------------------
// Helper: find a dev user by ID
// ---------------------------------------------------------------------------
export function findDevUserById(id: string): DevUser | undefined {
  return devUsers.find((u) => u.id === id);
}

// ---------------------------------------------------------------------------
// Helper: strip the password before returning to the app layer
// ---------------------------------------------------------------------------
export function toSafeUser(devUser: DevUser): User {
  const { id, email, displayName, roles, mfaEnabled, createdAt, lastLoginAt, subjectScope } = devUser;
  return {
    id,
    email,
    displayName,
    roles,
    mfaEnabled,
    createdAt,
    lastLoginAt,
    subjectScope,
  };
}