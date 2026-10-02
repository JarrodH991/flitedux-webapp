// ============================================================================
// src/pages/exam/ExamResults.tsx
//
// Results page. Renders after a candidate submits (or is auto-submitted).
//
// Reads:
//   - attemptId from the URL
//   - the attempt via api.getAttempt
//   - the exam via api.getExam (for pass mark, title, subject)
//   - the module metadata via api.getModules (for readable module names)
//
// Shows:
//   - Pass/fail banner with score
//   - Stats: score, correct count, pass mark
//   - Per-module breakdown with mini progress bars
//   - Retake CTA (if failed and the exam allows retakes)
//   - Back-to-dashboard link
//
// 🔌 AWS: getAttempt, getExam, getModules — all stubbed in services/api.ts.
//         In production, the score & breakdown are computed server-side
//         in a Lambda and only the result is returned to the client.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Attempt, Exam, Module, Subject } from '../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-res-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-res-inner {
  max-width: 800px;
  margin: 0 auto;
}

/* Loading */
.fx-res-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
  font-size: 0.95rem;
}
.fx-res-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxResSpin 0.7s linear infinite;
}
@keyframes fxResSpin { to { transform: rotate(360deg); } }

/* Error card */
.fx-res-error {
  max-width: 500px;
  margin: 60px auto;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.fx-res-error h2 { color: #0f172a; margin: 0 0 10px; font-size: 1.25rem; }
.fx-res-error p { color: #64748b; line-height: 1.6; margin: 0 0 20px; }

/* Banner */
.fx-res-banner {
  background: #ffffff;
  border-radius: 18px;
  padding: 40px 32px 32px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  animation: fxResFadeIn 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxResFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Top accent strip by outcome */
.fx-res-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
}
.fx-res-banner.pass::before { background: linear-gradient(90deg, #16a34a, #22c55e); }
.fx-res-banner.fail::before { background: linear-gradient(90deg, #dc2626, #ef4444); }
.fx-res-banner.void::before { background: linear-gradient(90deg, #475569, #64748b); }

/* Outcome icon circle */
.fx-res-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  margin: 0 auto 20px;
}
.fx-res-icon.pass { background: #dcfce7; color: #16a34a; }
.fx-res-icon.fail { background: #fee2e2; color: #dc2626; }
.fx-res-icon.void { background: #f1f5f9; color: #475569; }

.fx-res-outcome {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.fx-res-outcome.pass { color: #16a34a; }
.fx-res-outcome.fail { color: #dc2626; }
.fx-res-outcome.void { color: #64748b; }

.fx-res-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.2;
}
.fx-res-subtitle {
  font-size: 0.98rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

/* Score row */
.fx-res-score-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.fx-res-score-card {
  padding: 16px 22px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  min-width: 130px;
  text-align: center;
}
.fx-res-score-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}
.fx-res-score-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.fx-res-score-value.pass { color: #16a34a; }
.fx-res-score-value.fail { color: #dc2626; }

/* Section */
.fx-res-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-res-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
}

/* Module breakdown */
.fx-mod-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid #f1f5f9;
}
.fx-mod-row:first-child { border-top: none; }

.fx-mod-info { min-width: 0; }
.fx-mod-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fx-mod-desc {
  font-size: 0.78rem;
  color: #94a3b8;
}
.fx-mod-bar-wrap {
  margin-top: 8px;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.fx-mod-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.fx-mod-bar.good { background: #22c55e; }
.fx-mod-bar.warn { background: #f59e0b; }
.fx-mod-bar.bad  { background: #dc2626; }

.fx-mod-score {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
}
.fx-mod-score small {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 2px;
}

/* Action row */
.fx-res-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}
.fx-res-btn {
  padding: 12px 22px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}
.fx-res-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-res-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
}
.fx-res-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-res-btn.secondary:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}

/* Invalidated notice */
.fx-res-void-notice {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px 20px;
  color: #991b1b;
  font-size: 0.9rem;
  line-height: 1.55;
  margin-bottom: 20px;
}
.fx-res-void-notice strong { font-weight: 800; }

/* Meta list */
.fx-res-meta {
  display: grid;
  gap: 10px;
  font-size: 0.88rem;
}
.fx-res-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.fx-res-meta-row:last-child { border-bottom: none; }
.fx-res-meta-label { color: #64748b; }
.fx-res-meta-value { color: #1e293b; font-weight: 600; text-align: right; }

@media (max-width: 600px) {
  .fx-res-banner { padding: 28px 20px 24px; }
  .fx-res-title { font-size: 1.4rem; }
  .fx-res-score-value { font-size: 1.4rem; }
  .fx-mod-row { grid-template-columns: 1fr; }
  .fx-mod-score { text-align: left; }
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function outcomeFor(attempt: Attempt): 'pass' | 'fail' | 'void' {
  if (attempt.status === 'invalidated') return 'void';
  if (attempt.passed === true) return 'pass';
  return 'fail';
}

function barClassFor(percent: number, passMark: number): 'good' | 'warn' | 'bad' {
  if (percent >= passMark) return 'good';
  if (percent >= passMark - 15) return 'warn';
  return 'bad';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ExamResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load everything on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const attemptRes = await api.getAttempt(attemptId!);
      if (cancelled) return;
      if (!attemptRes.ok || !attemptRes.data) {
        setError(
          attemptRes.ok ? 'Attempt not found.' : attemptRes.error.message,
        );
        setLoading(false);
        return;
      }

      const a = attemptRes.data;
      setAttempt(a);

      // Fetch exam for pass mark, title
      const examRes = await api.getExam(a.examId);
      if (cancelled) return;
      if (examRes.ok && examRes.data) {
        setExam(examRes.data);

        // Fetch subject + modules for readable breakdown
        const subjectRes = await api.getSubject(examRes.data.subjectId);
        if (!cancelled && subjectRes.ok && subjectRes.data) {
          setSubject(subjectRes.data);
        }
        const modulesRes = await api.getModules(examRes.data.subjectId);
        if (!cancelled && modulesRes.ok) {
          setModules(modulesRes.data);
        }
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const moduleRows = useMemo(() => {
    if (!attempt || !attempt.moduleBreakdown) return [];
    return Object.entries(attempt.moduleBreakdown).map(([moduleId, stats]) => {
      const mod = modules.find((m) => m.id === moduleId);
      const percent =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        id: moduleId,
        name: mod?.name ?? moduleId,
        description: mod?.description ?? '',
        correct: stats.correct,
        total: stats.total,
        percent,
      };
    });
  }, [attempt, modules]);

  // -------------------------------------------------------------------------
  // Loading / error
  // -------------------------------------------------------------------------
  if (loading || !attempt) {
    return (
      <div className="fx-res-page">
        <style>{pageCss}</style>
        <div className="fx-res-inner">
          <div className="fx-res-loading">
            <div className="fx-res-spinner" />
            <div>Loading your results…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-res-page">
        <style>{pageCss}</style>
        <div className="fx-res-inner">
          <div className="fx-res-error">
            <h2>Could not load results</h2>
            <p>{error}</p>
            <Link to="/exam/dashboard" className="fx-res-btn primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guard: must be logged in
  if (!user) {
    return (
      <div className="fx-res-page">
        <style>{pageCss}</style>
        <div className="fx-res-inner">
          <div className="fx-res-error">
            <h2>Please sign in</h2>
            <p>You must be signed in to view your results.</p>
            <button
              type="button"
              className="fx-res-btn primary"
              onClick={() => navigate('/exam/auth')}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard: attempt belongs to this user
  if (attempt.userId !== user.id) {
    return (
      <div className="fx-res-page">
        <style>{pageCss}</style>
        <div className="fx-res-inner">
          <div className="fx-res-error">
            <h2>Not your attempt</h2>
            <p>This attempt belongs to another user.</p>
            <Link to="/exam/dashboard" className="fx-res-btn primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Compute display values
  // -------------------------------------------------------------------------
  const outcome = outcomeFor(attempt);
  const score = attempt.scorePercent ?? 0;
  const passMark = exam?.rules.passMarkPercent ?? 70;
  const correctCount = Math.round(
    (score / 100) * attempt.questionIds.length,
  );
  const totalCount = attempt.questionIds.length;

  const bannerCopy =
    outcome === 'pass'
      ? {
          eyebrow: 'Result',
          title: 'Congratulations — you passed',
          subtitle: `You have successfully completed ${exam?.title ?? 'this exam'}. Your certification has been recorded.`,
          icon: '✓',
        }
      : outcome === 'fail'
        ? {
            eyebrow: 'Result',
            title: 'Not passed',
            subtitle: `You scored below the ${passMark}% pass mark. Review the breakdown below and try again when you're ready.`,
            icon: '✗',
          }
        : {
            eyebrow: 'Result',
            title: 'Attempt invalidated',
            subtitle: 'Your attempt was flagged for review due to integrity violations. Please contact your training coordinator.',
            icon: '⊘',
          };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-res-page">
      <style>{pageCss}</style>

      <div className="fx-res-inner">
        {/* Outcome banner */}
        <div className={`fx-res-banner ${outcome}`}>
          <div className={`fx-res-icon ${outcome}`} aria-hidden="true">
            {bannerCopy.icon}
          </div>
          <div className={`fx-res-outcome ${outcome}`}>
            {bannerCopy.eyebrow}
          </div>
          <h1 className="fx-res-title">{bannerCopy.title}</h1>
          <p className="fx-res-subtitle">{bannerCopy.subtitle}</p>

          <div className="fx-res-score-row">
            <div className="fx-res-score-card">
              <div className="fx-res-score-label">Your score</div>
              <div className={`fx-res-score-value ${outcome === 'void' ? '' : outcome}`}>
                {score}%
              </div>
            </div>
            <div className="fx-res-score-card">
              <div className="fx-res-score-label">Correct</div>
              <div className="fx-res-score-value">
                {correctCount} / {totalCount}
              </div>
            </div>
            <div className="fx-res-score-card">
              <div className="fx-res-score-label">Pass mark</div>
              <div className="fx-res-score-value">{passMark}%</div>
            </div>
          </div>
        </div>

        {/* Invalidated notice — extra explanation */}
        {outcome === 'void' && (
          <div className="fx-res-void-notice">
            <strong>Why was this invalidated?</strong> Your attempt recorded{' '}
            {attempt.proctorEventCount} proctoring{' '}
            {attempt.proctorEventCount === 1 ? 'event' : 'events'}. If you
            believe this was in error, contact your training coordinator with
            your attempt ID.
          </div>
        )}

        {/* Per-module breakdown */}
        {moduleRows.length > 0 && (
          <div className="fx-res-section">
            <h2 className="fx-res-section-title">Performance by module</h2>
            {moduleRows.map((row) => (
              <div key={row.id} className="fx-mod-row">
                <div className="fx-mod-info">
                  <div className="fx-mod-name">{row.name}</div>
                  {row.description && (
                    <div className="fx-mod-desc">{row.description}</div>
                  )}
                  <div className="fx-mod-bar-wrap">
                    <div
                      className={`fx-mod-bar ${barClassFor(row.percent, passMark)}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
                <div className="fx-mod-score">
                  {row.percent}%
                  <small>
                    {row.correct} / {row.total} correct
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attempt metadata */}
        <div className="fx-res-section">
          <h2 className="fx-res-section-title">Attempt details</h2>
          <div className="fx-res-meta">
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Exam</span>
              <span className="fx-res-meta-value">
                {exam?.title ?? attempt.examId}
              </span>
            </div>
            {subject && (
              <div className="fx-res-meta-row">
                <span className="fx-res-meta-label">Subject</span>
                <span className="fx-res-meta-value">{subject.name}</span>
              </div>
            )}
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Exam version</span>
              <span className="fx-res-meta-value">v{attempt.examVersion}</span>
            </div>
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Started</span>
              <span className="fx-res-meta-value">
                {formatDate(attempt.startedAt)}
              </span>
            </div>
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Submitted</span>
              <span className="fx-res-meta-value">
                {formatDate(attempt.submittedAt)}
              </span>
            </div>
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Proctoring events</span>
              <span className="fx-res-meta-value">
                {attempt.proctorEventCount}
              </span>
            </div>
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Status</span>
              <span className="fx-res-meta-value">
                {attempt.status === 'auto-submitted'
                  ? 'Auto-submitted (time expired)'
                  : attempt.status === 'invalidated'
                    ? 'Invalidated'
                    : 'Submitted'}
              </span>
            </div>
            <div className="fx-res-meta-row">
              <span className="fx-res-meta-label">Attempt ID</span>
              <span
                className="fx-res-meta-value"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  wordBreak: 'break-all',
                }}
              >
                {attempt.id}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="fx-res-actions">
          <Link to="/exam/dashboard" className="fx-res-btn secondary">
            ← Back to dashboard
          </Link>
          {outcome === 'fail' && exam && (
            <Link
              to={`/exam/exam/${exam.id}`}
              className="fx-res-btn primary"
            >
              Retake exam →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};