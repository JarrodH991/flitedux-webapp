// ============================================================================
// src/pages/exam/ExamDashboard.tsx
//
// Learner dashboard. The home page after a candidate logs in.
//
// Shows:
//   - Welcome header with user's name
//   - Summary stats (total attempts, passed, average score)
//   - In-progress attempts (with resume button)
//   - Available exams (clickable cards)
//   - Past results (clickable)
//
// Data comes from services/api.ts — same AWS seam as everywhere else.
//
// 🔌 AWS: getAvailableExamsForUser + getUserAttempts are the two calls.
//         Both have 🔌 comments in api.ts.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Exam, Attempt } from '../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-dash-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-dash-inner {
  max-width: 1100px;
  margin: 0 auto;
}

/* Hero */
.fx-dash-hero {
  margin-bottom: 36px;
  animation: fxDashIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
.fx-dash-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-dash-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.2;
}
.fx-dash-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

@keyframes fxDashIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Stats row */
.fx-dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 40px;
}
.fx-dash-stat {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-dash-stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-dash-stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

/* Section heading */
.fx-dash-section {
  margin-bottom: 40px;
}
.fx-dash-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.fx-dash-section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.fx-dash-section-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d95300;
  text-decoration: none;
}
.fx-dash-section-link:hover { text-decoration: underline; }

/* Card grid */
.fx-dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Card */
.fx-dash-card {
  display: block;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.fx-dash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.10);
  border-color: #fed7aa;
}

