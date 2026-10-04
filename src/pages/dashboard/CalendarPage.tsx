// ============================================================================
// src/pages/dashboard/CalendarPage.tsx
//
// Full-page calendar view at /dashboard/calendar.
//
// Shows a month grid with events, a "This month" summary, and the selected
// day's events in a side panel. Clicking an event navigates to the relevant
// page (lesson, exam, etc.).
//
// 🔌 AWS: Reads from services/api.ts. Assignments live in DynamoDB,
//         aggregated by the getCalendarEvents() API function.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { CalendarEvent } from '../../types/assignment.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-cal-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
  /* Prevent horizontal overflow from the calendar grid on narrow screens */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.fx-cal-inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.fx-cal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-cal-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-cal-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.fx-cal-sub {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

/* Buttons */
.fx-cal-btn {
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
.fx-cal-btn:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-cal-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-cal-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Layout — two columns on desktop, stacked on mobile */
.fx-cal-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}
@media (min-width: 900px) {
  .fx-cal-layout {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

/* Month card */
.fx-cal-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

/* Month header */
.fx-cal-month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.fx-cal-month-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.fx-cal-month-nav {
  display: flex;
  gap: 6px;
  align-items: center;
}
.fx-cal-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.15s ease;
}
.fx-cal-nav-btn:hover {
  border-color: #d95300;
  color: #d95300;
}
.fx-cal-today-btn {
  padding: 0 12px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  transition: all 0.15s ease;
}
.fx-cal-today-btn:hover {
  border-color: #d95300;
  color: #d95300;
}

/* Day-of-week row */
.fx-cal-dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}
.fx-cal-dow {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 6px 0;
}

/* Month grid */
.fx-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
}

.fx-cal-cell {
  position: relative;
  min-height: 92px;
  min-width: 0;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
  overflow: hidden;
}

.fx-cal-cell:hover {
  border-color: #fed7aa;
  background: #fffbf7;
}
.fx-cal-cell.outside {
  background: #fafafa;
  color: #cbd5e1;
  cursor: default;
}
.fx-cal-cell.outside:hover {
  border-color: #f1f5f9;
  background: #fafafa;
}
.fx-cal-cell.today {
  border-color: #fed7aa;
  background: #fff7ed;
}
.fx-cal-cell.selected {
  border-color: #d95300;
  box-shadow: 0 0 0 2px rgba(217, 83, 0, 0.15);
}

.fx-cal-day-num {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
}
.fx-cal-cell.outside .fx-cal-day-num {
  color: #cbd5e1;
}
.fx-cal-cell.today .fx-cal-day-num {
  background: #d95300;
  color: #ffffff;
}

/* Mini event chips inside a cell */
.fx-cal-chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.fx-cal-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1e293b;
  background: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.fx-cal-chip::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}
