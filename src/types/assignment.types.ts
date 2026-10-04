// ============================================================================
// src/types/assignment.types.ts
//
// Assignments, assignment progress, and calendar event types.
//
// An "assignment" is something a teacher wants a student to complete by a
// specific date. It can point at a lesson, an exam, a quiz, or be a
// free-form task.
//
// 🔌 AWS: Assignments → DynamoDB `assignments` table (PK: id,
//         GSI: assignedTo-userId, GSI: courseSlug).
//         Progress    → DynamoDB `assignment_progress`
//         (PK: userId, SK: assignmentId).
// ============================================================================

// ---------------------------------------------------------------------------
// Assignment types
// ---------------------------------------------------------------------------

/**
 * What kind of content the assignment points at.
 *
 *   lesson — a specific lesson inside a course (has a lessonId)
 *   exam   — a certification exam (has an examId)
 *   quiz   — an inline quiz lesson (has a lessonId)
 *   task   — a free-form task ("Write a 500-word summary of X")
 */
export type AssignmentType = 'lesson' | 'exam' | 'quiz' | 'task';

/**
 * Priority hint shown on the calendar and to-do list.
 */
export type AssignmentPriority = 'low' | 'normal' | 'high';

/**
 * A single assignment.
 *
 * Assignments are created by instructors and are visible to:
 *   - Specific students (if assignedTo is set), OR
 *   - Everyone enrolled in the course (if assignedTo is empty)
 */
export interface Assignment {
  id: string;

  /** The course this assignment belongs to. */
  courseSlug: string;

  /** Display title — "Read Chapter 3", "Practice exam", etc. */
  title: string;

  /** Longer description shown in the details view. */
  description?: string;

  /** What kind of content. Determines which page the item links to. */
  type: AssignmentType;

  /**
   * If type is 'lesson' or 'quiz', the lesson this points at.
   * Undefined for 'exam' and 'task'.
   */
  lessonId?: string;

  /**
   * If type is 'exam', the exam this points at.
   * Undefined for 'lesson', 'quiz', and 'task'.
   */
  examId?: string;

  /**
   * ISO 8601 timestamp — when this assignment is due.
   */
  dueAt: string;

  /**
   * When true, the assignment can be completed after dueAt (shown as
   * "Late" instead of "Overdue").
   */
  allowLateSubmission: boolean;

  /** Optional priority hint. */
  priority: AssignmentPriority;

  /** Instructor's User.id. */
  assignedBy: string;

  /** Display name of the instructor (denormalised). */
  assignedByName: string;

  /**
   * If set, the assignment is only visible to these user IDs.
   * If empty/undefined, visible to everyone enrolled in the course.
   */
  assignedTo?: string[];

  createdAt: string;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * A single student's progress on a single assignment.
 *
 * 🔌 AWS: DynamoDB `assignment_progress` table:
 *         PK: userId
 *         SK: assignmentId
 */
export interface AssignmentProgress {
  userId: string;
  assignmentId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  /** If the assignment links to a quiz or exam, the score. 0–100. */
  score?: number;
}

// ---------------------------------------------------------------------------
// Calendar view helpers
// ---------------------------------------------------------------------------

/**
 * A calendar entry is a normalised view of any dated thing that should
 * appear on a student's calendar — assignments, exam deadlines, and any
 * other time-bound items we add later.
 *
 * The calendar page builds a list of these from multiple sources
 * (assignments, attempts, exams) so the calendar can show everything
 * in one place.
 */
export interface CalendarEvent {
  id: string;
  kind: 'assignment' | 'exam-deadline' | 'course-access-expiry';
  title: string;
  description?: string;
  /** ISO 8601. */
  date: string;
  /** Which course this belongs to. */
  courseSlug: string;
  /** Where clicking the event should take the user. */
  href: string;
  priority: AssignmentPriority;
  /** Has the student completed this? Used to grey out finished items. */
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Derived / summary types
// ---------------------------------------------------------------------------

/**
 * A student's view of an assignment — the assignment plus their progress.
 */
export interface AssignmentWithProgress {
  assignment: Assignment;
  progress?: AssignmentProgress;
  /** Computed: how many days until due (negative = overdue). */
  daysUntilDue: number;
  /** Computed: 'upcoming' | 'due-soon' | 'overdue' | 'completed' | 'late'. */
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed' | 'late';
}

/**
 * Buckets used by the to-do list page and dashboard widget.
 */
export interface AssignmentsByUrgency {
  overdue: AssignmentWithProgress[];
  dueToday: AssignmentWithProgress[];
  dueThisWeek: AssignmentWithProgress[];
  upcoming: AssignmentWithProgress[];
  completed: AssignmentWithProgress[];
}