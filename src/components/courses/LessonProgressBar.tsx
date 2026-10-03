// ============================================================================
// src/components/courses/LessonProgressBar.tsx
//
// Top bar for the course learning area. Shows:
//   - Back button (goes to course detail page)
//   - Course title
//   - A visual progress bar with percentage
//   - Lesson count ("3 of 9 lessons complete")
//   - Optional certificate badge when 100% complete
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const barCss = `
.fx-progressbar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.fx-progressbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.fx-progressbar-back {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.15s ease;
}
.fx-progressbar-back:hover {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #d95300;
}

.fx-progressbar-info {
  min-width: 0;
  flex: 1;
}
.fx-progressbar-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 2px;
}
.fx-progressbar-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fx-progressbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.fx-progressbar-track-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}
@media (max-width: 720px) {
  .fx-progressbar-track-wrap { min-width: 100%; }
}

.fx-progressbar-track {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  min-width: 120px;
}
.fx-progressbar-fill {
  height: 100%;
  background: linear-gradient(90deg, #d95300, #b54400);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.fx-progressbar-fill.complete {
  background: linear-gradient(90deg, #16a34a, #15803d);
}

.fx-progressbar-count {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.fx-progressbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  animation: fxProgressPulse 2s ease-in-out infinite;
}
@keyframes fxProgressPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .fx-progressbar-badge { animation: none; }
}
`;

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface LessonProgressBarProps {
  /** The course slug — used to build the back-to-course link. */
  courseSlug: string;
  /** The course title to display. */
  courseTitle: string;
  /** How many lessons are complete. */
  completed: number;
  /** Total lessons in the course. */
  total: number;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  courseSlug,
  courseTitle,
  completed,
  total,
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = percent === 100 && total > 0;

  return (
    <>
      <style>{barCss}</style>

      <div className="fx-progressbar">
        {/* Left — back button + title */}
        <div className="fx-progressbar-left">
          <Link
            to="/dashboard"
            className="fx-progressbar-back"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            ←
          </Link>
          <div className="fx-progressbar-info">
            <p className="fx-progressbar-label">Course</p>
            <p className="fx-progressbar-title" title={courseTitle}>
              {courseTitle}
            </p>
          </div>
        </div>

        {/* Right — progress + optional badge */}
        <div className="fx-progressbar-right">
          <div className="fx-progressbar-track-wrap">
            <div
              className="fx-progressbar-track"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
            >
              <div
                className={`fx-progressbar-fill${isComplete ? ' complete' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="fx-progressbar-count">
              {completed} / {total}
            </span>
          </div>

          {isComplete && (
            <span className="fx-progressbar-badge">
              <span aria-hidden="true">✓</span> Course complete
            </span>
          )}
        </div>
      </div>
    </>
  );
};