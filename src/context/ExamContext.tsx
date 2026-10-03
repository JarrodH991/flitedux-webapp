// ============================================================================
// src/context/ExamContext.tsx
//
// The exam session provider. Owns all state for an active exam attempt:
// questions, answers, timer, integrity events, submission.
//
// Everything is scoped to ONE attempt. If a user starts a second attempt,
// the provider remounts and the state resets.
//
// 🔌 AWS: Every action here calls a function in services/api.ts. When you
//         wire up AWS, the calls become Lambda invocations or DynamoDB
//         writes, but this provider doesn't change.
// ============================================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import * as api from '../services/api';
import { ExamContext } from './examContextValue';
import type { ExamContextValue, ExamView } from './examContextValue';
import type {
  Attempt,
  QuestionForCandidate,
  ProctorEventType,
} from '../types/exam.types';

const AUTOSAVE_DEBOUNCE_MS = 800;
const TIMER_TICK_MS = 1000;
const TIMER_GRACE_PERIOD_MS = 3000;

// Set to false to silence all debug logging from this file.
const DEBUG = true;
function dbg(...args: unknown[]) {
  if (DEBUG) console.log('[ExamContext]', ...args);
}

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  // ---- Data ----
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<QuestionForCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState<ExamView>('rules');

  // ---- Timing ----
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);

  // ---- Integrity ----
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

  // ---- Loading / error ----
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // ---- Refs ----
  const autosaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const questionsRef = useRef<QuestionForCandidate[]>([]);
  const attemptRef = useRef<Attempt | null>(null);
  const integrityTriggeredRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    const timers = autosaveTimers.current;
    return () => {
      mountedRef.current = false;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // ---- Rules-derived state (populated during initialize) ----
  const [maxTabSwitchesState, setMaxTabSwitchesState] = useState(3);
  const [enforceFullscreenState, setEnforceFullscreenState] = useState(true);

  const isTimeUp = secondsRemaining <= 0 && deadlineAt !== null;

  // Integrity is compromised only if there IS a limit (max > 0) and we've
  // exceeded it. If max is 0, the exam has no tab-switch limit.
  const integrityCompromised =
    maxTabSwitchesState > 0 && tabSwitchCount > maxTabSwitchesState;

  // -------------------------------------------------------------------------
  // INITIALIZE — load the attempt, questions, and exam rules
  // -------------------------------------------------------------------------
  const initialize = useCallback(
    async (attemptId: string, _userId: string) => {
      dbg('initialize called for attempt:', attemptId);
      setIsLoading(true);
      setError(null);
      setExpired(false);

      const attemptRes = await api.getAttempt(attemptId);
      if (!mountedRef.current) return;
      if (!attemptRes.ok || !attemptRes.data) {
        setError(
          attemptRes.ok ? 'Attempt not found.' : attemptRes.error.message,
        );
        setIsLoading(false);
        return;
      }

      const loadedAttempt = attemptRes.data;
      dbg(
        'attempt loaded:',
        loadedAttempt.id,
        'status:',
        loadedAttempt.status,
        'deadline:',
        loadedAttempt.deadlineAt,
      );

      setAttempt(loadedAttempt);
      setDeadlineAt(loadedAttempt.deadlineAt);

      const secondsLeft = Math.max(
        0,
        Math.floor(
          (new Date(loadedAttempt.deadlineAt).getTime() - Date.now()) / 1000,
        ),
      );
      setSecondsRemaining(secondsLeft);

      const examRes = await api.getExam(loadedAttempt.examId);
      if (!mountedRef.current) return;
      if (examRes.ok && examRes.data) {
        setMaxTabSwitchesState(examRes.data.rules.integrity.maxTabSwitches);
        setEnforceFullscreenState(
          examRes.data.rules.integrity.enforceFullscreen,
        );
      }

      const questionsRes = await api.getAttemptQuestions(attemptId);
      if (!mountedRef.current) return;
      if (!questionsRes.ok) {
        setError(questionsRes.error.message);
        setIsLoading(false);
        return;
      }

      setQuestions(questionsRes.data);
      setCurrentIndex(0);

      // If the attempt is already submitted (or auto-submitted, or
      // invalidated), jump straight to the submitted state — the user
      // should be looking at their results, not the rules screen.
      if (
        loadedAttempt.status === 'submitted' ||
        loadedAttempt.status === 'auto-submitted' ||
        loadedAttempt.status === 'invalidated'
      ) {
        setView('submitted');
        setIsLoading(false);
        return;
      }

      // If the deadline has already passed but the attempt is still
      // in-progress, mark it as expired. The timer will handle the
      // auto-submit after its grace period.
      if (secondsLeft <= 0) {
        setExpired(true);
      }

      setView('rules');
      setIsLoading(false);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // TIMER — ticks every second, auto-submits at zero (with grace period)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!deadlineAt || view === 'submitted') return;

    dbg(
      'timer mounted — deadlineAt:',
      deadlineAt,
      'view:',
      view,
      'secondsUntilDeadline:',
      Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000),
    );

    const mountedAt = Date.now();

    const interval = setInterval(() => {
      if (!mountedRef.current) return;

      const secondsLeft = Math.max(
        0,
        Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(secondsLeft);

      const graceElapsed = Date.now() - mountedAt >= TIMER_GRACE_PERIOD_MS;

      // Only auto-submit if:
      //   - deadline is reached
      //   - grace period has passed (avoid firing on stale deadlines
      //     the instant the page loads)
      //   - we haven't already submitted
      //   - the attempt is still in-progress
      if (
        secondsLeft === 0 &&
        graceElapsed &&
        !submittingRef.current &&
        attemptRef.current &&
        attemptRef.current.status === 'in-progress'
      ) {
        dbg('timer: deadline reached, auto-submitting');
        submittingRef.current = true;
        void (async () => {
          const res = await api.submitAttempt(
            attemptRef.current!.id,
            'server',
          );
          if (mountedRef.current && res.ok) {
            setAttempt(res.data);
            setView('submitted');
            navigate(`/exam/results/${res.data.id}`);
          }
        })();
      }
    }, TIMER_TICK_MS);

    return () => clearInterval(interval);
  }, [deadlineAt, view, navigate]);

  // -------------------------------------------------------------------------
  // INTEGRITY AUTO-SUBMIT — when the candidate exceeds the tab-switch limit,
  // automatically submit the attempt as invalidated. Fires once.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (
      integrityCompromised &&
      !integrityTriggeredRef.current &&
      !submittingRef.current &&
      attemptRef.current &&
      attemptRef.current.status === 'in-progress'
    ) {
      integrityTriggeredRef.current = true;
      dbg('integrity compromised — auto-submitting as invalidated');
      submittingRef.current = true;
      void (async () => {
        const res = await api.submitAttempt(attemptRef.current!.id, 'server');
        if (mountedRef.current && res.ok) {
          setAttempt(res.data);
          setView('submitted');
          navigate(`/exam/results/${res.data.id}`);
        }
      })();
    }
  }, [integrityCompromised, navigate]);

  // -------------------------------------------------------------------------
  // AUTOSAVE
  // -------------------------------------------------------------------------
  const queueAutosave = useCallback(
    (questionId: string, selectedOptionIds: string[]) => {
      const existing = autosaveTimers.current.get(questionId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        autosaveTimers.current.delete(questionId);
        if (!attemptRef.current) return;
        await api.saveAnswer(attemptRef.current.id, {
          questionId,
          selectedOptionIds,
          flaggedForReview: false,
          answeredAt: new Date().toISOString(),
          timeSpentSeconds: 0,
        });
      }, AUTOSAVE_DEBOUNCE_MS);

      autosaveTimers.current.set(questionId, timer);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------
  const goToQuestion = useCallback((index: number) => {
    if (index < 0 || index >= questionsRef.current.length) return;
    setCurrentIndex(index);
    setView('question');
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, questionsRef.current.length - 1),
    );
  }, []);

  const previousQuestion = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // -------------------------------------------------------------------------
  // ANSWERS
  // -------------------------------------------------------------------------
  const saveAnswer = useCallback(
    async (questionId: string, selectedOptionIds: string[]) => {
      if (!attemptRef.current) return;

      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: {
              questionId,
              selectedOptionIds,
              flaggedForReview:
                prev.answers[questionId]?.flaggedForReview ?? false,
              answeredAt: new Date().toISOString(),
              timeSpentSeconds:
                (prev.answers[questionId]?.timeSpentSeconds ?? 0) + 1,
            },
          },
        };
      });

      queueAutosave(questionId, selectedOptionIds);
    },
    [queueAutosave],
  );

  const toggleFlag = useCallback(async (questionId: string) => {
    if (!attemptRef.current) return;
    const current = attemptRef.current.answers[questionId];
    const nextFlag = !(current?.flaggedForReview ?? false);

    setAttempt((prev) => {
      if (!prev) return prev;
      const existing = prev.answers[questionId];
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            questionId,
            selectedOptionIds: existing?.selectedOptionIds ?? [],
            flaggedForReview: nextFlag,
            answeredAt: existing?.answeredAt ?? new Date().toISOString(),
            timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
          },
        },
      };
    });

    await api.saveAnswer(attemptRef.current.id, {
      questionId,
      selectedOptionIds: current?.selectedOptionIds ?? [],
      flaggedForReview: nextFlag,
      answeredAt: current?.answeredAt ?? new Date().toISOString(),
      timeSpentSeconds: current?.timeSpentSeconds ?? 0,
    });
  }, []);

  // -------------------------------------------------------------------------
  // VIEW TRANSITIONS
  // -------------------------------------------------------------------------
  const acknowledgeRules = useCallback(() => {
    setView('question');
    setCurrentIndex(0);
  }, []);

  const goToReview = useCallback(() => setView('review'), []);
  const backToQuestions = useCallback(() => setView('question'), []);

  // -------------------------------------------------------------------------
  // SUBMIT — called by the user via the review screen
  // -------------------------------------------------------------------------
  const submit = useCallback(async () => {
    if (!attemptRef.current || submittingRef.current) {
      return { ok: false, error: 'No active attempt.' };
    }
    submittingRef.current = true;
    setView('submitting');

    autosaveTimers.current.forEach((timer) => clearTimeout(timer));
    autosaveTimers.current.clear();

    const res = await api.submitAttempt(attemptRef.current.id, 'candidate');
    if (!mountedRef.current) return { ok: false, error: 'Component unmounted.' };

    if (!res.ok) {
      submittingRef.current = false;
      setView('question');
      return { ok: false, error: res.error.message };
    }

    setAttempt(res.data);
    setView('submitted');
    return { ok: true, attemptId: res.data.id };
  }, []);

  // -------------------------------------------------------------------------
  // PROCTOR EVENTS — increments local counters IMMEDIATELY, fires API async
  // -------------------------------------------------------------------------
  const logProctorEvent = useCallback(
    async (type: ProctorEventType, metadata?: Record<string, unknown>) => {
      if (!attemptRef.current) return;

      // Increment counters FIRST so the UI updates instantly. The API
      // call is fire-and-forget; we don't wait for it.
      if (type === 'tab-switch') {
        setTabSwitchCount((c) => {
          const next = c + 1;
          dbg('tabSwitchCount:', c, '→', next);
          return next;
        });
      } else if (type === 'fullscreen-exit') {
        setFullscreenExitCount((c) => {
          const next = c + 1;
          dbg('fullscreenExitCount:', c, '→', next);
          return next;
        });
      }

      void api.logProctorEvent(attemptRef.current.id, type, metadata);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // ABANDON — leave without submitting
  // -------------------------------------------------------------------------
  const abandon = useCallback(() => {
    autosaveTimers.current.forEach((timer) => clearTimeout(timer));
    autosaveTimers.current.clear();
    navigate('/exam/dashboard');
  }, [navigate]);

  // -------------------------------------------------------------------------
  // CONTEXT VALUE
  // -------------------------------------------------------------------------
  const value = useMemo<ExamContextValue>(
    () => ({
      attempt,
      questions,
      currentIndex,
      view,
      secondsRemaining,
      isTimeUp,
      deadlineAt,
      tabSwitchCount,
      fullscreenExitCount,
      integrityCompromised,
      maxTabSwitches: maxTabSwitchesState,
      enforceFullscreen: enforceFullscreenState,
      isLoading,
      error,
      expired,
      initialize,
      goToQuestion,
      nextQuestion,
      previousQuestion,
      saveAnswer,
      toggleFlag,
      acknowledgeRules,
      goToReview,
      backToQuestions,
      submit,
      logProctorEvent,
      abandon,
    }),
    [
      attempt,
      questions,
      currentIndex,
      view,
      secondsRemaining,
      isTimeUp,
      deadlineAt,
      tabSwitchCount,
      fullscreenExitCount,
      integrityCompromised,
      maxTabSwitchesState,
      enforceFullscreenState,
      isLoading,
      error,
      expired,
      initialize,
      goToQuestion,
      nextQuestion,
      previousQuestion,
      saveAnswer,
      toggleFlag,
      acknowledgeRules,
      goToReview,
      backToQuestions,
      submit,
      logProctorEvent,
      abandon,
    ],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};