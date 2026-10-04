// ============================================================================
// src/types/exam.types.ts
//
// Generic, subject-agnostic type definitions for the exam system.
//
// ⚠️ IMPORTANT ARCHITECTURE NOTE
// ---------------------------------------------------------------------------
// This file NEVER mentions "Dangerous Goods", "AVSEC", or any specific
// subject. Everything is generic. New subjects (Cabin Crew, RVSM, etc.)
// are ADDED AS DATA, not as code changes.
//
// The words "DG" and "AVSEC" only appear in the seed data files under
// src/data/dev/. They are just values in generic fields.
// ============================================================================

// ---------------------------------------------------------------------------
// Roles & Users
// ---------------------------------------------------------------------------

/**
 * User roles. A user can have multiple roles (e.g. an instructor who is
 * also an auditor).
 *
 * 🔌 AWS: When you wire up Cognito, roles are stored in the `cognito:groups`
 *         claim on the JWT. You'll read them from the decoded token.
 *
 * 🔌 AWS ALTERNATIVE: If you use a custom user table in DynamoDB instead of
 *         Cognito groups, store roles as a string array on the user record.
 */
export type UserRole = 'candidate' | 'instructor' | 'admin' | 'auditor';

/**
 * A user of the platform.
 */
export interface User {
  id: string;                      // UUID
  email: string;
  displayName: string;
  roles: UserRole[];
  mfaEnabled: boolean;
  createdAt: string;               // ISO 8601 timestamp
  lastLoginAt?: string;            // ISO 8601
  /**
   * Which subject(s) this user is allowed to see as an instructor/admin.
   * Empty array = all subjects (admin default).
   * Used by the RBAC layer.
   */
  subjectScope?: string[];         // subject IDs
}

/**
 * A short-lived authentication session.
 */
export interface AuthSession {
  user: User;
  token: string;                   // JWT in production
  expiresAt: string;               // ISO 8601
  mfaVerified: boolean;
}

// ---------------------------------------------------------------------------
// Subjects, Modules, Competencies
// ---------------------------------------------------------------------------

/**
 * A subject is the top-level category of training content. Examples:
 * "Dangerous Goods", "Aviation Security", "Cabin Crew Safety".
 *
 * Subjects are ADDED VIA DATA (admin UI later, or seed data now).
 */
export interface Subject {
  id: string;                      // e.g. 'subj-dg'
  name: string;                    // e.g. 'Dangerous Goods'
  code: string;                    // e.g. 'DG'
  description: string;
  regulatoryAuthority: string;     // e.g. 'SACAA', 'ICAO', 'IATA'
  active: boolean;                 // soft-disable without deleting
  createdAt: string;
}

/**
 * A module is a subdivision within a subject. Examples within Dangerous Goods:
 * "Classification", "Packing", "Documentation", "Emergency Response".
 */
export interface Module {
  id: string;                      // e.g. 'mod-dg-classification'
  subjectId: string;               // FK → Subject.id
  name: string;
  description: string;
  order: number;                   // for display ordering
}

/**
 * A CBTA competency (Competency-Based Training and Assessment).
 * ICAO-aligned. These are the "what the candidate must be able to do".
 */
export interface Competency {
  id: string;                      // e.g. 'comp-dg-apply-regs'
  subjectId: string;               // FK → Subject.id
  name: string;                    // e.g. 'Apply DG regulations correctly'
  description: string;
  cbtaLevel?: 'basic' | 'intermediate' | 'advanced';
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/**
 * The kinds of questions the system supports. This is intentionally a small
 * set that covers most aviation exams. Extend as needed.
 */
export type QuestionType =
  | 'mcq'            // Multiple choice, single correct answer
  | 'multi-select'   // Multiple choice, multiple correct answers
  | 'scenario'       // Scenario-based MCQ (longer stem, same mechanics)
  | 'true-false';    // True/false

/**
 * Difficulty rating used for randomised exam assembly.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Compliance flags that tell the exam engine how to treat a question.
 * These are generic — you attach any flags you need.
 */
export type QuestionFlag =
  | 'high-stakes'         // requires extra integrity controls
  | 'proctored'           // must be delivered in a proctored session
  | 'regulatory'          // quoted directly from regulation (audit)
  | 'safety-critical'     // safety outcome depends on correct answer
  | 'restricted';         // extra RBAC protection on view/edit

/**
 * A single answer option for MCQ / multi-select / scenario questions.
 */
export interface AnswerOption {
  id: string;                      // e.g. 'a', 'b', 'c', 'd'
  text: string;
  isCorrect: boolean;
}

/**
 * A question in the question bank.
 *
 * 🔌 AWS: Stored in DynamoDB table `questions`.
 *         Primary key: subjectId (partition), id (sort).
 *         GSI on moduleId and competencyId for filtering.
 *         The `isCorrect` field on options should be STRIPPED before
 *         sending to the candidate's browser. See services/api.ts.
 */
export interface Question {
  id: string;                      // UUID
  subjectId: string;               // FK → Subject.id
  moduleId: string;                // FK → Module.id
  competencyId: string;            // FK → Competency.id

