// ============================================================================
// src/components/dashboard/MiniCalendar.tsx
//
// Compact month calendar for the dashboard. Shows the current month,
// highlights days that have events, and lets the user click a day to see
// that day's items in a small list below.
//
// Props:
//   events — normalised CalendarEvents to display
//   onEventClick — optional; called when an event is clicked
//   onOpenFullCalendar — optional; called when "View full calendar" clicked
// ============================================================================

import React, { useMemo, useState } from 'react';

import type { CalendarEvent } from '../../types/assignment.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const calCss = `
.fx-minical {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.fx-minical-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.fx-minical-month {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.fx-minical-nav {
  display: flex;
  gap: 4px;
}
.fx-minical-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.15s ease;
  font-family: inherit;
}
.fx-minical-nav-btn:hover {
  border-color: #d95300;
  color: #d95300;
}

/* Day-of-week header */
.fx-minical-dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}
.fx-minical-dow {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 4px 0;
}

/* Grid */
.fx-minical-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.fx-minical-cell {
  position: relative;
  aspect-ratio: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
  padding: 0;
}
.fx-minical-cell:hover {
  background: #f8fafc;
  color: #d95300;
}
.fx-minical-cell.outside {
  color: #cbd5e1;
  font-weight: 500;
  cursor: default;
}
.fx-minical-cell.outside:hover {
  background: transparent;
  color: #cbd5e1;
}
.fx-minical-cell.today {
  background: #fff7ed;
  color: #d95300;
  font-weight: 800;
  box-shadow: inset 0 0 0 1.5px #fed7aa;
}
.fx-minical-cell.selected {
  background: #d95300;
  color: #ffffff;
  box-shadow: none;
}
.fx-minical-cell.selected:hover {
  color: #ffffff;
}

/* Event dots */
.fx-minical-dots {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  pointer-events: none;
}
.fx-minical-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #94a3b8;
}
.fx-minical-dot.high   { background: #dc2626; }
.fx-minical-dot.normal { background: #d95300; }
.fx-minical-dot.low    { background: #94a3b8; }
.fx-minical-dot.completed { background: #16a34a; }
.fx-minical-cell.selected .fx-minical-dot,
.fx-minical-cell.selected .fx-minical-dot.high,
.fx-minical-cell.selected .fx-minical-dot.normal,
.fx-minical-cell.selected .fx-minical-dot.low,
.fx-minical-cell.selected .fx-minical-dot.completed {
  background: #ffffff;
  opacity: 0.9;
}

/* Events list under the grid */
.fx-minical-events {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}
.fx-minical-events-head {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 8px;
}
.fx-minical-events-empty {
  font-size: 0.82rem;
  color: #94a3b8;
  text-align: center;
  padding: 8px 0;
}

.fx-minical-event {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.12s ease;
}
.fx-minical-event:hover {
  background: #f8fafc;
}

.fx-minical-event-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d95300;
  margin-top: 6px;
}
.fx-minical-event-dot.high { background: #dc2626; }
.fx-minical-event-dot.low  { background: #94a3b8; }
.fx-minical-event-dot.completed { background: #16a34a; }

.fx-minical-event-info {
  flex: 1;
  min-width: 0;
}
.fx-minical-event-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.fx-minical-event-title.completed {
  color: #94a3b8;
  text-decoration: line-through;
}
.fx-minical-event-meta {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}

/* Footer */
.fx-minical-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}
.fx-minical-footer-btn {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #d95300;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
}
.fx-minical-footer-btn:hover {
  background: #fff7ed;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

/**
 * Build a 42-cell (6-week) grid starting on the Sunday on or before the
 * first of the given month. Returns Date objects for each cell.
 */
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

/**
 * Group events by their local YYYY-MM-DD key.
 */
function groupEventsByDay(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) map[key] = [];
    map[key].push(e);
  }
  return map;
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

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface MiniCalendarProps {
  events: CalendarEvent[];
  /** Called when the user clicks an event in the day list. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Called when the user clicks "Open full calendar". */
  onOpenFullCalendar?: () => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  events,
  onEventClick,
  onOpenFullCalendar,
}) => {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  // Group events by day for fast lookup
  const eventsByDay = useMemo(
    () => groupEventsByDay(events),
    [events],
  );

  // 42-cell grid for the current view month
  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

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

  const selectedKey = dayKey(selectedDay);
  const selectedEvents = eventsByDay[selectedKey] ?? [];

  // Sort selected events by time
  const sortedSelectedEvents = useMemo(
    () =>
      [...selectedEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [selectedEvents],
  );

  const selectedDayLabel = selectedDay.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <style>{calCss}</style>

      <div className="fx-minical">
        {/* Header */}
        <div className="fx-minical-head">
          <h3 className="fx-minical-month">{monthLabel}</h3>
          <div className="fx-minical-nav">
            <button
              type="button"
              className="fx-minical-nav-btn"
              onClick={goPrev}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              className="fx-minical-nav-btn"
              onClick={goNext}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Day-of-week labels */}
        <div className="fx-minical-dow-row">
          {DOW_LABELS.map((d, i) => (
            <div key={`${d}-${i}`} className="fx-minical-dow">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="fx-minical-grid">
          {grid.map((day, i) => {
            const key = dayKey(day);
            const isToday = key === dayKey(today);
            const isSelected = key === selectedKey;
            const isOutside = day.getMonth() !== viewMonth;
            const dayEvents = eventsByDay[key] ?? [];

            // Show up to 3 dots; if more, we'd just cap at 3
            const dotsToShow = dayEvents.slice(0, 3);

            const cls = [
              'fx-minical-cell',
              isOutside ? 'outside' : '',
              isToday ? 'today' : '',
              isSelected ? 'selected' : '',
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
                {day.getDate()}
                {dotsToShow.length > 0 && (
                  <span className="fx-minical-dots" aria-hidden="true">
                    {dotsToShow.map((e, di) => {
                      const dotClass = e.completed
                        ? 'completed'
                        : e.priority;
                      return (
                        <span
                          key={di}
                          className={`fx-minical-dot ${dotClass}`}
                        />
                      );
                    })}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day events */}
        <div className="fx-minical-events">
          <p className="fx-minical-events-head">{selectedDayLabel}</p>

          {sortedSelectedEvents.length === 0 ? (
            <p className="fx-minical-events-empty">
              Nothing scheduled
            </p>
          ) : (
            <div>
              {sortedSelectedEvents.map((event) => {
                const dotClass = event.completed
                  ? 'completed'
                  : event.priority;

                const content = (
                  <>
                    <span
                      className={`fx-minical-event-dot ${dotClass}`}
                      aria-hidden="true"
                    />
                    <span className="fx-minical-event-info">
                      <span
                        className={`fx-minical-event-title${
                          event.completed ? ' completed' : ''
                        }`}
                      >
                        {event.title}
                      </span>
                      <span className="fx-minical-event-meta">
                        {formatTime(event.date)} · {event.courseSlug.replace(/-/g, ' ')}
                      </span>
                    </span>
                  </>
                );

                return onEventClick ? (
                  <button
                    key={event.id}
                    type="button"
                    className="fx-minical-event"
                    onClick={() => onEventClick(event)}
                  >
                    {content}
                  </button>
                ) : (
                  <a
                    key={event.id}
                    href={event.href}
                    className="fx-minical-event"
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {onOpenFullCalendar && (
          <div className="fx-minical-footer">
            <button
              type="button"
              className="fx-minical-footer-btn"
              onClick={onOpenFullCalendar}
            >
              Open full calendar →
            </button>
          </div>
        )}
      </div>
    </>
  );
};