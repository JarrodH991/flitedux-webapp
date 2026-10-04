// ============================================================================
// src/data/dev/devAssignments.ts
//
// ⚠️ DEV ONLY — stand-in for the DynamoDB `assignments` table.
//
// Seeds a handful of assignments so the calendar, to-do list, and dashboard
// widget have data to display. Some are for the AVSEC course, some for
// Dangerous Goods, and some are visible only to specific users.
//
// 🔌 AWS: DynamoDB `assignments` table with a GSI on `assignedTo-userId`
//         and another on `courseSlug`. Delete this file once the backend
//         is live.
// ============================================================================

import type {
  Assignment,
  AssignmentProgress,
} from '../../types/assignment.types';

// ---------------------------------------------------------------------------
// Helper: ISO timestamp N days from now (or in the past if negative)
// ---------------------------------------------------------------------------

function daysFromNow(days: number, hour = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// DEV ASSIGNMENTS
// ---------------------------------------------------------------------------
// Note: `assignedBy` uses a dev instructor user id
// ("user-instructor-001") so links to the assigner work in the mock.
// ---------------------------------------------------------------------------

export const devAssignments: Assignment[] = [
  // ==========================================================================
  // AVSEC AWARENESS — module-based assignments
  // ==========================================================================
  {
    id: 'assign-avsec-001',
    courseSlug: 'avsec-awareness',
    title: 'Read: What is Aviation Security?',
    description:
      'Read the first lesson of Module 1 and be ready to discuss the three pillars of aviation security in the next session.',
    type: 'lesson',
    lessonId: 'avsec-m1-l1',
    dueAt: daysFromNow(3), // in 3 days
    allowLateSubmission: true,
    priority: 'normal',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-2),
  },
  {
    id: 'assign-avsec-002',
    courseSlug: 'avsec-awareness',
    title: 'Watch: The Regulatory Landscape',
    description:
      'Watch the video lesson on ICAO Annex 17 and national regulations. Take notes on the three layers of regulation.',
    type: 'lesson',
    lessonId: 'avsec-m1-l2',
    dueAt: daysFromNow(6),
    allowLateSubmission: true,
    priority: 'normal',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-2),
  },
  {
    id: 'assign-avsec-003',
    courseSlug: 'avsec-awareness',
    title: 'Complete Module 1 Quiz',
    description:
      'Take the Module 1 knowledge check. You need 70% to pass. You can retry if you don\'t pass the first time.',
    type: 'quiz',
    lessonId: 'avsec-m1-l3',
    dueAt: daysFromNow(1, 23), // due end of tomorrow
    allowLateSubmission: true,
    priority: 'high',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-3),
  },
  {
    id: 'assign-avsec-004',
    courseSlug: 'avsec-awareness',
    title: 'Study behavioural indicators',
    description:
      'Review the behavioural indicators lesson before the practical session.',
    type: 'lesson',
    lessonId: 'avsec-m2-l1',
    dueAt: daysFromNow(10),
    allowLateSubmission: true,
    priority: 'low',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-1),
  },

  // ==========================================================================
  // DANGEROUS GOODS — module-based assignments
  // ==========================================================================
  {
    id: 'assign-dg-001',
    courseSlug: 'dangerous-goods',
    title: 'Read: The Nine Hazard Classes',
    description:
      'Learn the nine hazard classes. This is fundamental — every other decision about a DG shipment depends on correct classification.',
    type: 'lesson',
    lessonId: 'dg-m1-l1',
    dueAt: daysFromNow(2),
    allowLateSubmission: true,
    priority: 'high',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-1),
  },
  {
    id: 'assign-dg-002',
    courseSlug: 'dangerous-goods',
    title: 'Watch: UN Number System',
    description:
      'Watch the video on reading UN numbers. Practice by looking up five UN numbers of your choice on the ICAO TI.',
    type: 'lesson',
    lessonId: 'dg-m1-l2',
    dueAt: daysFromNow(5),
    allowLateSubmission: true,
    priority: 'normal',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-1),
  },
  {
    id: 'assign-dg-003',
    courseSlug: 'dangerous-goods',
    title: 'Complete Module 1 Quiz',
    description:
      'Module 1 knowledge check on classification. 70% pass mark.',
    type: 'quiz',
    lessonId: 'dg-m1-l3',
    dueAt: daysFromNow(4),
    allowLateSubmission: true,
    priority: 'normal',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-1),
  },

  // ==========================================================================
  // An OVERDUE assignment (due in the past) — to test the "overdue" state
  // ==========================================================================
  {
    id: 'assign-dg-overdue',
    courseSlug: 'dangerous-goods',
    title: 'Submit pre-course reading notes',
    description:
      'Submit a 1-page summary of the ICAO Technical Instructions structure that you read as pre-course prep.',
    type: 'task',
    dueAt: daysFromNow(-2), // 2 days ago
    allowLateSubmission: true,
    priority: 'high',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-7),
  },

  // ==========================================================================
  // An exam deadline — points at a real exam
  // ==========================================================================
  {
    id: 'assign-dg-exam',
    courseSlug: 'dangerous-goods',
    title: 'Take: DG Initial Certification Exam',
    description:
      'You must complete the DG Initial Certification exam by the end of next week. This is a proctored exam — read the pre-exam rules carefully.',
    type: 'exam',
    examId: 'exam-dg-initial',
    dueAt: daysFromNow(8, 23),
    allowLateSubmission: false, // exams don't allow late submission
    priority: 'high',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    createdAt: daysFromNow(-1),
  },

  // ==========================================================================
  // An assignment visible only to the specific candidate user
  // ==========================================================================
  {
    id: 'assign-personal-001',
    courseSlug: 'avsec-awareness',
    title: 'Personal follow-up: threat recognition',
    description:
      'Based on your previous quiz results, please review the threat recognition module again and come prepared to discuss specific examples.',
    type: 'lesson',
    lessonId: 'avsec-m2-l1',
    dueAt: daysFromNow(7),
    allowLateSubmission: true,
    priority: 'normal',
    assignedBy: 'user-instructor-001',
    assignedByName: 'Test Instructor',
    assignedTo: ['user-candidate-001'], // only visible to this user
    createdAt: daysFromNow(0, 9),
  },
];

