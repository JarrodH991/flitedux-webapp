// ============================================================================
// src/data/dev/devExams.ts
//
// ⚠️ DEV ONLY — stand-in for the DynamoDB `exams` table.
//
// An "Exam" here is a BLUEPRINT. It describes:
//   - Which subject it covers
//   - What the rules are (time limit, navigation, integrity controls)
//   - How to draw questions from the bank (the blueprint)
//
// Each candidate's actual attempt generates a fresh, randomised set of
// questions from this blueprint. That generation happens in
// src/services/api.ts → startAttempt().
//
// 🔌 AWS: DynamoDB table `exams`. PK: id. GSI: subjectId-index.
//         Compiled question sets for audit are written to S3 with Object
//         Lock so they cannot be altered after the fact.
// ============================================================================

import type { Exam } from '../../types/exam.types';

export const devExams: Exam[] = [
  // ========================================================================
  // DANGEROUS GOODS — Initial Certification
  // ========================================================================
  {
    id: 'exam-dg-initial',
    subjectId: 'subj-dg',
    title: 'Dangerous Goods — Initial Certification',
    description:
      'Initial certification exam covering all five DG modules. High-stakes, proctored, requires identity verification and full lockdown.',

    rules: {
      timeLimitMinutes: 60,

      allowBackwardNavigation: true,
      allowFlagging: true,
      allowReviewBeforeSubmit: true,

      randomiseQuestionOrder: true,
      randomiseAnswerOrder: true,

      requireRulesAcknowledgment: true,

      integrity: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        maxTabSwitches: 3,
        blockCopyPaste: true,
        blockRightClick: true,
        blockDevTools: true,
        requireWebcam: true,
        requireIdVerification: true,
        requireSystemCheck: true,
      },

      passMarkPercent: 80,
    },

    blueprint: {
      perModule: {
        'mod-dg-classification': { easy: 1, medium: 1, hard: 1 },
        'mod-dg-packing': { easy: 1, medium: 1, hard: 1 },
        'mod-dg-documentation': { easy: 1, medium: 1, hard: 0 },
        'mod-dg-acceptance': { easy: 0, medium: 1, hard: 1 },
        'mod-dg-emergency': { easy: 0, medium: 1, hard: 1 },
      },
      totalQuestions: 13,
    },

    active: true,
    version: 3,

    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-08-14T11:20:00Z',
    createdBy: 'user-admin-001',
  },

  // ========================================================================
  // DANGEROUS GOODS — Recurrent / Refresher
  // ========================================================================
  {
    id: 'exam-dg-recurrent',
    subjectId: 'subj-dg',
    title: 'Dangerous Goods — Recurrent Training',
    description:
      'Recurrent certification exam for previously certified personnel. Shorter, focused on regulatory updates and safety-critical items.',

    rules: {
      timeLimitMinutes: 45,

      allowBackwardNavigation: true,
      allowFlagging: true,
      allowReviewBeforeSubmit: true,

      randomiseQuestionOrder: true,
      randomiseAnswerOrder: true,

      requireRulesAcknowledgment: true,

      integrity: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        maxTabSwitches: 5,
        blockCopyPaste: true,
        blockRightClick: true,
        blockDevTools: false, // relaxed for recurrent — still detection
        requireWebcam: true,
        requireIdVerification: true,
        requireSystemCheck: true,
      },

      passMarkPercent: 80,
    },

    blueprint: {
      perModule: {
        'mod-dg-classification': { easy: 1, medium: 1, hard: 0 },
        'mod-dg-packing': { easy: 0, medium: 1, hard: 1 },
        'mod-dg-documentation': { easy: 1, medium: 0, hard: 0 },
        'mod-dg-acceptance': { easy: 0, medium: 1, hard: 0 },
        'mod-dg-emergency': { easy: 0, medium: 1, hard: 1 },
      },
      totalQuestions: 9,
    },

    active: true,
    version: 2,

    createdAt: '2025-02-05T10:00:00Z',
    updatedAt: '2025-07-22T14:45:00Z',
    createdBy: 'user-admin-001',
  },

  // ========================================================================
  // AVSEC — Awareness
  // ========================================================================
  {
    id: 'exam-avsec-awareness',
    subjectId: 'subj-avsec',
    title: 'Aviation Security (AVSEC) Awareness',
    description:
      'Security awareness certification exam covering threat identification, hijack response, access control, and regulatory compliance.',

    rules: {
      timeLimitMinutes: 45,

      allowBackwardNavigation: true,
      allowFlagging: true,
      allowReviewBeforeSubmit: true,

      randomiseQuestionOrder: true,
      randomiseAnswerOrder: true,

      requireRulesAcknowledgment: true,

      integrity: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        maxTabSwitches: 3,
        blockCopyPaste: true,
        blockRightClick: true,
        blockDevTools: true,
        requireWebcam: true,
        requireIdVerification: true,
        requireSystemCheck: true,
      },

      passMarkPercent: 75,
    },

    blueprint: {
      perModule: {
        'mod-avsec-threat': { easy: 1, medium: 1, hard: 0 },
        'mod-avsec-hijack': { easy: 0, medium: 1, hard: 1 },
        'mod-avsec-access': { easy: 1, medium: 0, hard: 0 },
        'mod-avsec-compliance': { easy: 0, medium: 1, hard: 1 },
      },
      totalQuestions: 8,
    },

    active: true,
    version: 2,

    createdAt: '2025-01-25T08:00:00Z',
    updatedAt: '2025-09-03T16:10:00Z',
    createdBy: 'user-admin-001',
  },

  // ========================================================================
  // AVSEC — Practice / Low-Stakes
  //
  // Demonstrates a LOWER-stakes exam with relaxed integrity controls.
  // Useful for training before the real thing.
  // ========================================================================
  {
    id: 'exam-avsec-practice',
    subjectId: 'subj-avsec',
    title: 'Aviation Security — Practice Exam',
    description:
      'Unproctored practice exam for familiarisation. No identity verification, no proctoring, unlimited time.',

    rules: {
      timeLimitMinutes: 0, // 0 = no time limit

      allowBackwardNavigation: true,
      allowFlagging: false,
      allowReviewBeforeSubmit: true,

      randomiseQuestionOrder: true,
      randomiseAnswerOrder: false,

      requireRulesAcknowledgment: false,

      integrity: {
        enforceFullscreen: false,
        detectTabSwitch: false,
        maxTabSwitches: 0,
        blockCopyPaste: false,
        blockRightClick: false,
        blockDevTools: false,
        requireWebcam: false,
        requireIdVerification: false,
        requireSystemCheck: false,
      },

      passMarkPercent: 70,
    },

    blueprint: {
      perModule: {
        'mod-avsec-threat': { easy: 1, medium: 1, hard: 0 },
        'mod-avsec-hijack': { easy: 0, medium: 1, hard: 1 },
        'mod-avsec-access': { easy: 1, medium: 0, hard: 0 },
        'mod-avsec-compliance': { easy: 0, medium: 1, hard: 0 },
      },
      totalQuestions: 6,
    },

    active: true,
    version: 1,

    createdAt: '2025-06-10T09:30:00Z',
    updatedAt: '2025-06-10T09:30:00Z',
    createdBy: 'user-admin-001',
  },
];

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

export function getExamById(id: string): Exam | undefined {
  return devExams.find((e) => e.id === id);
}

export function getExamsForSubject(subjectId: string): Exam[] {
  return devExams.filter((e) => e.subjectId === subjectId && e.active);
}

export function getActiveExams(): Exam[] {
  return devExams.filter((e) => e.active);
}

/**
 * Calculate total time or duration for an exam blueprint in human-readable form.
 * Returns 'No time limit' if timeLimitMinutes is 0.
 */
export function describeTimeLimit(minutes: number): string {
  if (minutes === 0) return 'No time limit';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours}h ${remaining}m`;
}