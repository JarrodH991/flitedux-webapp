// ============================================================================
// src/context/examHooks.ts
//
// Hooks that consume ExamContext. Kept in a separate file so that
// ExamContext.tsx exports only the component (Vite Fast Refresh friendly).
//
// Import from here:
//   import { useExam } from '../context/examHooks';
// ============================================================================

import { useContext } from 'react';
import { ExamContext } from './examContextValue.ts';
import type { ExamContextValue } from './examContextValue.ts';

/**
 * Access the active exam session. Throws if used outside <ExamProvider>.
 */
export function useExam(): ExamContextValue {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error(
      'useExam must be used inside <ExamProvider>. Check your App.tsx or ExamRoom.tsx.',
    );
  }
  return ctx;
}

/**
 * The current question object (or undefined if not yet loaded).
 */
export function useCurrentQuestion() {
  const { questions, currentIndex } = useExam();
  return questions[currentIndex];
}

/**
 * The current attempt's answer for the current question.
 */
export function useCurrentAnswer() {
  const { attempt, questions, currentIndex } = useExam();
  const q = questions[currentIndex];
  return q ? attempt?.answers[q.id] : undefined;
}