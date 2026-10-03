// ============================================================================
// src/pages/exam/ExamRoom.tsx
//
// The exam room. This is where candidates actually take the exam.
//
// Flow (driven by ExamContext.view):
//   1. LOADING       — fetch attempt + questions
//   2. RULES         — candidate acknowledges exam rules
//   3. QUESTION      — one question at a time, navigator on the right
//   4. REVIEW        — see all answers at a glance before submitting
//   5. SUBMITTING    — submit in flight
//   6. SUBMITTED     — navigate to /exam/results/{attemptId}
//
// 🔌 AWS: No backend interaction in this file. Everything goes through
//         ExamContext → services/api.ts.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import { ExamProvider } from '../../context/ExamContext';
import { useExam } from '../../context/examHooks';

import { QuestionCard } from '../../components/exam/QuestionCard';
import { Navigator } from '../../components/exam/Navigator';
import { ProctorBar } from '../../components/exam/ProctorBar';
import { WebcamPreview, type WebcamStatus } from '../../components/exam/WebcamPreview';
import { TabSwitchWarning } from '../../components/exam/TabSwitchWarning';

import type { QuestionForCandidate } from '../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-room-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 90px 16px 40px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-room-inner {
  max-width: 1280px;
  margin: 0 auto;
}

/* Loading state */
.fx-room-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
  font-size: 0.95rem;
}
.fx-room-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxRoomSpin 0.7s linear infinite;
}
@keyframes fxRoomSpin { to { transform: rotate(360deg); } }

