// ============================================================================
// src/data/dev/devAttempts.ts
//
// ⚠️ DEV ONLY — stand-in for the DynamoDB `attempts` table.
//
// An Attempt is one candidate's actual run at one Exam. It captures:
//   - Which exam, which version, which candidate
//   - The exact questions served (questionIds, in order)
//   - The candidate's answers (with timestamps and time spent)
//   - Timing (startedAt, submittedAt, deadlineAt)
//   - Score, pass/fail, per-module breakdown
//   - Proctoring events that occurred
//   - The random seed used, so the exact delivery can be reconstructed
//
// Some attempts here are in different states on purpose so the dashboard
// can demonstrate all of them: completed, in-progress, auto-submitted,
// and invalidated.
//
// 🔌 AWS: DynamoDB table `attempts`. PK: id. GSI: userId-index (for
//         "give me this candidate's attempts"), examId-index (for
//         analytics), subjectId-index.
//
//         Consider TTL on old attempts if regulations allow. For high-
//         stakes exams, keep them for the regulatory retention period —
//         usually 5+ years — with S3 archival for cold storage.
// ============================================================================

import type { Attempt } from '../../types/exam.types';

export const devAttempts: Attempt[] = [
  // ========================================================================
  // CANDIDATE 001 — a completed DG Initial attempt (passed)
  // ========================================================================
  {
    id: 'attempt-001',
    examId: 'exam-dg-initial',
    examVersion: 3,
    userId: 'user-candidate-001',
    subjectId: 'subj-dg',

    status: 'submitted',

    questionIds: [
      'q-dg-class-002',
      'q-dg-class-003',
      'q-dg-class-004',
      'q-dg-pack-001',
      'q-dg-pack-002',
      'q-dg-pack-003',
      'q-dg-doc-001',
      'q-dg-doc-002',
      'q-dg-accept-001',
      'q-dg-accept-002',
      'q-dg-emerg-001',
      'q-dg-emerg-002',
      'q-dg-class-001',
    ],

    answers: {
      'q-dg-class-002': {
        questionId: 'q-dg-class-002',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:03:22Z',
        timeSpentSeconds: 42,
      },
      'q-dg-class-003': {
        questionId: 'q-dg-class-003',
        selectedOptionIds: ['b'],
        flaggedForReview: true,
        answeredAt: '2025-09-15T09:06:10Z',
        timeSpentSeconds: 168,
      },
      'q-dg-class-004': {
        questionId: 'q-dg-class-004',
        selectedOptionIds: ['a', 'b', 'c', 'd'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:07:55Z',
        timeSpentSeconds: 105,
      },
      'q-dg-pack-001': {
        questionId: 'q-dg-pack-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:09:12Z',
        timeSpentSeconds: 77,
      },
      'q-dg-pack-002': {
        questionId: 'q-dg-pack-002',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:11:30Z',
        timeSpentSeconds: 138,
      },
      'q-dg-pack-003': {
        questionId: 'q-dg-pack-003',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:12:48Z',
        timeSpentSeconds: 78,
      },
      'q-dg-doc-001': {
        questionId: 'q-dg-doc-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:13:40Z',
        timeSpentSeconds: 52,
      },
      'q-dg-doc-002': {
        questionId: 'q-dg-doc-002',
        selectedOptionIds: ['c'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:15:12Z',
        timeSpentSeconds: 92,
      },
      'q-dg-accept-001': {
        questionId: 'q-dg-accept-001',
        selectedOptionIds: ['c'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:16:30Z',
        timeSpentSeconds: 78,
      },
      'q-dg-accept-002': {
        questionId: 'q-dg-accept-002',
        selectedOptionIds: ['c'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:18:44Z',
        timeSpentSeconds: 134,
      },
      'q-dg-emerg-001': {
        questionId: 'q-dg-emerg-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:19:50Z',
        timeSpentSeconds: 66,
      },
      'q-dg-emerg-002': {
        questionId: 'q-dg-emerg-002',
        selectedOptionIds: ['a'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:21:15Z',
        timeSpentSeconds: 85,
      },
      'q-dg-class-001': {
        questionId: 'q-dg-class-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-15T09:22:00Z',
        timeSpentSeconds: 45,
      },
    },

    startedAt: '2025-09-15T09:02:00Z',
    submittedAt: '2025-09-15T09:22:30Z',
    deadlineAt: '2025-09-15T10:02:00Z',

    scorePercent: 92,
    passed: true,

    moduleBreakdown: {
      'mod-dg-classification': { correct: 3, total: 3 },
      'mod-dg-packing': { correct: 3, total: 3 },
      'mod-dg-documentation': { correct: 2, total: 2 },
      'mod-dg-acceptance': { correct: 2, total: 2 },
      'mod-dg-emergency': { correct: 2, total: 2 },
    },

    proctorEventCount: 1,

    randomSeed: 'seed-dg-init-2025-09-15-a7f3',
  },

  // ========================================================================
  // CANDIDATE 001 — a completed AVSEC Awareness attempt (failed)
  // ========================================================================
  {
    id: 'attempt-002',
    examId: 'exam-avsec-awareness',
    examVersion: 2,
    userId: 'user-candidate-001',
    subjectId: 'subj-avsec',

    status: 'submitted',

    questionIds: [
      'q-avsec-threat-001',
      'q-avsec-threat-002',
      'q-avsec-hijack-001',
      'q-avsec-hijack-002',
      'q-avsec-access-001',
      'q-avsec-access-002',
      'q-avsec-comply-001',
      'q-avsec-comply-002',
    ],

    answers: {
      'q-avsec-threat-001': {
        questionId: 'q-avsec-threat-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:04:10Z',
        timeSpentSeconds: 55,
      },
      'q-avsec-threat-002': {
        questionId: 'q-avsec-threat-002',
        selectedOptionIds: ['c'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:06:22Z',
        timeSpentSeconds: 132,
      },
      'q-avsec-hijack-001': {
        questionId: 'q-avsec-hijack-001',
        selectedOptionIds: ['a'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:08:05Z',
        timeSpentSeconds: 103,
      },
      'q-avsec-hijack-002': {
        questionId: 'q-avsec-hijack-002',
        selectedOptionIds: ['a'],
        flaggedForReview: true,
        answeredAt: '2025-09-20T14:11:44Z',
        timeSpentSeconds: 219,
      },
      'q-avsec-access-001': {
        questionId: 'q-avsec-access-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:12:50Z',
        timeSpentSeconds: 66,
      },
      'q-avsec-access-002': {
        questionId: 'q-avsec-access-002',
        selectedOptionIds: ['false'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:13:20Z',
        timeSpentSeconds: 30,
      },
      'q-avsec-comply-001': {
        questionId: 'q-avsec-comply-001',
        selectedOptionIds: ['a'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:15:00Z',
        timeSpentSeconds: 100,
      },
      'q-avsec-comply-002': {
        questionId: 'q-avsec-comply-002',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-09-20T14:16:45Z',
        timeSpentSeconds: 105,
      },
    },

    startedAt: '2025-09-20T14:03:00Z',
    submittedAt: '2025-09-20T14:17:10Z',
    deadlineAt: '2025-09-20T14:48:00Z',

    scorePercent: 62.5,
    passed: false,

    moduleBreakdown: {
      'mod-avsec-threat': { correct: 2, total: 2 },
      'mod-avsec-hijack': { correct: 0, total: 2 },
      'mod-avsec-access': { correct: 2, total: 2 },
      'mod-avsec-compliance': { correct: 1, total: 2 },
    },

    proctorEventCount: 2,

    randomSeed: 'seed-avsec-awareness-2025-09-20-b2e8',
  },

  // ========================================================================
  // CANDIDATE 001 — an IN-PROGRESS attempt (right now, hypothetical)
  // ========================================================================
  {
    id: 'attempt-003',
    examId: 'exam-dg-recurrent',
    examVersion: 2,
    userId: 'user-candidate-001',
    subjectId: 'subj-dg',

    status: 'in-progress',

    questionIds: [
      'q-dg-class-001',
      'q-dg-class-002',
      'q-dg-pack-002',
      'q-dg-pack-003',
      'q-dg-doc-001',
      'q-dg-accept-001',
      'q-dg-emerg-001',
      'q-dg-emerg-002',
      'q-dg-class-004',
    ],

    answers: {
      'q-dg-class-001': {
        questionId: 'q-dg-class-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-10-01T10:02:15Z',
        timeSpentSeconds: 38,
      },
      'q-dg-class-002': {
        questionId: 'q-dg-class-002',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-10-01T10:03:05Z',
        timeSpentSeconds: 50,
      },
      // Only 2 answered so far — the rest are still pending
    },

    startedAt: '2025-10-01T10:01:00Z',
    // no submittedAt yet
    deadlineAt: '2025-10-01T10:46:00Z',

    // no score yet
    // no passed yet

    proctorEventCount: 0,

    randomSeed: 'seed-dg-rec-2025-10-01-c9d1',
  },

  // ========================================================================
  // CANDIDATE 001 — an AUTO-SUBMITTED attempt (server force-submitted)
  //
  // Demonstrates what happens when the deadline hits while the candidate
  // is still working. The status is 'auto-submitted', the answers are
  // whatever was saved at the time of the deadline.
  // ========================================================================
  {
    id: 'attempt-004',
    examId: 'exam-avsec-practice',
    examVersion: 1,
    userId: 'user-candidate-001',
    subjectId: 'subj-avsec',

    status: 'auto-submitted',

    questionIds: [
      'q-avsec-threat-001',
      'q-avsec-threat-002',
      'q-avsec-hijack-001',
      'q-avsec-hijack-002',
      'q-avsec-access-001',
      'q-avsec-comply-001',
    ],

    answers: {
      'q-avsec-threat-001': {
        questionId: 'q-avsec-threat-001',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-08-12T15:02:05Z',
        timeSpentSeconds: 60,
      },
      'q-avsec-threat-002': {
        questionId: 'q-avsec-threat-002',
        selectedOptionIds: ['c'],
        flaggedForReview: false,
        answeredAt: '2025-08-12T15:04:30Z',
        timeSpentSeconds: 145,
      },
      'q-avsec-hijack-001': {
        questionId: 'q-avsec-hijack-001',
        selectedOptionIds: [],
        flaggedForReview: false,
        answeredAt: '2025-08-12T15:05:00Z',
        timeSpentSeconds: 30,
      },
      // Some questions left unanswered
    },

    startedAt: '2025-08-12T15:01:00Z',
    submittedAt: '2025-08-12T15:16:00Z',
    deadlineAt: '2025-08-12T15:16:00Z',

    scorePercent: 50,
    passed: false,

    moduleBreakdown: {
      'mod-avsec-threat': { correct: 2, total: 2 },
      'mod-avsec-hijack': { correct: 0, total: 2 },
      'mod-avsec-access': { correct: 0, total: 1 },
      'mod-avsec-compliance': { correct: 0, total: 1 },
    },

    proctorEventCount: 0,

    randomSeed: 'seed-avsec-practice-2025-08-12-d3f7',
  },

  // ========================================================================
  // CANDIDATE 001 — an INVALIDATED attempt (integrity violation)
  //
  // Demonstrates what happens when proctoring rules are broken beyond the
  // allowed threshold. The score is still computed (for audit), but
  // 'passed' is false and the certificate is not issued.
  // ========================================================================
  {
    id: 'attempt-005',
    examId: 'exam-dg-initial',
    examVersion: 3,
    userId: 'user-candidate-001',
    subjectId: 'subj-dg',

    status: 'invalidated',

    questionIds: [
      'q-dg-class-002',
      'q-dg-class-003',
      'q-dg-class-004',
      'q-dg-pack-001',
      'q-dg-pack-002',
      'q-dg-pack-003',
      'q-dg-doc-001',
      'q-dg-doc-002',
      'q-dg-accept-001',
      'q-dg-accept-002',
      'q-dg-emerg-001',
      'q-dg-emerg-002',
      'q-dg-class-001',
    ],

    answers: {
      'q-dg-class-002': {
        questionId: 'q-dg-class-002',
        selectedOptionIds: ['b'],
        flaggedForReview: false,
        answeredAt: '2025-07-04T11:02:10Z',
        timeSpentSeconds: 40,
      },
      // ... other answers omitted for brevity — think of this as a
      // candidate who answered a few questions then got flagged
    },

    startedAt: '2025-07-04T11:01:00Z',
    submittedAt: '2025-07-04T11:08:22Z',
    deadlineAt: '2025-07-04T12:01:00Z',

    scorePercent: 15,
    passed: false,

    proctorEventCount: 5, // exceeded the maxTabSwitches: 3 threshold

    randomSeed: 'seed-dg-init-2025-07-04-e5a2',
  },
];

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

export function getAttemptById(id: string): Attempt | undefined {
  return devAttempts.find((a) => a.id === id);
}

export function getAttemptsForUser(userId: string): Attempt[] {
  return devAttempts
    .filter((a) => a.userId === userId)
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
}

export function getAttemptsForExam(examId: string): Attempt[] {
  return devAttempts.filter((a) => a.examId === examId);
}

export function getAttemptsForSubject(subjectId: string): Attempt[] {
  return devAttempts.filter((a) => a.subjectId === subjectId);
}

/**
 * Return the most recent attempt for a given user + exam combination.
 * Used by the dashboard to show "your last attempt at this exam".
 */
export function getLatestAttemptForUserExam(
  userId: string,
  examId: string,
): Attempt | undefined {
  const matching = devAttempts
    .filter((a) => a.userId === userId && a.examId === examId)
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
  return matching[0];
}

/**
 * Return all attempts that passed, for certificate listing.
 */
export function getPassedAttemptsForUser(userId: string): Attempt[] {
  return devAttempts.filter((a) => a.userId === userId && a.passed === true);
}

/**
 * Compute a simple summary object for a user. Used on the dashboard.
 */
export function getAttemptSummaryForUser(userId: string): {
  totalAttempts: number;
  passed: number;
  failed: number;
  inProgress: number;
  invalidated: number;
  averageScore: number;
} {
  const attempts = devAttempts.filter((a) => a.userId === userId);
  const scored = attempts.filter((a) => typeof a.scorePercent === 'number');

  return {
    totalAttempts: attempts.length,
    passed: attempts.filter((a) => a.passed === true).length,
    failed: attempts.filter((a) => a.passed === false && a.status !== 'invalidated').length,
    inProgress: attempts.filter((a) => a.status === 'in-progress').length,
    invalidated: attempts.filter((a) => a.status === 'invalidated').length,
    averageScore:
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, a) => sum + (a.scorePercent ?? 0), 0) /
              scored.length,
          )
        : 0,
  };
}

// ---------------------------------------------------------------------------
// DEV-ONLY PERSISTENCE
//
// Save attempts to localStorage so they survive a page reload during
// development. Without this, refreshing the browser wipes your in-progress
// attempts, which makes testing the resume flow impossible.
//
// 🔌 AWS: In production, this is unnecessary — DynamoDB persists across
//         everything. Delete this block when you wire up the real backend.
// ---------------------------------------------------------------------------

const DEV_ATTEMPTS_STORAGE_KEY = 'flitedux_dev_attempts_v1';

function loadPersistedAttempts(): Attempt[] | null {
  try {
    const raw = localStorage.getItem(DEV_ATTEMPTS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Attempt[];
  } catch {
    return null;
  }
}

function persistAttempts(attempts: Attempt[]): void {
  try {
    localStorage.setItem(DEV_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    /* storage full or disabled — ignore */
  }
}

// Hydrate from localStorage on module load, falling back to the seed data
const persisted = loadPersistedAttempts();
if (persisted && persisted.length > 0) {
  devAttempts.length = 0;
  devAttempts.push(...persisted);
}

// Expose a function to persist after mutations
export function persistDevAttempts(): void {
  persistAttempts(devAttempts);
}

/**
 * Dev-only reset. Call this from the browser console if you need to
 * wipe the persisted attempts and go back to the seed data.
 *
 *   import('/src/data/dev/devAttempts.ts').then(m => m.resetDevAttempts())
 */
export function resetDevAttempts(): void {
  try {
    localStorage.removeItem(DEV_ATTEMPTS_STORAGE_KEY);
    window.location.reload();
  } catch {
    /* ignore */
  }
}