// ---------------------------------------------------------------------------
// DEV PROGRESS
// ---------------------------------------------------------------------------
// A couple of already-completed assignments so the "completed" bucket on the
// to-do list has something to show.
// ---------------------------------------------------------------------------

export const devAssignmentProgress: AssignmentProgress[] = [
  {
    userId: 'user-candidate-001',
    assignmentId: 'assign-avsec-001',
    status: 'completed',
    startedAt: daysFromNow(-1),
    completedAt: daysFromNow(-1, 14),
  },
  {
    userId: 'user-candidate-001',
    assignmentId: 'assign-avsec-002',
    status: 'in-progress',
    startedAt: daysFromNow(-1, 10),
  },
];

// ---------------------------------------------------------------------------
// PERSISTENCE HELPERS (dev-only)
// ---------------------------------------------------------------------------
// 🔌 AWS: Delete this block when you wire up DynamoDB.
// ---------------------------------------------------------------------------

const DEV_PROGRESS_STORAGE_KEY = 'flitedux_dev_assignment_progress_v1';

export function readPersistedAssignmentProgress(): AssignmentProgress[] {
  try {
    const raw = localStorage.getItem(DEV_PROGRESS_STORAGE_KEY);
    if (!raw) return [...devAssignmentProgress];
    return JSON.parse(raw) as AssignmentProgress[];
  } catch {
    return [...devAssignmentProgress];
  }
}

export function persistAssignmentProgress(
  records: AssignmentProgress[],
): void {
  try {
    localStorage.setItem(
      DEV_PROGRESS_STORAGE_KEY,
      JSON.stringify(records),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Dev-only: reset all assignment progress.
 */
export function resetDevAssignmentProgress(): void {
  try {
    localStorage.removeItem(DEV_PROGRESS_STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log(
      '[DEV] Assignment progress cleared. Reload to see the change.',
    );
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// LOOKUPS
// ---------------------------------------------------------------------------

export function getAssignmentById(id: string): Assignment | undefined {
  return devAssignments.find((a) => a.id === id);
}

export function getAssignmentsForCourse(courseSlug: string): Assignment[] {
  return devAssignments.filter((a) => a.courseSlug === courseSlug);
}

/**
 * Get every assignment a specific user can see.
 * Visibility rules:
 *   - assignedTo is undefined/empty → visible to everyone
 *   - assignedTo contains the user id → visible to that user
 */
export function getVisibleAssignmentsForUser(
  userId: string,
): Assignment[] {
  return devAssignments.filter((a) => {
    if (!a.assignedTo || a.assignedTo.length === 0) return true;
    return a.assignedTo.includes(userId);
  });
}