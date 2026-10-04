// ============================================================================
// src/pages/dashboard/Dashboard.tsx
//
// The platform dashboard. This is the user's home after login.
//
// Shows:
//   - Greeting + sign out
//   - Stats (courses, exams taken, passed, average score)
//   - Mini calendar + due-this-week list
//   - My Courses (real enrolments from the enrolments store)
//   - Feature: "Take your exams"
//   - Recent exam activity
//   - Certificates (placeholder)
//
// 🔌 AWS: Reads from services/api.ts. Enrolments, attempts, exams,
//         assignments, and calendar events all come from the same seam.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Attempt, Exam } from '../../types/exam.types';
import type { Enrolment } from '../../types/course.types';

import { MiniCalendar } from '../../components/dashboard/MiniCalendar';
import type {
  CalendarEvent,
  AssignmentWithProgress,
} from '../../types/assignment.types';

import { CertificateCard } from '../../components/dashboard/CertificateCard';
import type { Certificate } from '../../types/certificate.types';

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

/* ================= Header ================= */
.fx-dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.fx-dash-greeting-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-dash-greeting {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.fx-dash-greeting-sub {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}
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
  transition: all 0.15s ease;
}
.fx-dash-logout:hover {
  border-color: #d95300;
  color: #d95300;
}

/* ================= Stats ================= */
.fx-dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 36px;
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
  letter-spacing: 0.6px;
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

/* ================= Section ================= */
.fx-dash-section {
  margin-bottom: 40px;
  scroll-margin-top: 100px;
}
.fx-dash-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.fx-dash-section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.fx-dash-section-sub {
  font-size: 0.82rem;
  color: #94a3b8;
}
.fx-dash-section-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d95300;
  text-decoration: none;
}
.fx-dash-section-link:hover {
  text-decoration: underline;
}

/* ================= Card grid ================= */
.fx-dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ================= Card ================= */
.fx-dash-card {
  display: block;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.fx-dash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.10);
  border-color: #fed7aa;
}
.fx-dash-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #fff7ed;
  color: #d95300;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 14px;
}
.fx-dash-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.35;
}
.fx-dash-card-desc {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}
.fx-dash-card-cta {
  display: inline-block;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  width: 100%;
  color: #d95300;
  font-size: 0.85rem;
  font-weight: 700;
}

/* ================= Big feature card ================= */
.fx-dash-feature {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  background: linear-gradient(135deg, #d95300 0%, #b54400 100%);
  color: #ffffff;
  padding: 32px 28px;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(217, 83, 0, 0.25);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}
.fx-dash-feature:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 45px rgba(217, 83, 0, 0.35);
}
@media (min-width: 720px) {
  .fx-dash-feature {
    grid-template-columns: minmax(0, 1fr) 220px;
    align-items: center;
    padding: 36px 40px;
  }
}
.fx-dash-feature-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  opacity: 0.85;
  margin-bottom: 8px;
}
.fx-dash-feature-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.2;
}
.fx-dash-feature-desc {
  font-size: 0.95rem;
  line-height: 1.55;
  opacity: 0.9;
  margin: 0 0 18px;
  max-width: 520px;
}
.fx-dash-feature-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.fx-dash-feature-stat {
  display: flex;
  flex-direction: column;
}
.fx-dash-feature-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}
.fx-dash-feature-stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.85;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fx-dash-feature-cta {
  align-self: end;
  justify-self: end;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.3);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
@media (min-width: 720px) {
  .fx-dash-feature-cta {
    align-self: center;
  }
}

/* ================= Placeholder section ================= */
.fx-dash-placeholder {
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
  padding: 32px 24px;
  text-align: center;
}
.fx-dash-placeholder-icon {
  font-size: 2rem;
  opacity: 0.4;
  margin-bottom: 10px;
}
.fx-dash-placeholder-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.fx-dash-placeholder-sub {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 16px;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}
.fx-dash-placeholder-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #d95300;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  transition: background-color 0.15s ease;
}
.fx-dash-placeholder-btn:hover {
  background: #b54400;
}

