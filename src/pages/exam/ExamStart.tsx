// ============================================================================
// src/pages/exam/ExamStart.tsx
//
// The "start or resume" bridge page for an exam. Lives at:
//   /exam/exam/:examId
//
// Behaviour:
//   1. Load the exam.
//   2. Load the current user's attempts.
//   3. If there's an IN-PROGRESS attempt for this exam → redirect to the
//      exam room to resume it.
//   4. Otherwise, show a confirmation screen with exam details and a
//      "Start exam" button.
//   5. On confirm → call api.startAttempt() → redirect to the new attempt.
//
// The confirmation screen is important: starting an exam begins a timer
// and consumes an attempt slot. We don't want the user to land in the
// exam room accidentally by clicking the wrong card on the dashboard.
//
// 🔌 AWS: getExam, getUserAttempts, startAttempt — all stubbed in
//         services/api.ts. In production, startAttempt is a Lambda that
//         also writes an immutable S3 snapshot of the served questions.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Exam, Subject, Attempt } from '../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-start-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-start-inner {
  max-width: 720px;
  margin: 0 auto;
}

/* Loading */
.fx-start-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
  font-size: 0.95rem;
}
.fx-start-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxStartSpin 0.7s linear infinite;
}
@keyframes fxStartSpin { to { transform: rotate(360deg); } }

/* Error */
.fx-start-error {
  max-width: 500px;
  margin: 60px auto;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.fx-start-error h2 { color: #0f172a; margin: 0 0 10px; font-size: 1.25rem; }
.fx-start-error p { color: #64748b; line-height: 1.6; margin: 0 0 20px; }

/* Card */
.fx-start-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  animation: fxStartFadeIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxStartFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (max-width: 640px) {
  .fx-start-card { padding: 24px 20px; }
}

.fx-start-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 8px;
}
.fx-start-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.25;
}
.fx-start-desc {
  font-size: 0.98rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
}

/* Info grid */
.fx-start-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.fx-start-info-cell {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.fx-start-info-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}
.fx-start-info-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

/* Important callout */
.fx-start-callout {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 0.88rem;
  color: #78350f;
  line-height: 1.55;
}
.fx-start-callout strong { font-weight: 700; }

/* Previous attempt notice */
.fx-start-prev {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.55;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.fx-start-prev-info { flex: 1; min-width: 180px; }
.fx-start-prev-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 3px;
  font-size: 0.9rem;
}
.fx-start-prev-meta {
  font-size: 0.8rem;
  color: #64748b;
}

/* Actions */
.fx-start-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
.fx-start-btn {
  padding: 12px 22px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}
.fx-start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.fx-start-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-start-btn.primary:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
}
.fx-start-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-start-btn.secondary:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}