.fx-cal-chip.high { background: #fef2f2; color: #991b1b; }
.fx-cal-chip.high::before { background: #dc2626; }
.fx-cal-chip.normal { background: #fff7ed; color: #9a3412; }
.fx-cal-chip.normal::before { background: #d95300; }
.fx-cal-chip.low { background: #f1f5f9; color: #475569; }
.fx-cal-chip.low::before { background: #94a3b8; }
.fx-cal-chip.completed {
  background: #f0fdf4;
  color: #166534;
  text-decoration: line-through;
  opacity: 0.85;
}
.fx-cal-chip.completed::before { background: #16a34a; }

.fx-cal-more {
  font-size: 0.65rem;
  font-weight: 700;
  color: #d95300;
  padding-left: 4px;
}

/* Side panel */
.fx-cal-side {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.fx-cal-side-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  min-width: 0;
}

.fx-cal-side-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.fx-cal-side-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.fx-cal-side-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.fx-cal-side-empty {
  font-size: 0.85rem;
  color: #94a3b8;
  text-align: center;
  padding: 12px 0;
}

.fx-cal-event-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: #ffffff;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: all 0.12s ease;
  box-sizing: border-box;
}
.fx-cal-event-row:hover {
  border-color: #fed7aa;
  background: #fffbf7;
  transform: translateY(-1px);
}

.fx-cal-event-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d95300;
  margin-top: 6px;
}
.fx-cal-event-dot.high { background: #dc2626; }
.fx-cal-event-dot.low  { background: #94a3b8; }
.fx-cal-event-dot.completed { background: #16a34a; }

.fx-cal-event-info {
  flex: 1;
  min-width: 0;
}
.fx-cal-event-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px;
  line-height: 1.3;
}
.fx-cal-event-title.completed {
  color: #94a3b8;
  text-decoration: line-through;
}
.fx-cal-event-meta {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.fx-cal-event-kind {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
}

/* Empty whole-page state */
.fx-cal-empty {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Loading */
.fx-cal-loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .fx-cal-cell {
    min-height: 60px;
    padding: 4px;
  }
  .fx-cal-chip {
    display: none;
  }
  .fx-cal-cell.has-events::after {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #d95300;
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
  }
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function kindLabel(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'assignment':
      return 'Assignment';
    case 'exam-deadline':
      return 'Exam';
    case 'course-access-expiry':
      return 'Access expiry';
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load calendar events
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await api.getCalendarEvents(user!.id);
      if (cancelled) return;

      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      setEvents(res.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Group events by day for fast lookup
  // ---------------------------------------------------------------------------
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const d = new Date(e.date);
      const key = dayKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedKey = dayKey(selectedDay);
  const selectedEvents = useMemo(
    () =>
      [...(eventsByDay[selectedKey] ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [eventsByDay, selectedKey],
  );

  // ---------------------------------------------------------------------------
  // This month summary
  // ---------------------------------------------------------------------------
  const thisMonthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });
  }, [events, viewYear, viewMonth]);

  // Snapshot the current time once at the top of the render, so memos that
// depend on "now" don't call Date.now() themselves (which React flags as
// an impure function).
const now = today.getTime();

const upcomingThisMonth = useMemo(
  () =>
    thisMonthEvents
      .filter((e) => !e.completed && new Date(e.date).getTime() >= now)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [thisMonthEvents],
);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const goPrev = () => {
    const m = viewMonth - 1;
    if (m < 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(m);
    }
  };

  const goNext = () => {
    const m = viewMonth + 1;
    if (m > 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(m);
    }
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(now);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.href) {
      navigate(event.href);
    }
  };

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const selectedDayLabel = selectedDay.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-cal-page">
        <style>{pageCss}</style>
        <div className="fx-cal-inner">
          <div className="fx-cal-loading">Loading your calendar…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-cal-page">
        <style>{pageCss}</style>
        <div className="fx-cal-inner">
          <div className="fx-cal-empty">
            <p>⚠ {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fx-cal-page">
      <style>{pageCss}</style>

      <div className="fx-cal-inner">
        {/* Header */}
        <div className="fx-cal-header">
          <div>
            <div className="fx-cal-eyebrow">Dashboard · Calendar</div>
            <h1 className="fx-cal-title">Your calendar</h1>
            <p className="fx-cal-sub">
              Everything assigned to you and every deadline coming up.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="fx-cal-btn"
              onClick={() => navigate('/dashboard/todo')}
            >
              ☑ To Do list
            </button>
            <button
              type="button"
              className="fx-cal-btn primary"
              onClick={() => navigate('/dashboard')}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="fx-cal-layout">
          {/* ---- Main calendar ---- */}
          <div className="fx-cal-card">
            {/* Month header */}
            <div className="fx-cal-month-head">
              <h2 className="fx-cal-month-title">{monthLabel}</h2>
              <div className="fx-cal-month-nav">
                <button
                  type="button"
                  className="fx-cal-today-btn"
                  onClick={goToday}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="fx-cal-nav-btn"
                  onClick={goPrev}
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="fx-cal-nav-btn"
                  onClick={goNext}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Day-of-week labels */}
            <div className="fx-cal-dow-row">
              {DOW_LABELS.map((d) => (
                <div key={d} className="fx-cal-dow">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="fx-cal-grid">
              {grid.map((day, i) => {
                const key = dayKey(day);
                const isToday = key === dayKey(today);
                const isSelected = key === selectedKey;
                const isOutside = day.getMonth() !== viewMonth;
                const dayEvents = eventsByDay[key] ?? [];

                // Show up to 3 chips; if more, show "+N more"
                const chipsToShow = dayEvents.slice(0, 3);
                const extra = dayEvents.length - chipsToShow.length;

                const cls = [
                  'fx-cal-cell',
                  isOutside ? 'outside' : '',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : '',
                  dayEvents.length > 0 ? 'has-events' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => !isOutside && setSelectedDay(day)}
                    disabled={isOutside}
                  >
                    <span className="fx-cal-day-num">{day.getDate()}</span>
                    {!isOutside && chipsToShow.length > 0 && (
                      <div className="fx-cal-chips">
                        {chipsToShow.map((e) => {
                          const chipClass = e.completed
                            ? 'completed'
                            : e.priority;
                          return (
                            <div
                              key={e.id}
                              className={`fx-cal-chip ${chipClass}`}
                              title={e.title}
                            >
                              {e.title}
                            </div>
                          );
                        })}
                        {extra > 0 && (
                          <div className="fx-cal-more">+{extra} more</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- Side panel ---- */}
          <aside className="fx-cal-side">
            {/* Selected day */}
            <div className="fx-cal-side-card">
              <div className="fx-cal-side-head">
                <h3 className="fx-cal-side-title">{selectedDayLabel}</h3>
                {selectedEvents.length > 0 && (
                  <span className="fx-cal-side-count">
                    {selectedEvents.length}{' '}
                    {selectedEvents.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {selectedEvents.length === 0 ? (
                <p className="fx-cal-side-empty">
                  Nothing scheduled for this day.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {selectedEvents.map((event) => {
                    const dotClass = event.completed
                      ? 'completed'
                      : event.priority;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="fx-cal-event-row"
                        onClick={() => handleEventClick(event)}
                      >
                        <span
                          className={`fx-cal-event-dot ${dotClass}`}
                          aria-hidden="true"
                        />
                        <span className="fx-cal-event-info">
                          <span
                            className={`fx-cal-event-title${
                              event.completed ? ' completed' : ''
                            }`}
                          >
                            {event.title}
                          </span>
                          <span className="fx-cal-event-meta">
                            <span className="fx-cal-event-kind">
                              {kindLabel(event.kind)}
                            </span>
                            <span>{formatTime(event.date)}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming this month */}
            <div className="fx-cal-side-card">
              <div className="fx-cal-side-head">
                <h3 className="fx-cal-side-title">Upcoming this month</h3>
                {upcomingThisMonth.length > 0 && (
                  <span className="fx-cal-side-count">
                    {upcomingThisMonth.length}
                  </span>
                )}
              </div>

              {upcomingThisMonth.length === 0 ? (
                <p className="fx-cal-side-empty">
                  Nothing coming up this month.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {upcomingThisMonth.slice(0, 6).map((event) => {
                    const dotClass = event.priority;
                    const d = new Date(event.date);

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="fx-cal-event-row"
                        onClick={() => handleEventClick(event)}
                      >
                        <span
                          className={`fx-cal-event-dot ${dotClass}`}
                          aria-hidden="true"
                        />
                        <span className="fx-cal-event-info">
                          <span className="fx-cal-event-title">
                            {event.title}
                          </span>
                          <span className="fx-cal-event-meta">
                            <span>
                              {d.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span>·</span>
                            <span>{formatTime(event.date)}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {upcomingThisMonth.length > 6 && (
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: '#d95300',
                        fontWeight: 700,
                        textAlign: 'center',
                        margin: '6px 0 0',
                      }}
                    >
                      +{upcomingThisMonth.length - 6} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};