  type: QuestionType;
  difficulty: Difficulty;
  flags: QuestionFlag[];

  /** The question text shown to the candidate. */
  stem: string;

  /** Optional context for scenario questions. */
  scenario?: string;

  /** Answer options. For true-false, only two (id 'true' / 'false'). */
  options: AnswerOption[];

  /** Human-readable explanation shown after the exam. */
  explanation?: string;

  /** Regulatory reference (e.g. "ICAO Doc 9284, Part 4"). */
  reference?: string;

  /**
   * Version of this question. Bumping it invalidates cached versions and
   * forces audit trails to reference the new revision.
   */
  version: number;

  createdAt: string;
  updatedAt: string;
  createdBy: string;               // User.id
}

/**
 * The version of a Question shown to a candidate — with `isCorrect`
 * stripped out so the answer key never reaches the browser.
 */
export interface QuestionForCandidate extends Omit<Question, 'options'> {
  options: Omit<AnswerOption, 'isCorrect'>[];
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

/**
 * Rules that govern how an exam is delivered. All optional with sensible
 * defaults so you can create a "plain" exam without specifying everything.
 */
export interface ExamRules {
  /** Time limit in minutes. Server enforces. */
  timeLimitMinutes: number;

  /** Can the candidate go back to a previous question? */
  allowBackwardNavigation: boolean;

  /** Can the candidate flag questions for review? */
  allowFlagging: boolean;

  /** Can the candidate review and change answers before submitting? */
  allowReviewBeforeSubmit: boolean;

  /** Randomise the order of questions per attempt. */
  randomiseQuestionOrder: boolean;

  /** Randomise the order of answer options per question per attempt. */
  randomiseAnswerOrder: boolean;

  /**
   * Whether the candidate must acknowledge the rules before starting.
   * Almost always true for high-stakes.
   */
  requireRulesAcknowledgment: boolean;

  /**
   * Integrity controls. Enable per-exam based on stakes.
   * In the browser, these are best-effort. Real lockdown is native.
   */
  integrity: {
    enforceFullscreen: boolean;        // request fullscreen, warn on exit
    detectTabSwitch: boolean;          // count tab visibility changes
    maxTabSwitches: number;            // 0 = no limit (unusual)
    blockCopyPaste: boolean;           // intercept copy/paste/cut
    blockRightClick: boolean;
    blockDevTools: boolean;            // best-effort via key combos
    requireWebcam: boolean;
    requireIdVerification: boolean;    // preflight ID step
    requireSystemCheck: boolean;       // preflight webcam/mic test
  };

  /** Pass mark as a percentage (0–100). */
  passMarkPercent: number;
}

/**
 * How questions are selected to build each candidate's exam.
 */
export interface ExamBlueprint {
  /**
   * How many questions to draw per module, broken down by difficulty.
   * Example: { 'mod-dg-classification': { easy: 3, medium: 2, hard: 1 } }
   */
  perModule: Record<string, { easy: number; medium: number; hard: number }>;

  /** Total questions on the exam (must equal the sum of perModule). */
  totalQuestions: number;
}

/**
 * An exam definition. Reusable across many candidates. Each attempt
 * generates a fresh set of questions based on the blueprint and rules.
 *
 * 🔌 AWS: DynamoDB table `exams`. Also stores compiled question sets in S3
 *         for audit immutability (see services/api.ts).
 */
export interface Exam {
  id: string;                      // UUID
  subjectId: string;               // FK → Subject.id
  title: string;                   // e.g. "Dangerous Goods — Initial Certification"
  description: string;

  rules: ExamRules;
  blueprint: ExamBlueprint;

