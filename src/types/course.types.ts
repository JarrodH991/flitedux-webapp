// ============================================================================
// src/types/course.types.ts
//
// Course, enrolment, order, and learning-content types.
//
// The top half covers the course catalogue and commerce. The bottom half
// covers the actual learning content — modules, lessons, quizzes, and
// per-user progress.
//
// 🔌 AWS: Courses → DynamoDB `courses` table (PK: slug)
//         Content  → S3 (JSON blob per course) or DynamoDB `course_content`
//         Progress → DynamoDB `lesson_progress` (PK: userId, SK: lessonId)
// ============================================================================

// ============================================================================
// PART 1 — Catalogue & commerce
// ============================================================================

/**
 * A course in the catalogue.
 */
export interface Course {
  slug: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  accreditation: string;
  accessDurationDays?: number;

  /**
   * Hero image path (relative to /public). Shown as a wide banner at the
   * top of the course detail page.
   * Example: '/home/Course1.jpg'
   */
  image?: string;

  /**
   * Optional supporting image shown alongside the course overview text.
   * Leave undefined to skip that section.
   */
  overviewImage?: string;

  online?: {
    learn: string[];
    price?: string;
    duration?: string;
    purchaseUrl?: string;
  };
}

/**
 * A single course enrolment — one user has purchased one course.
 */
export interface Enrolment {
  id: string;
  userId: string;
  courseSlug: string;
  courseTitle: string;
  price: number;
  purchasedAt: string;
  /** ISO 8601 — when access expires. Undefined = lifetime. */
  expiresAt?: string;
  status: 'active' | 'expired' | 'refunded';
}

/**
 * A single checkout event.
 */
export interface Order {
  id: string;
  userId: string;
  items: Array<{
    courseSlug: string;
    courseTitle: string;
    price: number;
    accessDurationDays?: number;
  }>;
  total: number;
  purchasedAt: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

// ============================================================================
// PART 2 — Learning content
// ============================================================================
//
// A course has modules. A module has lessons. A lesson has content.
// Every lesson is one of three types: text, video, or quiz.
// ============================================================================

/**
 * The full learning content tree for a course.
 *
 * 🔌 AWS: Stored as one JSON document per course. Small enough that a
 *         single S3 object or DynamoDB item is fine (even a course with
 *         50 lessons is well under DynamoDB's 400 KB item limit).
 */
export interface CourseContent {
  courseSlug: string;
  modules: ContentModule[];
  /** Optional intro shown before module 1. */
  introduction?: string;
  /** Optional outro shown after the last lesson. */
  conclusion?: string;
}

/**
 * A section within a course. E.g. "Introduction to Aviation Security".
 */
export interface ContentModule {
  id: string;
  title: string;
  description?: string;
  /** Display order — 1-based. */
  order: number;
  lessons: Lesson[];
}

// ---------------------------------------------------------------------------
// Lessons — a discriminated union on `type`
// ---------------------------------------------------------------------------

export type LessonType = 'text' | 'video' | 'quiz';

/**
 * Fields shared by every lesson, regardless of type.
 */
interface BaseLesson {
  id: string;
  title: string;
  /** Rough time estimate in minutes, shown in the sidebar. */
  estimatedMinutes?: number;
  /** Optional short description. */
  description?: string;
}

/**
 * A text lesson — prose, headings, images, lists.
 *
 * The `content` field is an array of blocks. Each block is a small,
 * self-contained piece of content. This is a mini content model that's
 * easy to render and easy to author.
 */
export interface TextLesson extends BaseLesson {
  type: 'text';
  content: ContentBlock[];
}

/**
 * A video lesson — embeds an external player (YouTube, Vimeo, or
 * self-hosted MP4 URL).
 */
export interface VideoLesson extends BaseLesson {
  type: 'video';
  /** YouTube video ID, Vimeo ID, or a full URL. */
  videoUrl: string;
  /** Optional source — defaults to YouTube if just an ID is given. */
  videoProvider?: 'youtube' | 'vimeo' | 'mp4';
  /** Optional transcript or notes shown below the video. */
  transcript?: string;
  /** Optional extra reading. */
  notes?: ContentBlock[];
}

/**
 * A quiz lesson — a set of questions with instant feedback.
 *
 * Quizzes here are "learning checkpoints", not certification exams.
 * They're not proctored and don't affect certification. Different
 * from the exam system entirely.
 */
export interface QuizLesson extends BaseLesson {
  type: 'quiz';
  questions: QuizQuestion[];
  /** Minimum % to pass. Default 70. */
  passMarkPercent?: number;
  /** Can the candidate retry? Default true. */
  allowRetry?: boolean;
}

/**
 * A question within a quiz lesson.
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  /** Shown after the user answers, right or wrong. */
  explanation?: string;
}

export type Lesson = TextLesson | VideoLesson | QuizLesson;

// ---------------------------------------------------------------------------
// Content blocks — the mini content model for text lessons
// ---------------------------------------------------------------------------

export type ContentBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'success'; title?: string; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'code'; language?: string; code: string }
  | { type: 'divider' };

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

/**
 * One user's progress on one lesson.
 *
 * 🔌 AWS: DynamoDB `lesson_progress` table:
 *         PK: userId
 *         SK: `${courseSlug}#${lessonId}`
 *         GSI: courseSlug-index (for analytics: how many users finished?)
 */
export interface LessonProgress {
  userId: string;
  courseSlug: string;
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  /** ISO 8601 — when the user first opened this lesson. */
  startedAt?: string;
  /** ISO 8601 — when the user completed this lesson. */
  completedAt?: string;
  /** For quiz lessons: the score the user got. 0-100. */
  score?: number;
}

/**
 * A rolled-up summary of a user's progress across a whole course.
 * Computed on read; not stored.
 */
export interface CourseProgressSummary {
  courseSlug: string;
  totalLessons: number;
  completedLessons: number;
  /** 0-100 */
  percentComplete: number;
  /** ISO 8601 — last time the user interacted with the course. */
  lastAccessedAt?: string;
  /** Which lesson to resume from. The first one that's not complete. */
  resumeLessonId?: string;
}