// ============================================================================
// src/context/examContextValue.ts
//
// Context object + value shape for the exam session state machine.
//
// Split from the provider (ExamContext.tsx) and the hooks (examHooks.ts)
// so each file exports only one kind of thing — Vite Fast Refresh stays
// happy, and there's no circular import between provider and hooks.
// ============================================================================

import { createContext } from 'react';
import type {
  Attempt,
  QuestionForCandidate,
  ProctorEvent,
} from '../types/exam.types';

/**
 * Which "screen" the candidate is currently on within the exam flow.
 * The exam room renders based on this.
 */
export type ExamView =
  | 'rules'          // pre-exam rules acknowledgment
  | 'question'       // actively answering a question
  | 'review'         // reviewing all answers before submitting
  | 'submitting'     // submit request in flight
  | 'submitted';     // done — redirect to results

export interface ExamContextValue {
  // ---- Data ----
  attempt: Attempt | null;
  questions: QuestionForCandidate[];
  currentIndex: number;
  view: ExamView;

  // ---- Timing ----
  /** Seconds remaining until the deadline. Updates every second. */
  secondsRemaining: number;
  /** True when secondsRemaining <= 0. */
  isTimeUp: boolean;
  /** Full deadline as ISO string, or null if untimed. */
  deadlineAt: string | null;

  // ---- Integrity ----
  /** Number of tab-switch events counted so far. */
  tabSwitchCount: number;
  /** Number of fullscreen-exit events counted so far. */
  fullscreenExitCount: number;
  /** True when the candidate has exceeded maxTabSwitches. */
  integrityCompromised: boolean;
  /** Max allowed tab switches, from the exam rules. */
  maxTabSwitches: number;
  /** Fullscreen enforcement enabled? */
  enforceFullscreen: boolean;

  // ---- Loading ----
  isLoading: boolean;
  error: string | null;

  // ---- Actions ----
  /** Called once when the exam room mounts — loads attempt + questions. */
  initialize: (attemptId: string, userId: string) => Promise<void>;

  /** Navigate to a specific question by index. */
  goToQuestion: (index: number) => void;

  /** Move to the next / previous question. Bounded by the rules. */
  nextQuestion: () => void;
  previousQuestion: () => void;

  /** Save an answer. Called on every selection change and on navigation. */
  saveAnswer: (questionId: string, selectedOptionIds: string[]) => Promise<void>;

  /** Toggle the "flag for review" state of a question. */
  toggleFlag: (questionId: string) => Promise<void>;

  /** Advance from rules → question. */
  acknowledgeRules: () => void;

  /** Advance to the review screen. */
  goToReview: () => void;

  /** Go back to the last question from the review screen. */
  backToQuestions: () => void;

  /** Submit the attempt. Navigates to results on success. */
  submit: () => Promise<{ ok: boolean; attemptId?: string; error?: string }>;

  /** Log a proctoring event. */
  logProctorEvent: (
    type: ProctorEvent['type'],
    metadata?: Record<string, unknown>,
  ) => Promise<void>;

  /** Force-close the exam (e.g. user confirms exit). */
  abandon: () => void;
}

export const ExamContext = createContext<ExamContextValue | undefined>(
  undefined,
);