/* Error state */
.fx-room-error {
  max-width: 500px;
  margin: 60px auto;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.fx-room-error h2 {
  color: #0f172a;
  margin: 0 0 10px;
  font-size: 1.25rem;
}
.fx-room-error p {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px;
}
.fx-room-error-btn {
  display: inline-block;
  padding: 11px 22px;
  background: #d95300;
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
  border: none;
  cursor: pointer;
}

/* Rules screen */
.fx-rules-card {
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
}
@media (max-width: 640px) {
  .fx-rules-card { padding: 24px 20px; }
}
.fx-rules-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 8px;
}
.fx-rules-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.25;
}
.fx-rules-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
}
.fx-rules-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}
.fx-rules-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid #f1f5f9;
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.55;
}
.fx-rules-list li:last-child {
  border-bottom: 1px solid #f1f5f9;
}
.fx-rules-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff7ed;
  color: #d95300;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
}
.fx-rules-ack {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 18px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.fx-rules-ack:hover {
  border-color: #fdba74;
  background: #fffbf7;
}
.fx-rules-ack input {
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
}
.fx-rules-start {
  display: block;
  width: 100%;
  padding: 14px 20px;
  background: #d95300;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.fx-rules-start:hover:not(:disabled),
.fx-rules-start:focus-visible:not(:disabled) {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-rules-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main exam layout */
.fx-room-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}
@media (min-width: 900px) {
  .fx-room-grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

.fx-room-sidebar {
  display: grid;
  gap: 16px;
  width: 100%;
}
@media (min-width: 900px) {
  .fx-room-sidebar {
    position: sticky;
    top: 90px;
  }
}

/* Question navigation bar under the question card */
.fx-room-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.fx-room-nav-btn {
  padding: 12px 20px;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-room-nav-btn:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-room-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.fx-room-nav-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.2);
}
.fx-room-nav-btn.primary:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}
.fx-room-nav-spacer {
  flex: 1;
}

/* Review screen */
.fx-review-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
@media (max-width: 640px) {
  .fx-review-card { padding: 20px; }
}
.fx-review-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}
.fx-review-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
}
.fx-review-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.fx-review-stat {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.fx-review-stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}
.fx-review-stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}
.fx-review-stat-value.warn { color: #dc2626; }
.fx-review-stat-value.ok { color: #16a34a; }

.fx-review-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

/* Exit dialog */
.fx-exit-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}
.fx-exit-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  font-family: sans-serif;
}
.fx-exit-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}
.fx-exit-message {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 22px;
}
.fx-exit-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.fx-exit-btn {
  padding: 11px 20px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.fx-exit-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-exit-btn.secondary:hover {
  border-color: #d95300;
  color: #d95300;
}
.fx-exit-btn.danger {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}
.fx-exit-btn.danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
`;

// ---------------------------------------------------------------------------
// OUTER WRAPPER
// ---------------------------------------------------------------------------

export const ExamRoom: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  if (!attemptId) {
    return (
      <div className="fx-room-page">
        <style>{pageCss}</style>
        <div className="fx-room-inner">
          <div className="fx-room-error">
            <h2>Invalid exam link</h2>
            <p>The exam URL is missing an attempt ID.</p>
            <a href="/exam/dashboard" className="fx-room-error-btn">
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExamProvider key={attemptId}>
      <ExamRoomInner attemptId={attemptId} />
    </ExamProvider>
  );
};

// ---------------------------------------------------------------------------
// INNER COMPONENT
// ---------------------------------------------------------------------------

interface ExamRoomInnerProps {
  attemptId: string;
}

const ExamRoomInner: React.FC<ExamRoomInnerProps> = ({ attemptId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    attempt,
    questions,
    currentIndex,
    view,
    isLoading,
    error,
    expired,
    integrityCompromised,
    maxTabSwitches,
    tabSwitchCount,
    enforceFullscreen,
    initialize,
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
  } = useExam();

  // ---- Local state ----
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
  const [webcamStatus, setWebcamStatus] = useState<WebcamStatus>('idle');
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [submitting, setSubmitting] = useState(false);

  // Refs
  const saveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
const lastProctorEventRef = useRef<{ type: string; time: number } | null>(null);
  // -------------------------------------------------------------------------
  // INITIALIZE on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (initializedRef.current || !user) return;
    initializedRef.current = true;
    void initialize(attemptId, user.id);
  }, [attemptId, user, initialize]);

  // -------------------------------------------------------------------------
  // FULLSCREEN — request on rules acknowledge, detect changes
  // -------------------------------------------------------------------------
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // Some browsers block without a user gesture. Ignore.
    }
  }, []);

  useEffect(() => {
  const handleFullscreenChange = () => {
    const isFull = Boolean(document.fullscreenElement);
    setFullscreenActive(isFull);
    if (!isFull && view === 'question') {
      const now = Date.now();
      const last = lastProctorEventRef.current;
      if (last && last.type === 'fullscreen-exit' && now - last.time < 500) {
        return;
      }
      lastProctorEventRef.current = { type: 'fullscreen-exit', time: now };
      void logProctorEvent('fullscreen-exit');
      setShowTabWarning(true);
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  handleFullscreenChange();
  return () =>
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, [view, logProctorEvent]);

  // -------------------------------------------------------------------------
  // TAB VISIBILITY
  // -------------------------------------------------------------------------
 useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden && view === 'question') {
      // Dedupe: ignore if we logged a tab-switch in the last 500ms
      const now = Date.now();
      const last = lastProctorEventRef.current;
      if (last && last.type === 'tab-switch' && now - last.time < 500) {
        return;
      }
      lastProctorEventRef.current = { type: 'tab-switch', time: now };
      void logProctorEvent('tab-switch');
      setShowTabWarning(true);
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () =>
    document.removeEventListener('visibilitychange', handleVisibility);
}, [view, logProctorEvent]);

  // -------------------------------------------------------------------------
  // BEFOREUNLOAD
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (view !== 'question' && view !== 'review') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [view]);

  // -------------------------------------------------------------------------
  // COPY / PASTE / RIGHT-CLICK BLOCKING
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (view !== 'question') return;

    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      void logProctorEvent('copy-attempt');
    };
    const blockPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      void logProctorEvent('paste-attempt');
    };
    const blockCut = (e: ClipboardEvent) => {
      e.preventDefault();
      void logProctorEvent('copy-attempt');
    };
    const blockRightClick = (e: MouseEvent) => {
      e.preventDefault();
      void logProctorEvent('right-click');
    };

    document.addEventListener('copy', blockCopy);
    document.addEventListener('paste', blockPaste);
    document.addEventListener('cut', blockCut);
    document.addEventListener('contextmenu', blockRightClick);

    return () => {
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('paste', blockPaste);
      document.removeEventListener('cut', blockCut);
      document.removeEventListener('contextmenu', blockRightClick);
    };
  }, [view, logProctorEvent]);

  // -------------------------------------------------------------------------
  // SAVE INDICATOR
  // -------------------------------------------------------------------------
  const triggerSaveIndicator = useCallback(() => {
    setSaveState('saving');
    if (saveResetTimerRef.current) clearTimeout(saveResetTimerRef.current);
    saveResetTimerRef.current = setTimeout(() => {
      setSaveState('saved');
      if (saveResetTimerRef.current) clearTimeout(saveResetTimerRef.current);
      saveResetTimerRef.current = setTimeout(() => {
        setSaveState('idle');
      }, 1500);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveResetTimerRef.current) clearTimeout(saveResetTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // ANSWER HANDLERS
  // -------------------------------------------------------------------------
  const currentQuestion = questions[currentIndex] as QuestionForCandidate | undefined;
  const currentAnswer = currentQuestion && attempt
    ? attempt.answers[currentQuestion.id]
    : undefined;

  const handleAnswerChange = useCallback(
    (selectedOptionIds: string[]) => {
      if (!currentQuestion) return;
      triggerSaveIndicator();
      void saveAnswer(currentQuestion.id, selectedOptionIds);
    },
    [currentQuestion, saveAnswer, triggerSaveIndicator],
  );

  const handleToggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    void toggleFlag(currentQuestion.id);
  }, [currentQuestion, toggleFlag]);

  // ✅ FIXED: moved above the early returns so hooks are called unconditionally
  const handleStreamLost = useCallback(() => {
    void logProctorEvent('webcam-disconnect');
  }, [logProctorEvent]);

  // -------------------------------------------------------------------------
  // NAVIGATION + FLOW
  // -------------------------------------------------------------------------
  const handleAcknowledgeRules = useCallback(async () => {
    if (enforceFullscreen) {
      await requestFullscreen();
    }
    acknowledgeRules();
  }, [enforceFullscreen, requestFullscreen, acknowledgeRules]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const result = await submit();
    setSubmitting(false);
    if (result.ok && result.attemptId) {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {
        /* ignore */
      }
      navigate(`/exam/results/${result.attemptId}`, { replace: true });
    } else if (result.error) {
      alert(`Could not submit: ${result.error}`);
    }
  }, [submit, navigate]);

  const handleExit = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(async () => {
    setShowExitDialog(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
    abandon();
  }, [abandon]);

  // -------------------------------------------------------------------------
  // RENDER — LOADING
  // -------------------------------------------------------------------------
  if (isLoading || !attempt) {
    return (
      <div className="fx-room-page">
        <style>{pageCss}</style>
        <div className="fx-room-inner">
          <div className="fx-room-loading">
            <div className="fx-room-spinner" />
            <div>Loading your exam…</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER — ERROR
  // -------------------------------------------------------------------------
  if (error) {
  return (
    <div className="fx-room-page">
      <style>{pageCss}</style>
      <div className="fx-room-inner">
        <div className="fx-room-error">
          {expired ? (
            <>
              <h2>This attempt has expired</h2>
              <p>
                The time limit for this attempt has passed. Your answers were
                saved and the attempt may have been auto-submitted. If you're
                seeing this in error, contact your training coordinator.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href={`/exam/results/${attemptId}`}
                  className="fx-room-error-btn"
                >
                  View results
                </a>
                <a
                  href="/exam/dashboard"
                  className="fx-room-error-btn"
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  Back to dashboard
                </a>
              </div>
            </>
          ) : (
            <>
              <h2>Could not load the exam</h2>
              <p>{error}</p>
              <a href="/exam/dashboard" className="fx-room-error-btn">
                Back to dashboard
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

  // -------------------------------------------------------------------------
  // RENDER — RULES SCREEN
  // -------------------------------------------------------------------------
  if (view === 'rules') {
    return (
      <div className="fx-room-page">
        <style>{pageCss}</style>
        <div className="fx-room-inner">
          <div className="fx-rules-card">
            <div className="fx-rules-eyebrow">Before you begin</div>
            <h1 className="fx-rules-title">Exam rules and conditions</h1>
            <p className="fx-rules-sub">
              This is a proctored high-stakes assessment. Please read the
              following carefully before starting.
            </p>

            <ul className="fx-rules-list">
              <li>
                <span className="fx-rules-icon">1</span>
                <div>
                  <strong>Time limit:</strong> Once you start, the countdown
                  begins and cannot be paused. Your attempt will be submitted
                  automatically when time runs out.
                </div>
              </li>
              <li>
                <span className="fx-rules-icon">2</span>
                <div>
                  <strong>Fullscreen is required.</strong> Leaving fullscreen
                  will be logged. Do not exit fullscreen during the exam.
                </div>
              </li>
              <li>
                <span className="fx-rules-icon">3</span>
                <div>
                  <strong>Do not switch tabs.</strong> Up to {maxTabSwitches}{' '}
                  tab switches are allowed before your attempt is flagged.
                  Every switch is logged.
                </div>
              </li>
              <li>
                <span className="fx-rules-icon">4</span>
                <div>
                  <strong>Your webcam is monitored.</strong> Keep your face
                  visible and remain seated. Recording begins immediately.
                </div>
              </li>
              <li>
                <span className="fx-rules-icon">5</span>
                <div>
                  <strong>Copy, paste, and right-click are disabled.</strong>{' '}
                  All such attempts are logged.
                </div>
              </li>
              <li>
                <span className="fx-rules-icon">6</span>
                <div>
                  <strong>Answers save automatically.</strong> You can navigate
                  freely between questions until you submit.
                </div>
              </li>
            </ul>

            <label className="fx-rules-ack">
              <input
                type="checkbox"
                checked={rulesAcknowledged}
                onChange={(e) => setRulesAcknowledged(e.target.checked)}
              />
              <span>
                I have read and understood the exam rules. I understand that
                this attempt is proctored and all activity is logged.
              </span>
            </label>

            <button
              type="button"
              className="fx-rules-start"
              disabled={!rulesAcknowledged}
              onClick={handleAcknowledgeRules}
            >
              Start Exam →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER — SUBMITTING
  // -------------------------------------------------------------------------
  if (view === 'submitting') {
    return (
      <div className="fx-room-page">
        <style>{pageCss}</style>
        <div className="fx-room-inner">
          <div className="fx-room-loading">
            <div className="fx-room-spinner" />
            <div>Submitting your exam…</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER — REVIEW
  // -------------------------------------------------------------------------
  if (view === 'review') {
    const answeredCount = questions.filter(
      (q) => (attempt.answers[q.id]?.selectedOptionIds ?? []).length > 0,
    ).length;
    const flaggedCount = questions.filter(
      (q) => attempt.answers[q.id]?.flaggedForReview,
    ).length;
    const unansweredCount = questions.length - answeredCount;

    return (
      <div className="fx-room-page">
        <style>{pageCss}</style>
        <div className="fx-room-inner">
          <ProctorBar
            webcamLive={webcamStatus === 'live'}
            fullscreenActive={fullscreenActive}
            onExit={handleExit}
          />

          <div style={{ marginTop: 20 }}>
            <div className="fx-review-card">
              <h1 className="fx-review-title">Ready to submit?</h1>
              <p className="fx-review-sub">
                Review your progress below. Once you submit, your answers are
                locked and cannot be changed.
              </p>

              <div className="fx-review-stats">
                <div className="fx-review-stat">
                  <div className="fx-review-stat-label">Answered</div>
                  <div className="fx-review-stat-value ok">
                    {answeredCount} / {questions.length}
                  </div>
                </div>
                <div className="fx-review-stat">
                  <div className="fx-review-stat-label">Flagged</div>
                  <div className="fx-review-stat-value">{flaggedCount}</div>
                </div>
                <div className="fx-review-stat">
                  <div className="fx-review-stat-label">Unanswered</div>
                  <div
                    className={`fx-review-stat-value${
                      unansweredCount > 0 ? ' warn' : ' ok'
                    }`}
                  >
                    {unansweredCount}
                  </div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    borderRadius: 10,
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    marginBottom: 20,
                  }}
                >
                  ⚠ You have {unansweredCount} unanswered{' '}
                  {unansweredCount === 1 ? 'question' : 'questions'}. Use the
                  navigator to jump to them, or submit as-is.
                </div>
              )}

              <div className="fx-review-actions">
                <button
                  type="button"
                  className="fx-room-nav-btn"
                  onClick={backToQuestions}
                  disabled={submitting}
                >
                  ← Back to questions
                </button>
                <button
                  type="button"
                  className="fx-room-nav-btn primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit exam'}
                </button>
              </div>
            </div>
          </div>

          {showTabWarning && (
            <TabSwitchWarning
              count={tabSwitchCount}
              max={maxTabSwitches}
              onDismiss={() => {
                setShowTabWarning(false);
                void requestFullscreen();
              }}
            />
          )}

          {showExitDialog && (
            <ExitDialog
              onCancel={() => setShowExitDialog(false)}
              onConfirm={confirmExit}
            />
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER — QUESTION VIEW (default)
  // -------------------------------------------------------------------------
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const allAnswered = questions.every(
    (q) => (attempt.answers[q.id]?.selectedOptionIds ?? []).length > 0,
  );

  return (
    <div className="fx-room-page">
      <style>{pageCss}</style>
      <div className="fx-room-inner">
        {/* Top bar: integrity status + timer */}
        <ProctorBar
          webcamLive={webcamStatus === 'live'}
          fullscreenActive={fullscreenActive}
          onExit={handleExit}
        />

        {/* Main grid */}
        <div className="fx-room-grid" style={{ marginTop: 20 }}>
          {/* LEFT: Question card + nav */}
          <div>
            {currentQuestion ? (
              <>
                <QuestionCard
                  question={currentQuestion}
                  answer={currentAnswer}
                  onChange={handleAnswerChange}
                  onToggleFlag={handleToggleFlag}
                  saveState={saveState}
                  disabled={integrityCompromised}
                />

                <div className="fx-room-nav">
                  <button
                    type="button"
                    className="fx-room-nav-btn"
                    onClick={previousQuestion}
                    disabled={isFirstQuestion}
                  >
                    ← Previous
                  </button>

                  <div className="fx-room-nav-spacer" />

                  {isLastQuestion || allAnswered ? (
                    <button
                      type="button"
                      className="fx-room-nav-btn primary"
                      onClick={goToReview}
                    >
                      Review & Submit →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fx-room-nav-btn primary"
                      onClick={nextQuestion}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="fx-review-card">
                <h2 className="fx-review-title">No questions loaded</h2>
                <p className="fx-review-sub">
                  There was a problem loading the exam questions. Please go back
                  to the dashboard.
                </p>
                <a href="/exam/dashboard" className="fx-room-error-btn">
                  Back to dashboard
                </a>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar with navigator + webcam */}
          <aside className="fx-room-sidebar">
            <Navigator />
            <WebcamPreview
              onStatusChange={setWebcamStatus}
              onStreamLost={handleStreamLost}
              label="Proctored session"
            />
          </aside>
        </div>
      </div>

      {/* Overlays */}
      {showTabWarning && (
        <TabSwitchWarning
          count={tabSwitchCount}
          max={maxTabSwitches}
          onDismiss={() => {
            setShowTabWarning(false);
            void requestFullscreen();
          }}
        />
      )}

      {showExitDialog && (
        <ExitDialog
          onCancel={() => setShowExitDialog(false)}
          onConfirm={confirmExit}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// EXIT CONFIRMATION DIALOG
// ---------------------------------------------------------------------------

interface ExitDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const ExitDialog: React.FC<ExitDialogProps> = ({ onCancel, onConfirm }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <>
      <style>{pageCss}</style>
      <div
        className="fx-exit-backdrop"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fx-exit-title"
      >
        <div className="fx-exit-card">
          <h2 id="fx-exit-title" className="fx-exit-title">
            Exit the exam?
          </h2>
          <p className="fx-exit-message">
            Your answers have been saved, but your attempt will remain{' '}
            <strong>in progress</strong>. The timer keeps running. You can
            resume later from your dashboard until the deadline.
          </p>
          <div className="fx-exit-actions">
            <button
              type="button"
              className="fx-exit-btn secondary"
              onClick={onCancel}
            >
              Stay in exam
            </button>
            <button
              type="button"
              className="fx-exit-btn danger"
              onClick={onConfirm}
            >
              Exit anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
};