/* Inline spinner for the start button */
.fx-start-btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: fxStartSpin 0.6s linear infinite;
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ExamStart: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [inProgressAttempt, setInProgressAttempt] = useState<Attempt | null>(null);
  const [mostRecentPastAttempt, setMostRecentPastAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // -------------------------------------------------------------------------
  // Load exam + attempts on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!examId || !user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const examRes = await api.getExam(examId!);
      if (cancelled) return;
      if (!examRes.ok || !examRes.data) {
        setError(examRes.ok ? 'Exam not found.' : examRes.error.message);
        setLoading(false);
        return;
      }

      const loadedExam = examRes.data;
      setExam(loadedExam);

      // Subject (for a nice label)
      const subjectRes = await api.getSubject(loadedExam.subjectId);
      if (!cancelled && subjectRes.ok && subjectRes.data) {
        setSubject(subjectRes.data);
      }

      // Attempts for this user
      const attemptsRes = await api.getUserAttempts(user!.id);
      if (cancelled) return;

      if (attemptsRes.ok) {
        const forThisExam = attemptsRes.data
          .filter((a) => a.examId === examId)
          .sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1));

        const ip = forThisExam.find((a) => a.status === 'in-progress') ?? null;

        // "Past" = anything that's not in-progress
        const past = forThisExam.filter((a) => a.status !== 'in-progress');

        if (ip) {
          setInProgressAttempt(ip);
        } else if (past.length > 0) {
          setMostRecentPastAttempt(past[0]);
        }
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [examId, user]);

  // -------------------------------------------------------------------------
  // Auto-redirect if there's an in-progress attempt.
  // Uses an effect instead of a conditional redirect so the loading state
  // gets a chance to render first. This avoids a "flash" of the confirmation
  // screen before the redirect.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!loading && inProgressAttempt) {
      navigate(`/exam/attempt/${inProgressAttempt.id}`, { replace: true });
    }
  }, [loading, inProgressAttempt, navigate]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleStart = async () => {
    if (!exam || !user) return;
    setStarting(true);
    setError(null);

    const res = await api.startAttempt(exam.id, user.id);
    setStarting(false);

    if (!res.ok) {
      setError(res.error.message);
      return;
    }

    // Navigate to the exam room for the freshly created attempt.
    navigate(`/exam/attempt/${res.data.attempt.id}`, { replace: true });
  };

  // -------------------------------------------------------------------------
  // Loading / error guards
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-start-page">
        <style>{pageCss}</style>
        <div className="fx-start-inner">
          <div className="fx-start-loading">
            <div className="fx-start-spinner" />
            <div>Loading exam…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="fx-start-page">
        <style>{pageCss}</style>
        <div className="fx-start-inner">
          <div className="fx-start-error">
            <h2>Could not load exam</h2>
            <p>{error}</p>
            <Link to="/exam/dashboard" className="fx-start-btn primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="fx-start-page">
        <style>{pageCss}</style>
        <div className="fx-start-inner">
          <div className="fx-start-error">
            <h2>Exam not found</h2>
            <p>This exam doesn't exist or isn't available.</p>
            <Link to="/exam/dashboard" className="fx-start-btn primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If there's an in-progress attempt, we already triggered a redirect
  // above — render a small loading state while the navigation happens.
  if (inProgressAttempt) {
    return (
      <div className="fx-start-page">
        <style>{pageCss}</style>
        <div className="fx-start-inner">
          <div className="fx-start-loading">
            <div className="fx-start-spinner" />
            <div>Resuming your attempt…</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Compute display values
  // -------------------------------------------------------------------------
  const timeLabel =
    exam.rules.timeLimitMinutes === 0
      ? 'No time limit'
      : exam.rules.timeLimitMinutes < 60
        ? `${exam.rules.timeLimitMinutes} min`
        : `${Math.floor(exam.rules.timeLimitMinutes / 60)}h${exam.rules.timeLimitMinutes % 60 ? ` ${exam.rules.timeLimitMinutes % 60}m` : ''}`;

  const questionCount = exam.blueprint.totalQuestions;

  const hasPastAttempt = mostRecentPastAttempt !== null;
  const lastPassed = mostRecentPastAttempt?.passed === true;
  const lastScore = mostRecentPastAttempt?.scorePercent;

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-start-page">
      <style>{pageCss}</style>

      <div className="fx-start-inner">
        <div className="fx-start-card">
          <div className="fx-start-eyebrow">
            {subject ? subject.name : 'Exam'}
          </div>
          <h1 className="fx-start-title">{exam.title}</h1>
          <p className="fx-start-desc">{exam.description}</p>

          {/* Quick facts */}
          <div className="fx-start-info">
            <div className="fx-start-info-cell">
              <div className="fx-start-info-label">Questions</div>
              <div className="fx-start-info-value">{questionCount}</div>
            </div>
            <div className="fx-start-info-cell">
              <div className="fx-start-info-label">Time limit</div>
              <div className="fx-start-info-value">{timeLabel}</div>
            </div>
            <div className="fx-start-info-cell">
              <div className="fx-start-info-label">Pass mark</div>
              <div className="fx-start-info-value">
                {exam.rules.passMarkPercent}%
              </div>
            </div>
          </div>

          {/* Previous attempt notice */}
          {hasPastAttempt && (
            <div className="fx-start-prev">
              <div className="fx-start-prev-info">
                <div className="fx-start-prev-title">
                  {lastPassed
                    ? `You previously passed this exam${
                        lastScore !== undefined ? ` with ${lastScore}%` : ''
                      }.`
                    : `Your last attempt${
                        lastScore !== undefined ? ` scored ${lastScore}%` : ''
                      }.`}
                </div>
                <div className="fx-start-prev-meta">
                  {mostRecentPastAttempt?.submittedAt
                    ? `Submitted ${new Date(
                        mostRecentPastAttempt.submittedAt,
                      ).toLocaleDateString()}`
                    : 'No submission date'}
                </div>
              </div>
              {mostRecentPastAttempt && (
                <Link
                  to={`/exam/results/${mostRecentPastAttempt.id}`}
                  className="fx-start-btn secondary"
                  style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                >
                  View last result
                </Link>
              )}
            </div>
          )}

          {/* Integrity callout */}
          <div className="fx-start-callout">
            <strong>Before you start:</strong> this is a proctored exam. Once
            started, your timer begins and cannot be paused. Fullscreen will
            be enforced, your webcam will be monitored, and tab switches will
            be logged. Make sure you're in a quiet, private space.
          </div>

          {/* Error (from start attempt) */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: 10,
                fontSize: '0.88rem',
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Actions */}
          <div className="fx-start-actions">
            <Link to="/exam/dashboard" className="fx-start-btn secondary">
              ← Cancel
            </Link>
            <button
              type="button"
              className="fx-start-btn primary"
              onClick={handleStart}
              disabled={starting}
            >
              {starting && <span className="fx-start-btn-spinner" />}
              {starting ? 'Starting…' : 'Start exam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};