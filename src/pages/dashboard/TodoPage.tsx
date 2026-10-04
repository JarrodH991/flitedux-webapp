// ============================================================================
// src/pages/dashboard/TodoPage.tsx
//
// To-do list at /dashboard/todo.
//
// Shows all assignments visible to the user, bucketed by urgency:
//   - Overdue
//   - Due today
//   - Due this week
//   - Upcoming
//   - Completed
//
// Users can mark assignments complete directly from the list. Clicking
// an assignment navigates to the relevant lesson / exam / task.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type {
  AssignmentWithProgress,
  AssignmentProgress,
} from '../../types/assignment.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-todo-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-todo-inner {
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.fx-todo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.fx-todo-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-todo-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.fx-todo-sub {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

/* Buttons */
.fx-todo-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
}
.fx-todo-btn:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-todo-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-todo-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Summary stats */
.fx-todo-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.fx-todo-stat {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-todo-stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-todo-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}
.fx-todo-stat-value.overdue { color: #dc2626; }
.fx-todo-stat-value.today   { color: #d95300; }
.fx-todo-stat-value.week    { color: #0f172a; }
.fx-todo-stat-value.done    { color: #16a34a; }

/* Section */
.fx-todo-section {
  margin-bottom: 24px;
}
.fx-todo-section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 0 4px;
}
.fx-todo-section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fx-todo-section-dot.overdue { background: #dc2626; }
.fx-todo-section-dot.today   { background: #d95300; }
.fx-todo-section-dot.week    { background: #eab308; }
.fx-todo-section-dot.upcoming { background: #94a3b8; }
.fx-todo-section-dot.completed { background: #16a34a; }

.fx-todo-section-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fx-todo-section-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  margin-left: auto;
}

/* Assignment row */
.fx-todo-list {
  display: grid;
  gap: 8px;
}

.fx-todo-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  position: relative;
}
.fx-todo-row:hover {
  border-color: #fed7aa;
  box-shadow: 0 6px 16px rgba(217, 83, 0, 0.08);
  transform: translateY(-1px);
}
.fx-todo-row.overdue {
  border-color: #fecaca;
  background: #fffbfb;
}
.fx-todo-row.completed {
  opacity: 0.7;
  background: #fafafa;
}

/* Left: colored priority bar */
.fx-todo-row-priority {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
  min-height: 44px;
}
.fx-todo-row-priority.high   { background: #dc2626; }
.fx-todo-row-priority.normal { background: #d95300; }
.fx-todo-row-priority.low    { background: #94a3b8; }

/* Checkbox */
.fx-todo-check {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  margin-top: 2px;
  padding: 0;
  font-family: inherit;
  font-size: 0.9rem;
  color: transparent;
}
.fx-todo-check:hover {
  border-color: #d95300;
}
.fx-todo-check.checked {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

/* Body */
.fx-todo-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.fx-todo-kind {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-todo-kind.lesson { background: #dbeafe; color: #1e40af; }
.fx-todo-kind.quiz   { background: #fef3c7; color: #92400e; }
.fx-todo-kind.exam   { background: #fce7f3; color: #9d174d; }
.fx-todo-kind.task   { background: #f1f5f9; color: #475569; }

.fx-todo-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.35;
}
.fx-todo-row.completed .fx-todo-title {
  color: #94a3b8;
  text-decoration: line-through;
}

.fx-todo-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fx-todo-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: #94a3b8;
}
.fx-todo-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.fx-todo-due {
  font-weight: 700;
}
.fx-todo-due.overdue { color: #dc2626; }
.fx-todo-due.today   { color: #d95300; }
.fx-todo-due.soon    { color: #b45309; }
.fx-todo-due.done    { color: #16a34a; }

/* Right: arrow */
.fx-todo-arrow {
  flex-shrink: 0;
  color: #cbd5e1;
  font-size: 1.1rem;
  align-self: center;
  transition: color 0.15s ease, transform 0.15s ease;
}
.fx-todo-row:hover .fx-todo-arrow {
  color: #d95300;
  transform: translateX(3px);
}

/* Empty states */
.fx-todo-empty {
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
  padding: 60px 24px;
  text-align: center;
}
.fx-todo-empty-icon {
  font-size: 2.4rem;
  opacity: 0.4;
  margin-bottom: 12px;
}
.fx-todo-empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.fx-todo-empty-sub {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* Loading */
.fx-todo-loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Filter tabs — with sliding indicator */
.fx-todo-filters {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
  isolation: isolate;
}

/* The sliding orange pill */
.fx-todo-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px - 12px) / 3);
  background: #d95300;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.2);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  will-change: transform;
  pointer-events: none;
}

.fx-todo-filter {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: color 0.25s ease;
  white-space: nowrap;
}
.fx-todo-filter:hover {
  color: #d95300;
}
.fx-todo-filter.active {
  color: #ffffff;
}
.fx-todo-filter.active:hover {
  color: #ffffff;
}
.fx-todo-filter:focus-visible {
  outline: 2px solid #d95300;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .fx-todo-indicator {
    transition: none;
  }
}

/* Confirm dialog for marking complete */
.fx-todo-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: fxTodoFadeIn 0.2s ease-out both;
}
@keyframes fxTodoFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.fx-todo-dialog {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: sans-serif;
  animation: fxTodoDialogIn 0.25s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxTodoDialogIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.fx-todo-dialog-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}
.fx-todo-dialog-text {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 22px;
}
.fx-todo-dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function bucketFor(
  item: AssignmentWithProgress,
): 'overdue' | 'today' | 'week' | 'upcoming' | 'completed' {
  if (item.status === 'completed' || item.status === 'late') {
    return 'completed';
  }

  if (item.status === 'overdue') return 'overdue';

  const due = new Date(item.assignment.dueAt);
  const now = new Date();

  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  ).getTime();
  const todayDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const oneDayMs = 24 * 60 * 60 * 1000;

  if (dueDay === todayDay) return 'today';
  if (dueDay - todayDay <= 7 * oneDayMs) return 'week';
  return 'upcoming';
}

function formatDue(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round(
      (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return `Today at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Tomorrow at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'lesson': return 'Lesson';
    case 'quiz':   return 'Quiz';
    case 'exam':   return 'Exam';
    case 'task':   return 'Task';
    default:       return kind;
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

type FilterMode = 'all' | 'open' | 'completed';

export const TodoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<AssignmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('open');
  const [pendingComplete, setPendingComplete] =
    useState<AssignmentWithProgress | null>(null);
  const [marking, setMarking] = useState(false);

  // Load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const res = await api.getAssignmentsForUser(user!.id);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }
      setItems(res.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Buckets
  const buckets = useMemo(() => {
    const overdue: AssignmentWithProgress[] = [];
    const today: AssignmentWithProgress[] = [];
    const week: AssignmentWithProgress[] = [];
    const upcoming: AssignmentWithProgress[] = [];
    const completed: AssignmentWithProgress[] = [];

    for (const item of items) {
      const b = bucketFor(item);
      if (b === 'overdue') overdue.push(item);
      else if (b === 'today') today.push(item);
      else if (b === 'week') week.push(item);
      else if (b === 'upcoming') upcoming.push(item);
      else completed.push(item);
    }

    return { overdue, today, week, upcoming, completed };
  }, [items]);

  const openCount =
    buckets.overdue.length + buckets.today.length + buckets.week.length + buckets.upcoming.length;
  const completedCount = buckets.completed.length;

  // Filtered buckets based on the filter mode
  const visibleBuckets = useMemo(() => {
    if (filter === 'completed') {
      return { overdue: [], today: [], week: [], upcoming: [], completed: buckets.completed };
    }
    if (filter === 'all') {
      return buckets;
    }
    // 'open'
    return { ...buckets, completed: [] };
  }, [buckets, filter]);

  const totalVisible =
    visibleBuckets.overdue.length +
    visibleBuckets.today.length +
    visibleBuckets.week.length +
    visibleBuckets.upcoming.length +
    visibleBuckets.completed.length;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const navigateToAssignment = (item: AssignmentWithProgress) => {
    const a = item.assignment;
    let href = '/dashboard';
    if (a.type === 'lesson' || a.type === 'quiz') {
      href = `/courses/${a.courseSlug}/learn${
        a.lessonId ? `?lesson=${a.lessonId}` : ''
      }`;
    } else if (a.type === 'exam' && a.examId) {
      href = `/exam/exam/${a.examId}`;
    }
    navigate(href);
  };

  const handleMarkComplete = async () => {
    if (!pendingComplete || !user) return;
    setMarking(true);

    const res = await api.markAssignmentProgress({
      userId: user.id,
      assignmentId: pendingComplete.assignment.id,
      status: 'completed',
    });

    if (res.ok) {
      // Update the local list
      setItems((prev) =>
        prev.map((item) =>
          item.assignment.id === pendingComplete.assignment.id
            ? {
                ...item,
                progress: res.data,
                status:
                  new Date(res.data.completedAt ?? '').getTime() >
                  new Date(item.assignment.dueAt).getTime()
                    ? 'late'
                    : 'completed',
              }
            : item,
        ),
      );
    }

    setMarking(false);
    setPendingComplete(null);
  };

  const handleUnmarkComplete = async (item: AssignmentWithProgress) => {
    if (!user) return;

    const res = await api.markAssignmentProgress({
      userId: user.id,
      assignmentId: item.assignment.id,
      status: 'not-started',
    });

    if (res.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.assignment.id === item.assignment.id
            ? { ...i, progress: res.data, status: 'upcoming' }
            : i,
        ),
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-todo-page">
        <style>{pageCss}</style>
        <div className="fx-todo-inner">
          <div className="fx-todo-loading">Loading your to-do list…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-todo-page">
        <style>{pageCss}</style>
        <div className="fx-todo-inner">
          <div className="fx-todo-empty">
            <div className="fx-todo-empty-icon">⚠</div>
            <h2 className="fx-todo-empty-title">Could not load your list</h2>
            <p className="fx-todo-empty-sub">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fx-todo-page">
      <style>{pageCss}</style>

      <div className="fx-todo-inner">
        {/* Header */}
        <div className="fx-todo-header">
          <div>
            <div className="fx-todo-eyebrow">Dashboard · To Do</div>
            <h1 className="fx-todo-title">Your to-do list</h1>
            <p className="fx-todo-sub">
              Everything assigned to you, sorted by what's most urgent.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="fx-todo-btn"
              onClick={() => navigate('/dashboard/calendar')}
            >
              📅 Calendar view
            </button>
            <button
              type="button"
              className="fx-todo-btn primary"
              onClick={() => navigate('/dashboard')}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="fx-todo-stats">
          <div className="fx-todo-stat">
            <div className="fx-todo-stat-label">Overdue</div>
            <div className="fx-todo-stat-value overdue">
              {buckets.overdue.length}
            </div>
          </div>
          <div className="fx-todo-stat">
            <div className="fx-todo-stat-label">Due today</div>
            <div className="fx-todo-stat-value today">
              {buckets.today.length}
            </div>
          </div>
          <div className="fx-todo-stat">
            <div className="fx-todo-stat-label">This week</div>
            <div className="fx-todo-stat-value week">
              {buckets.week.length}
            </div>
          </div>
          <div className="fx-todo-stat">
            <div className="fx-todo-stat-label">Completed</div>
            <div className="fx-todo-stat-value done">
              {buckets.completed.length}
            </div>
          </div>
        </div>

        {/* Filters with sliding indicator */}
<div className="fx-todo-filters" role="tablist">
  {/* The sliding orange pill. Its position depends on the active filter. */}
  <div
    className="fx-todo-indicator"
    style={{
      transform:
        filter === 'open'
          ? 'translateX(0)'
          : filter === 'completed'
            ? 'translateX(calc(100% + 6px))'
            : 'translateX(calc(200% + 12px))',
    }}
    aria-hidden="true"
  />

  <button
    type="button"
    role="tab"
    aria-selected={filter === 'open'}
    className={`fx-todo-filter${filter === 'open' ? ' active' : ''}`}
    onClick={() => setFilter('open')}
  >
    Open ({openCount})
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={filter === 'completed'}
    className={`fx-todo-filter${filter === 'completed' ? ' active' : ''}`}
    onClick={() => setFilter('completed')}
  >
    Completed ({completedCount})
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={filter === 'all'}
    className={`fx-todo-filter${filter === 'all' ? ' active' : ''}`}
    onClick={() => setFilter('all')}
  >
    All ({items.length})
  </button>
</div>

        {/* Empty overall */}
        {totalVisible === 0 ? (
          <div className="fx-todo-empty">
            <div className="fx-todo-empty-icon" aria-hidden="true">
              {filter === 'completed' ? '📭' : '✨'}
            </div>
            <h2 className="fx-todo-empty-title">
              {filter === 'completed'
                ? 'No completed assignments yet'
                : filter === 'open'
                  ? 'You\'re all caught up!'
                  : 'Nothing to do right now'}
            </h2>
            <p className="fx-todo-empty-sub">
              {filter === 'completed'
                ? 'Anything you finish will show up here.'
                : 'When instructors assign work, it will appear here with due dates.'}
            </p>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {visibleBuckets.overdue.length > 0 && (
              <Bucket
                kind="overdue"
                title="Overdue"
                items={visibleBuckets.overdue}
                onNavigate={navigateToAssignment}
                onToggleComplete={setPendingComplete}
                onUnmark={handleUnmarkComplete}
              />
            )}

            {/* Due today */}
            {visibleBuckets.today.length > 0 && (
              <Bucket
                kind="today"
                title="Due today"
                items={visibleBuckets.today}
                onNavigate={navigateToAssignment}
                onToggleComplete={setPendingComplete}
                onUnmark={handleUnmarkComplete}
              />
            )}

            {/* Due this week */}
            {visibleBuckets.week.length > 0 && (
              <Bucket
                kind="week"
                title="Due this week"
                items={visibleBuckets.week}
                onNavigate={navigateToAssignment}
                onToggleComplete={setPendingComplete}
                onUnmark={handleUnmarkComplete}
              />
            )}

            {/* Upcoming */}
            {visibleBuckets.upcoming.length > 0 && (
              <Bucket
                kind="upcoming"
                title="Upcoming"
                items={visibleBuckets.upcoming}
                onNavigate={navigateToAssignment}
                onToggleComplete={setPendingComplete}
                onUnmark={handleUnmarkComplete}
              />
            )}

            {/* Completed */}
            {visibleBuckets.completed.length > 0 && (
              <Bucket
                kind="completed"
                title="Completed"
                items={visibleBuckets.completed}
                onNavigate={navigateToAssignment}
                onToggleComplete={setPendingComplete}
                onUnmark={handleUnmarkComplete}
              />
            )}
          </>
        )}
      </div>

      {/* Confirm mark-complete dialog */}
      {pendingComplete && (
        <div
          className="fx-todo-dialog-backdrop"
          onClick={() => !marking && setPendingComplete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fx-todo-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="fx-todo-dialog-title">
              Mark as complete?
            </h3>
            <p className="fx-todo-dialog-text">
              "{pendingComplete.assignment.title}" will be marked as
              completed. You can undo this later.
            </p>
            <div className="fx-todo-dialog-actions">
              <button
                type="button"
                className="fx-todo-btn"
                onClick={() => setPendingComplete(null)}
                disabled={marking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fx-todo-btn primary"
                onClick={handleMarkComplete}
                disabled={marking}
              >
                {marking ? 'Marking…' : 'Mark complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bucket sub-component
// ---------------------------------------------------------------------------

interface BucketProps {
  kind: 'overdue' | 'today' | 'week' | 'upcoming' | 'completed';
  title: string;
  items: AssignmentWithProgress[];
  onNavigate: (item: AssignmentWithProgress) => void;
  onToggleComplete: (item: AssignmentWithProgress) => void;
  onUnmark: (item: AssignmentWithProgress) => void;
}

const Bucket: React.FC<BucketProps> = ({
  kind,
  title,
  items,
  onNavigate,
  onToggleComplete,
  onUnmark,
}) => {
  return (
    <div className="fx-todo-section">
      <div className="fx-todo-section-head">
        <span className={`fx-todo-section-dot ${kind}`} aria-hidden="true" />
        <h2 className="fx-todo-section-title">{title}</h2>
        <span className="fx-todo-section-count">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="fx-todo-list">
        {items.map((item) => {
          const a = item.assignment;
          const isCompleted =
            item.status === 'completed' || item.status === 'late';

          // Due label class
          const dueClass = isCompleted
            ? 'done'
            : item.status === 'overdue'
              ? 'overdue'
              : kind === 'today'
                ? 'today'
                : item.status === 'due-soon'
                  ? 'soon'
                  : '';

          const rowClass = [
            'fx-todo-row',
            item.status === 'overdue' ? 'overdue' : '',
            isCompleted ? 'completed' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={a.id} className={rowClass}>
              <span
                className={`fx-todo-row-priority ${a.priority}`}
                aria-hidden="true"
              />

              <button
                type="button"
                className={`fx-todo-check${isCompleted ? ' checked' : ''}`}
                onClick={() =>
                  isCompleted ? onUnmark(item) : onToggleComplete(item)
                }
                aria-label={
                  isCompleted
                    ? `Mark "${a.title}" as not complete`
                    : `Mark "${a.title}" as complete`
                }
              >
                ✓
              </button>

              <div
                className="fx-todo-body"
                onClick={() => onNavigate(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(item);
                  }
                }}
              >
                <span className={`fx-todo-kind ${a.type}`}>
                  {kindLabel(a.type)}
                </span>
                <h3 className="fx-todo-title">{a.title}</h3>
                {a.description && (
                  <p className="fx-todo-desc">{a.description}</p>
                )}

                <div className="fx-todo-meta">
                  <span className={`fx-todo-due ${dueClass}`}>
                    {formatDue(a.dueAt)}
                  </span>
                  <span className="fx-todo-meta-item">
                    <span aria-hidden="true">📚</span>
                    {a.courseSlug.replace(/-/g, ' ')}
                  </span>
                  <span className="fx-todo-meta-item">
                    <span aria-hidden="true">👤</span>
                    {a.assignedByName}
                  </span>
                </div>
              </div>

              <span className="fx-todo-arrow" aria-hidden="true">
                →
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};