.fx-dash-card-cat {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-dash-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  line-height: 1.35;
}
.fx-dash-card-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fx-dash-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.82rem;
  color: #64748b;
}
.fx-dash-card-meta strong { color: #334155; }

/* Pill */
.fx-dash-pill {
  display: inline-block;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.fx-dash-pill.pass   { background: #dcfce7; color: #166534; }
.fx-dash-pill.fail   { background: #fee2e2; color: #991b1b; }
.fx-dash-pill.wip    { background: #fef3c7; color: #92400e; }
.fx-dash-pill.void   { background: #f1f5f9; color: #475569; }

/* Attempt row */
.fx-dash-attempt {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.fx-dash-attempt:hover {
  transform: translateY(-1px);
  border-color: #fed7aa;
  box-shadow: 0 6px 16px rgba(217, 83, 0, 0.08);
}
.fx-dash-attempt-info { flex: 1; min-width: 0; }
.fx-dash-attempt-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fx-dash-attempt-meta {
  font-size: 0.8rem;
  color: #94a3b8;
}
.fx-dash-attempt-score {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  text-align: right;
  flex-shrink: 0;
}
.fx-dash-attempt-score small {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 2px;
}

/* Empty state */
.fx-dash-empty {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.92rem;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
}

/* Loading */
.fx-dash-loading {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.95rem;
}

.fx-dash-spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 3px solid #e2e8f0;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxDashSpin 0.7s linear infinite;
  margin-bottom: 12px;
}
@keyframes fxDashSpin { to { transform: rotate(360deg); } }

/* Logout button */
.fx-dash-logout {
  background: none;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.fx-dash-logout:hover {
  border-color: #d95300;
  color: #d95300;
}

@media (max-width: 600px) {
  .fx-dash-title { font-size: 1.5rem; }
  .fx-dash-stat-value { font-size: 1.5rem; }
  .fx-dash-attempt { flex-wrap: wrap; }
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ExamDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load data on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [examsRes, attemptsRes] = await Promise.all([
        api.getAvailableExamsForUser(user!.id),
        api.getUserAttempts(user!.id),
      ]);

      if (cancelled) return;

      if (!examsRes.ok) {
        setError(examsRes.error.message);
        setLoading(false);
        return;
      }
      if (!attemptsRes.ok) {
        setError(attemptsRes.error.message);
        setLoading(false);
        return;
      }

      setExams(examsRes.data);
      setAttempts(attemptsRes.data);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const inProgress = attempts.filter((a) => a.status === 'in-progress');
  const completed = attempts.filter(
    (a) => a.status === 'submitted' || a.status === 'auto-submitted' || a.status === 'invalidated',
  );
  const passed = attempts.filter((a) => a.passed === true);
  const scored = attempts.filter((a) => typeof a.scorePercent === 'number');
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, a) => sum + (a.scorePercent ?? 0), 0) / scored.length)
    : 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // -------------------------------------------------------------------------
  // Guard: if not logged in, nothing to render (ProtectedRoute will handle)
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-dash-page">
        <style>{pageCss}</style>
        <div className="fx-dash-inner">
          <div className="fx-dash-loading">
            <div className="fx-dash-spinner" />
            <div>Redirecting…</div>
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.displayName.split(' ')[0] || user.displayName;

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-dash-page">
      <style>{pageCss}</style>

      <div className="fx-dash-inner">
        {/* HERO */}
        <div className="fx-dash-hero" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="fx-dash-eyebrow">Exam Portal</div>
            <h1 className="fx-dash-title">Welcome back, {firstName}</h1>
            <p className="fx-dash-subtitle">
              Your certifications, exams, and progress all in one place.
            </p>
          </div>
          <button className="fx-dash-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="fx-dash-loading">
            <div className="fx-dash-spinner" />
            <div>Loading your dashboard…</div>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: '0.9rem',
              marginBottom: 24,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* STATS */}
        {!loading && !error && (
          <>
            <div className="fx-dash-stats">
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Total attempts</div>
                <div className="fx-dash-stat-value">{attempts.length}</div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Passed</div>
                <div className="fx-dash-stat-value">{passed.length}</div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Average score</div>
                <div className="fx-dash-stat-value">{avgScore}%</div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">In progress</div>
                <div className="fx-dash-stat-value">{inProgress.length}</div>
              </div>
            </div>

            {/* IN-PROGRESS */}
            {inProgress.length > 0 && (
              <div className="fx-dash-section">
                <div className="fx-dash-section-head">
                  <h2 className="fx-dash-section-title">Continue where you left off</h2>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {inProgress.map((a) => {
                    const exam = exams.find((e) => e.id === a.examId);
                    return (
                      <Link
                        key={a.id}
                        to={`/exam/attempt/${a.id}`}
                        className="fx-dash-attempt"
                      >
                        <div className="fx-dash-attempt-info">
                          <div className="fx-dash-attempt-title">
                            {exam?.title ?? 'Exam in progress'}
                          </div>
                          <div className="fx-dash-attempt-meta">
                            Started {new Date(a.startedAt).toLocaleDateString()} — resume anytime before the deadline
                          </div>
                        </div>
                        <span className="fx-dash-pill wip">In Progress</span>
                        <div className="fx-dash-attempt-score">
                          Resume
                          <small>→</small>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AVAILABLE EXAMS */}
            <div className="fx-dash-section">
              <div className="fx-dash-section-head">
                <h2 className="fx-dash-section-title">Available exams</h2>
              </div>
              {exams.length === 0 ? (
                <div className="fx-dash-empty">
                  You don't have any exams available yet. Contact your training coordinator.
                </div>
              ) : (
                <div className="fx-dash-grid">
                  {exams.map((exam) => {
                    const lastAttempt = attempts
                      .filter((a) => a.examId === exam.id)
                      .sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1))[0];
                    const hasInProgress = lastAttempt?.status === 'in-progress';

                    return (
                      <Link
                        key={exam.id}
                        to={`/exam/exam/${exam.id}`}
                        className="fx-dash-card"
                      >
                        <div className="fx-dash-card-cat">
                          {exam.rules.passMarkPercent}% to pass
                        </div>
                        <h3 className="fx-dash-card-title">{exam.title}</h3>
                        <p className="fx-dash-card-desc">{exam.description}</p>

                        {lastAttempt && (
                          <div style={{ marginBottom: 10 }}>
                            {lastAttempt.passed === true && (
                              <span className="fx-dash-pill pass">Passed · {lastAttempt.scorePercent}%</span>
                            )}
                            {lastAttempt.passed === false && lastAttempt.status === 'invalidated' && (
                              <span className="fx-dash-pill void">Invalidated</span>
                            )}
                            {lastAttempt.passed === false && lastAttempt.status !== 'invalidated' && (
                              <span className="fx-dash-pill fail">Not passed · {lastAttempt.scorePercent}%</span>
                            )}
                            {hasInProgress && (
                              <span className="fx-dash-pill wip">In progress</span>
                            )}
                          </div>
                        )}

                        <div className="fx-dash-card-meta">
                          <span>
                            <strong>{exam.rules.timeLimitMinutes || '∞'}</strong>
                            {exam.rules.timeLimitMinutes ? ' min' : ''}
                          </span>
                          <span style={{ color: '#d95300', fontWeight: 700 }}>
                            {lastAttempt?.status === 'in-progress' ? 'Resume →' : 'Start →'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PAST RESULTS */}
            <div className="fx-dash-section">
              <div className="fx-dash-section-head">
                <h2 className="fx-dash-section-title">Past results</h2>
              </div>
              {completed.length === 0 ? (
                <div className="fx-dash-empty">
                  You haven't completed any exams yet. Once you do, they'll show up here.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {completed.map((a) => {
                    const exam = exams.find((e) => e.id === a.examId);
                    const pillClass =
                      a.status === 'invalidated' ? 'void'
                      : a.passed ? 'pass'
                      : 'fail';
                    const pillLabel =
                      a.status === 'invalidated' ? 'Invalidated'
                      : a.passed ? 'Passed'
                      : 'Not passed';

                    return (
                      <Link
                        key={a.id}
                        to={`/exam/results/${a.id}`}
                        className="fx-dash-attempt"
                      >
                        <div className="fx-dash-attempt-info">
                          <div className="fx-dash-attempt-title">
                            {exam?.title ?? 'Exam'}
                          </div>
                          <div className="fx-dash-attempt-meta">
                            {a.submittedAt
                              ? `Submitted ${new Date(a.submittedAt).toLocaleDateString()}`
                              : 'No submission date'}
                          </div>
                        </div>
                        <span className={`fx-dash-pill ${pillClass}`}>{pillLabel}</span>
                        <div className="fx-dash-attempt-score">
                          {a.scorePercent ?? '—'}{a.scorePercent !== undefined ? '%' : ''}
                          <small>View →</small>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};