  active: boolean;
  version: number;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Attempts (candidate's actual exam session)
// ---------------------------------------------------------------------------

export type AttemptStatus =
  | 'not-started'
  | 'in-progress'
  | 'submitted'
  | 'auto-submitted'      // server-submitted due to timeout or disconnect
  | 'under-review'        // flagged for human review
  | 'invalidated';        // integrity violation

/**
 * One candidate's answer to one question, within a specific attempt.
 */
export interface Answer {
  questionId: string;
  selectedOptionIds: string[];      // supports multi-select
  flaggedForReview: boolean;
  answeredAt: string;               // ISO 8601
  timeSpentSeconds: number;
}

/**
 * An integrity event logged during an attempt.
 *
 * 🔌 AWS: Written to DynamoDB `proctor_events` table with attemptId (partition)
 *         and timestamp (sort). Also streamed to CloudWatch for real-time
 *         monitoring in production. Real proctoring integrations (ProctorU,
 *         Proctorio, etc.) will add richer events.
 */
export type ProctorEventType =
  | 'tab-switch'
  | 'fullscreen-exit'
  | 'copy-attempt'
  | 'cut-attempt'
  | 'paste-attempt'
  | 'right-click'
  | 'selection'
  | 'devtools-open-attempt'
  | 'webcam-disconnect'
  | 'webcam-reconnect'
  | 'idle-warning'
  | 'multiple-faces'                // from AI proctoring (future)
  | 'no-face-detected'              // from AI proctoring (future)
  | 'audio-anomaly';                // from AI proctoring (future)

export interface ProctorEvent {
  id: string;
  attemptId: string;
  type: ProctorEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;  // e.g. { from: 'exam', to: 'other' }
  severity: 'info' | 'warning' | 'critical';
}

/**
 * A single candidate's attempt at a specific exam.
 *
 * 🔌 AWS: DynamoDB `attempts` table. The `answers` object is stored as a
 *         map field, or split into a separate `answers` table if you expect
 *         to query per-question performance at scale.
 */
export interface Attempt {
  id: string;                      // UUID
  examId: string;                  // FK → Exam.id
  examVersion: number;             // which version of the exam
  userId: string;                  // FK → User.id
  subjectId: string;               // FK → Subject.id (denormalised for queries)

  status: AttemptStatus;

  /**
   * The exact questions served for this attempt, with the answer key
   * stripped for the candidate's browser but preserved on the server.
   */
  questionIds: string[];           // ordered
  answers: Record<string, Answer>; // keyed by questionId

  startedAt: string;               // ISO 8601
  submittedAt?: string;
  /** Server-computed deadline. Immutable once set. */
  deadlineAt: string;

  /** Score as a percentage (0–100), undefined until submitted. */
  scorePercent?: number;
  passed?: boolean;

  /** Per-module performance for analytics. */
  moduleBreakdown?: Record<
    string,
    { correct: number; total: number }
  >;

  /** Count of integrity events during this attempt. */
  proctorEventCount: number;

  /**
   * Random seed used to shuffle questions/answers for this attempt.
   * Stored so the exact delivery can be reconstructed for audit.
   */
  randomSeed: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/**
 * Actions recorded in the audit log. Every sensitive operation writes one.
 *
 * 🔌 AWS: DynamoDB `audit_log` table with append-only IAM policy.
 *         Optionally replicated to S3 with Object Lock for immutability.
 *         CloudTrail is a separate, complementary trail for AWS API calls.
 */
export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.mfa-verified'
  | 'exam.created'
  | 'exam.updated'
  | 'exam.deleted'
  | 'question.created'
  | 'question.updated'
  | 'question.deleted'
  | 'attempt.started'
  | 'attempt.submitted'
  | 'attempt.invalidated'
  | 'attempt.exported'
  | 'result.exported'
  | 'subject.created'
  | 'subject.updated';

export interface AuditEntry {
  id: string;
  actorId: string;                 // User.id
  actorEmail: string;              // denormalised for audit resilience
  action: AuditAction;
  entityType: 'user' | 'exam' | 'question' | 'attempt' | 'subject';
  entityId: string;
  timestamp: string;               // ISO 8601
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ---------------------------------------------------------------------------
// API envelope types (used by services/api.ts)
// ---------------------------------------------------------------------------

/**
 * Standard result wrapper so every API call has a consistent shape.
 * Success → { ok: true, data: T }
 * Failure → { ok: false, error: { code, message } }
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

/**
 * Standard pagination envelope for list endpoints.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}