/* ================= Recent activity list ================= */
.fx-dash-list {
  display: grid;
  gap: 10px;
}
.fx-dash-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.fx-dash-list-item:hover {
  border-color: #fed7aa;
  transform: translateY(-1px);
}
.fx-dash-list-info {
  flex: 1;
  min-width: 0;
}
.fx-dash-list-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fx-dash-list-meta {
  font-size: 0.78rem;
  color: #94a3b8;
}
.fx-dash-list-score {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  text-align: right;
  flex-shrink: 0;
}
.fx-dash-list-score small {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 2px;
}
.fx-dash-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}
.fx-dash-pill.pass { background: #dcfce7; color: #166534; }
.fx-dash-pill.fail { background: #fee2e2; color: #991b1b; }
.fx-dash-pill.wip  { background: #fef3c7; color: #92400e; }
.fx-dash-pill.owned { background: #dbeafe; color: #1e40af; }

/* ================= Upcoming section ================= */
.fx-dash-upcoming-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}
@media (min-width: 720px) {
  .fx-dash-upcoming-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.fx-dash-due-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-dash-due-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.fx-dash-due-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.fx-dash-due-link {
  font-size: 0.8rem;
  font-weight: 700;
  color: #d95300;
  text-decoration: none;
}
.fx-dash-due-link:hover {
  text-decoration: underline;
}

.fx-dash-due-empty {
  text-align: center;
  padding: 24px 12px;
  color: #94a3b8;
  font-size: 0.85rem;
}
.fx-dash-due-empty-icon {
  font-size: 1.8rem;
  opacity: 0.4;
  margin-bottom: 8px;
}

.fx-dash-due-list {
  display: grid;
  gap: 8px;
}

.fx-dash-due-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.12s ease;
}
.fx-dash-due-item:hover {
  background: #f8fafc;
}

.fx-dash-due-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
}
.fx-dash-due-dot.high   { background: #dc2626; }
.fx-dash-due-dot.normal { background: #d95300; }
.fx-dash-due-dot.low    { background: #94a3b8; }
.fx-dash-due-dot.overdue { background: #dc2626; }

.fx-dash-due-info {
  flex: 1;
  min-width: 0;
}
.fx-dash-due-name {
  font-size: 0.86rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.fx-dash-due-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 3px;
}
.fx-dash-due-meta.overdue {
  color: #dc2626;
  font-weight: 700;
}

.fx-dash-due-more {
  font-size: 0.78rem;
  color: #d95300;
  font-weight: 700;
  text-align: center;
  padding: 8px 0 0;
  text-decoration: none;
}

/* Loading */
.fx-dash-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .fx-dash-greeting { font-size: 1.6rem; }
  .fx-dash-stat-value { font-size: 1.5rem; }
  .fx-dash-feature-title { font-size: 1.2rem; }
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ---- Core dashboard data ----
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);

  // ---- Calendar / assignment data ----
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<
    AssignmentWithProgress[]
  >([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // ---- Loading / error ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load data — attempts, exams, enrolments, calendar events, assignments
  // all in parallel.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [
  attemptsRes,
  examsRes,
  enrolmentsRes,
  eventsRes,
  assignmentsRes,
  certsRes,
] = await Promise.all([
  api.getUserAttempts(user!.id),
  api.getAvailableExamsForUser(user!.id),
  api.getUserEnrolments(user!.id),
  api.getCalendarEvents(user!.id),
  api.getAssignmentsForUser(user!.id),
  api.getCertificatesForUser(user!.id),
]);

      if (cancelled) return;

      // Core data — if any of these fail, show the error
      if (!attemptsRes.ok) {
        setError(attemptsRes.error.message);
        setLoading(false);
        return;
      }
      if (!examsRes.ok) {
        setError(examsRes.error.message);
        setLoading(false);
        return;
      }
      if (!enrolmentsRes.ok) {
        setError(enrolmentsRes.error.message);
        setLoading(false);
        return;
      }

      setAttempts(attemptsRes.data);
      setExams(examsRes.data);
      setEnrolments(enrolmentsRes.data);

      // Calendar / assignment data — non-fatal if they fail
      if (eventsRes.ok) setCalendarEvents(eventsRes.data);
      if (assignmentsRes.ok) {
        const upcoming = assignmentsRes.data.filter((a) => {
          if (a.status === 'completed' || a.status === 'late') return false;
          return a.daysUntilDue <= 7;
        });
        setUpcomingAssignments(upcoming);
      }

      if (certsRes.ok) setCertificates(certsRes.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Scroll to a section when the URL hash changes (e.g. /dashboard#my-courses).
  // Runs after data loads so the target element exists in the DOM.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (loading) return;
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    // Give the browser a tick to paint the section before scrolling.
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [location.hash, loading]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const passed = attempts.filter((a) => a.passed === true).length;
    const inProgress = attempts.filter(
      (a) => a.status === 'in-progress',
    ).length;
    const completed = attempts.filter(
      (a) =>
        a.status === 'submitted' ||
        a.status === 'auto-submitted' ||
        a.status === 'invalidated',
    ).length;
    const scored = attempts.filter(
      (a) => typeof a.scorePercent === 'number',
    );
    const avgScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, a) => s + (a.scorePercent ?? 0), 0) /
              scored.length,
          )
        : 0;
    return {
      totalAttempts: attempts.length,
      passed,
      inProgress,
      completed,
      avgScore,
    };
  }, [attempts]);

  const recentAttempts = useMemo(
    () =>
      [...attempts]
        .sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1))
        .slice(0, 5),
    [attempts],
  );

  const examById = useMemo(() => {
    const m: Record<string, Exam> = {};
    for (const e of exams) m[e.id] = e;
    return m;
  }, [exams]);

  const activeEnrolments = useMemo(
    () =>
      [...enrolments]
        .filter((e) => e.status === 'active')
        .sort((a, b) => (a.purchasedAt > b.purchasedAt ? -1 : 1)),
    [enrolments],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // ---------------------------------------------------------------------------
  // Guard
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-dash-page">
        <style>{pageCss}</style>
        <div className="fx-dash-inner">
          <div className="fx-dash-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  const firstName = user.displayName.split(' ')[0] || user.displayName;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="fx-dash-page">
      <style>{pageCss}</style>

      <div className="fx-dash-inner">
        {/* ============ HEADER ============ */}
        <div className="fx-dash-header">
          <div>
            <div className="fx-dash-greeting-eyebrow">Dashboard</div>
            <h1 className="fx-dash-greeting">Hello, {firstName}</h1>
            <p className="fx-dash-greeting-sub">
              Your courses, exams, and certifications all in one place.
            </p>
          </div>
          <button className="fx-dash-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>

        {/* ============ LOADING / ERROR ============ */}
        {loading && (
          <div className="fx-dash-loading">Loading your dashboard…</div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 10,
              fontSize: '0.88rem',
              marginBottom: 24,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ============ STATS ============ */}
            <div className="fx-dash-stats">
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">My courses</div>
                <div className="fx-dash-stat-value">
                  {activeEnrolments.length}
                </div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Exams taken</div>
                <div className="fx-dash-stat-value">{stats.completed}</div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Passed</div>
                <div className="fx-dash-stat-value">{stats.passed}</div>
              </div>
              <div className="fx-dash-stat">
                <div className="fx-dash-stat-label">Average score</div>
                <div className="fx-dash-stat-value">{stats.avgScore}%</div>
              </div>
            </div>

            {/* ============ UPCOMING: CALENDAR + DUE THIS WEEK ============ */}
            <div className="fx-dash-section">
              <div className="fx-dash-section-head">
                <h2 className="fx-dash-section-title">Upcoming</h2>
                <Link
                  to="/dashboard/calendar"
                  className="fx-dash-section-link"
                >
                  Open full calendar →
                </Link>
              </div>

              <div className="fx-dash-upcoming-grid">
                {/* Left: Mini calendar */}
                <MiniCalendar
                  events={calendarEvents}
                  onOpenFullCalendar={() => navigate('/dashboard/calendar')}
                />

                {/* Right: Due this week list */}
                <div className="fx-dash-due-card">
                  <div className="fx-dash-due-head">
                    <h3 className="fx-dash-due-title">Due this week</h3>
                    {upcomingAssignments.length > 0 && (
                      <Link
                        to="/dashboard/todo"
                        className="fx-dash-due-link"
                      >
                        To do list →
                      </Link>
                    )}
                  </div>

                  {upcomingAssignments.length === 0 ? (
                    <div className="fx-dash-due-empty">
                      <div
                        className="fx-dash-due-empty-icon"
                        aria-hidden="true"
                      >
                        ✨
                      </div>
                      Nothing due this week.
                    </div>
                  ) : (
                    <>
                      <div className="fx-dash-due-list">
                        {upcomingAssignments.slice(0, 5).map((item) => {
                          const isOverdue = item.status === 'overdue';
                          const dotClass = isOverdue
                            ? 'overdue'
                            : item.assignment.priority;

                          const dueLabel = isOverdue
                            ? 'Overdue'
                            : item.daysUntilDue < 0
                              ? 'Overdue'
                              : item.daysUntilDue === 0
                                ? 'Due today'
                                : item.daysUntilDue === 1
                                  ? 'Due tomorrow'
                                  : `Due in ${item.daysUntilDue} days`;

                          return (
                            <Link
                              key={item.assignment.id}
                              to="/dashboard/todo"
                              className="fx-dash-due-item"
                            >
                              <span
                                className={`fx-dash-due-dot ${dotClass}`}
                                aria-hidden="true"
                              />
                              <span className="fx-dash-due-info">
                                <span className="fx-dash-due-name">
                                  {item.assignment.title}
                                </span>
                                <span
                                  className={`fx-dash-due-meta${
                                    isOverdue ? ' overdue' : ''
                                  }`}
                                >
                                  {dueLabel}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                      {upcomingAssignments.length > 5 && (
                        <Link
                          to="/dashboard/todo"
                          className="fx-dash-due-more"
                          style={{
                            display: 'block',
                            marginTop: 8,
                          }}
                        >
                          +{upcomingAssignments.length - 5} more →
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* ============ RECENT CERTIFICATES ============ */}
{certificates.length > 0 && (
  <div className="fx-dash-section">
    <div className="fx-dash-section-head">
      <h2 className="fx-dash-section-title">
        Recent certificates
      </h2>
      <Link
        to="/dashboard/certificates"
        className="fx-dash-section-link"
      >
        View all →
      </Link>
    </div>

    <div className="fx-dash-grid">
      {certificates.slice(0, 3).map((cert) => (
        <CertificateCard key={cert.id} certificate={cert} />
      ))}
    </div>
  </div>
)}

            {/* ============ MY COURSES ============ */}
            <div className="fx-dash-section" id="my-courses">
              <div className="fx-dash-section-head">
                <h2 className="fx-dash-section-title">My Courses</h2>
                <Link to="/courses" className="fx-dash-section-link">
                  Browse catalogue →
                </Link>
              </div>

              {activeEnrolments.length === 0 ? (
                <div className="fx-dash-placeholder">
                  <div
                    className="fx-dash-placeholder-icon"
                    aria-hidden="true"
                  >
                    📚
                  </div>
                  <h3 className="fx-dash-placeholder-title">
                    You haven't bought any courses yet
                  </h3>
                  <p className="fx-dash-placeholder-sub">
                    Browse the catalogue to find courses on Dangerous Goods,
                    Aviation Security, Cabin Crew, and more.
                  </p>
                  <Link
                    to="/courses"
                    className="fx-dash-placeholder-btn"
                  >
                    Browse courses
                  </Link>
                </div>
              ) : (
                <div className="fx-dash-grid">
                  {activeEnrolments.map((enrolment) => (
                    <Link
                      key={enrolment.id}
                      to={`/courses/${enrolment.courseSlug}/learn`}
                      className="fx-dash-card"
                    >
                      <div
                        className="fx-dash-card-icon"
                        aria-hidden="true"
                      >
                        📘
                      </div>
                      <h3 className="fx-dash-card-title">
                        {enrolment.courseTitle}
                      </h3>
                      <p className="fx-dash-card-desc">
                        Purchased{' '}
                        {new Date(
                          enrolment.purchasedAt,
                        ).toLocaleDateString()}
                      </p>
                      <div className="fx-dash-card-cta">
                        Open course →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ============ FEATURE: EXAMS ============ */}
            <div className="fx-dash-section">
              <a href="/exam/dashboard" className="fx-dash-feature">
                <div>
                  <div className="fx-dash-feature-eyebrow">
                    Certifications
                  </div>
                  <h2 className="fx-dash-feature-title">
                    Take your exams
                  </h2>
                  <p className="fx-dash-feature-desc">
                    Proctored assessments for Dangerous Goods, Aviation
                    Security, and more. Track your progress and see results
                    as you complete each one.
                  </p>
                  <div className="fx-dash-feature-stats">
                    <div className="fx-dash-feature-stat">
                      <div className="fx-dash-feature-stat-value">
                        {exams.length}
                      </div>
                      <div className="fx-dash-feature-stat-label">
                        Available
                      </div>
                    </div>
                    <div className="fx-dash-feature-stat">
                      <div className="fx-dash-feature-stat-value">
                        {stats.passed}
                      </div>
                      <div className="fx-dash-feature-stat-label">
                        Passed
                      </div>
                    </div>
                    {stats.inProgress > 0 && (
                      <div className="fx-dash-feature-stat">
                        <div className="fx-dash-feature-stat-value">
                          {stats.inProgress}
                        </div>
                        <div className="fx-dash-feature-stat-label">
                          In progress
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="fx-dash-feature-cta">
                  Go to exams →
                </div>
              </a>
            </div>

            {/* ============ RECENT ACTIVITY ============ */}
            {recentAttempts.length > 0 && (
              <div className="fx-dash-section">
                <div className="fx-dash-section-head">
                  <h2 className="fx-dash-section-title">Recent activity</h2>
                  <Link
                    to="/exam/dashboard"
                    className="fx-dash-section-link"
                  >
                    View all →
                  </Link>
                </div>
                <div className="fx-dash-list">
                  {recentAttempts.map((a) => {
                    const exam = examById[a.examId];
                    const isInProgress = a.status === 'in-progress';
                    const isInvalidated = a.status === 'invalidated';
                    const isPassed = a.passed === true;
                    const isFailed = a.passed === false && !isInvalidated;

                    return (
                      <Link
                        key={a.id}
                        to={
                          isInProgress
                            ? `/exam/attempt/${a.id}`
                            : `/exam/results/${a.id}`
                        }
                        className="fx-dash-list-item"
                      >
                        <div className="fx-dash-list-info">
                          <div className="fx-dash-list-title">
                            {exam?.title ?? 'Exam'}
                          </div>
                          <div className="fx-dash-list-meta">
                            {isInProgress
                              ? 'In progress — click to resume'
                              : a.submittedAt
                                ? `Completed ${new Date(
                                    a.submittedAt,
                                  ).toLocaleDateString()}`
                                : 'Completed'}
                          </div>
                        </div>
                        {isInProgress && (
                          <span className="fx-dash-pill wip">
                            In progress
                          </span>
                        )}
                        {isPassed && (
                          <span className="fx-dash-pill pass">Passed</span>
                        )}
                        {isFailed && (
                          <span className="fx-dash-pill fail">
                            Not passed
                          </span>
                        )}
                        {isInvalidated && (
                          <span className="fx-dash-pill fail">
                            Invalidated
                          </span>
                        )}
                        <div className="fx-dash-list-score">
                          {a.scorePercent !== undefined && !isInProgress
                            ? `${a.scorePercent}%`
                            : '—'}
                          <small>
                            {isInProgress ? 'Resume →' : 'View →'}
                          </small>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ CERTIFICATES (placeholder) ============ */}
            <div className="fx-dash-section">
              <div className="fx-dash-section-head">
                <h2 className="fx-dash-section-title">Certificates</h2>
              </div>
              <div className="fx-dash-placeholder">
                <div
                  className="fx-dash-placeholder-icon"
                  aria-hidden="true"
                >
                  🏆
                </div>
                <h3 className="fx-dash-placeholder-title">
                  Your certificates will appear here
                </h3>
                <p className="fx-dash-placeholder-sub">
                  Once you pass an exam, you'll be able to download your
                  certificate as a PDF. Regulatory-grade certificates are
                  on the roadmap.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};