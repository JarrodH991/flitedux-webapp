// ============================================================================
// src/types/certificate.types.ts
//
// Certificate types.
//
// A certificate is derived from a passed exam attempt. There is no separate
// "certificates" table — every certificate is a view onto an existing
// attempt where passed === true.
//
// 🔌 AWS: If you ever need to track re-issues, revocations, or manual
//         overrides, add a real `certificates` table and populate it with
//         a Lambda triggered on exam pass. For now, derived from attempts.
// ============================================================================

/**
 * A certificate of achievement. Auto-generated when an exam is passed.
 */
export interface Certificate {
  /** Certificate ID. Same as the attempt ID it was derived from. */
  id: string;

  /** The user who earned it. */
  userId: string;

  /** Full name of the recipient at time of issue. */
  recipientName: string;

  /** Which course / subject the certificate covers. */
  courseSlug: string;
  courseTitle: string;

  /** Which exam was passed. */
  examId: string;
  examTitle: string;

  /** The specific attempt that earned this certificate. */
  attemptId: string;

  /** What the user scored. 0–100. */
  scorePercent: number;

  /** ISO 8601 — when the certificate was issued (attempt submission time). */
  issuedAt: string;

  /**
   * Human-readable certificate number, e.g. "FLX-DG-2025-0001".
   * Deterministic from the attempt ID so it never changes.
   */
  certificateNumber: string;

  /**
   * Short alphanumeric verification code, e.g. "A7F3K9".
   * Anyone with this code + the certificate number can verify authenticity.
   */
  verificationCode: string;

  /**
   * Optional ISO 8601 — when the certificate expires.
   * Undefined = never expires.
   */
  expiresAt?: string;
}

/**
 * A summary used in list views and dashboard widgets.
 */
export interface CertificateSummary {
  id: string;
  courseTitle: string;
  examTitle: string;
  scorePercent: number;
  issuedAt: string;
  certificateNumber: string;
}