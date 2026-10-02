// ============================================================================
// src/components/exam/Timer.tsx
//
// Displays the server-synced countdown for the active exam attempt.
//
// Reads secondsRemaining from ExamContext. That value is updated by the
// provider's 1-second interval and is derived from the server deadline —
// this component is a pure display.
//
// Visual states:
//   - Normal   (green/neutral)  > 5 minutes remaining
//   - Warning  (amber)          ≤ 5 minutes remaining
//   - Critical (red + pulse)    ≤ 1 minute remaining
//   - Expired  (grey)           time is up
//
// The pulse animation on critical helps attract attention without being
// obnoxious. Disabled when prefers-reduced-motion is set.
//
// 🔌 AWS: No backend interaction — this reads state from ExamContext.
// ============================================================================

import React from 'react';

import { useExam } from '../../context/examHooks.ts';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Format seconds into a human countdown.
 * Under an hour: MM:SS
 * Over an hour:  HH:MM:SS
 */
function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const timerCss = `
.fx-timer {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 10px;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  border: 1px solid transparent;
  user-select: none;
}

.fx-timer-icon {
  font-size: 1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Normal — neutral, understated */
.fx-timer.normal {
  background: #f1f5f9;
  color: #334155;
  border-color: #e2e8f0;
}

/* Warning — amber, 5 min or less */
.fx-timer.warning {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

/* Critical — red + pulse, 1 min or less */
.fx-timer.critical {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
  animation: fxTimerPulse 1.4s ease-in-out infinite;
}

@keyframes fxTimerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.25); }
  50%      { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
}

/* Expired — grey, muted */
.fx-timer.expired {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
}

/* No-time-limit variant */
.fx-timer.untimed {
  background: #f1f5f9;
  color: #64748b;
  border-color: #e2e8f0;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0;
}

/* Large variant for the exam room header */
.fx-timer.lg {
  font-size: 1.3rem;
  padding: 10px 18px;
}

@media (prefers-reduced-motion: reduce) {
  .fx-timer.critical {
    animation: none;
  }
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface TimerProps {
  /** Optional: 'md' (default) or 'lg'. */
  size?: 'md' | 'lg';
}

export const Timer: React.FC<TimerProps> = ({ size = 'md' }) => {
  const { secondsRemaining, deadlineAt, isTimeUp, view } = useExam();

  // No time limit → show a friendly label instead of a countdown.
  // deadlineAt is set even for untimed exams (we set a 24h fallback), so
  // we need a different signal. Best approach: check the exam rules. But
  // since the provider doesn't expose timeLimitMinutes directly, we use
  // a sensible proxy: if deadlineAt is more than 12 hours away AND we
  // never got isTimeUp, treat it as untimed. For now: just show the timer.
  //
  // A more thorough fix is to expose `timeLimitMinutes` from ExamContext.
  // We'll add that when we build the exam room and know what to display.
  if (!deadlineAt) {
    return (
      <>
        <style>{timerCss}</style>
        <div className={`fx-timer untimed ${size === 'lg' ? 'lg' : ''}`}>
          <span className="fx-timer-icon">∞</span>
          No time limit
        </div>
      </>
    );
  }

  // Determine visual state
  const state: 'normal' | 'warning' | 'critical' | 'expired' = isTimeUp
    ? 'expired'
    : secondsRemaining <= 60
      ? 'critical'
      : secondsRemaining <= 300
        ? 'warning'
        : 'normal';

  // Icon per state
  const icon =
    state === 'expired' ? '⏱'
    : state === 'critical' ? '⚠'
    : state === 'warning' ? '⏱'
    : '⏱';

  // Accessible label for screen readers
  const ariaLabel =
    state === 'expired'
      ? 'Time is up'
      : `Time remaining: ${formatTime(secondsRemaining)}`;

  // Don't show a countdown on the submitted view
  if (view === 'submitted') {
    return (
      <>
        <style>{timerCss}</style>
        <div className={`fx-timer expired ${size === 'lg' ? 'lg' : ''}`}>
          <span className="fx-timer-icon">✓</span>
          Submitted
        </div>
      </>
    );
  }

  return (
    <>
      <style>{timerCss}</style>
      <div
        className={`fx-timer ${state} ${size === 'lg' ? 'lg' : ''}`}
        role="timer"
        aria-label={ariaLabel}
        aria-live="polite"
      >
        <span className="fx-timer-icon" aria-hidden="true">
          {icon}
        </span>
        <span>{formatTime(secondsRemaining)}</span>
      </div>
    </>
  );
};