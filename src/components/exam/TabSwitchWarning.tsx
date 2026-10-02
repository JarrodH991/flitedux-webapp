// ============================================================================
// src/components/exam/TabSwitchWarning.tsx
//
// Modal shown when the candidate switches away from the exam tab. Explains
// what happened, warns them about remaining allowances, and provides a
// button to return (which re-requests fullscreen and dismisses the modal).
//
// Severity levels:
//   'warning'   → they still have switches left. Amber styling.
//   'final'     → this was their last allowed switch. Red styling.
//   'exceeded'  → they've gone over the limit. Red + strong wording.
//
// The exam room mounts this component conditionally:
//   {showTabWarning && (
//     <TabSwitchWarning
//       count={tabSwitchCount}
//       max={maxTabSwitches}
//       onDismiss={handleReturnToExam}
//     />
//   )}
//
// 🔌 AWS: No backend interaction. The tab switch event itself is logged by
//         the ExamRoom via logProctorEvent. This component is a pure UI.
// ============================================================================

import React, { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const modalCss = `
.fx-tab-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: fxTabFadeIn 0.2s ease-out both;
}

@keyframes fxTabFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fx-tab-modal {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px 28px 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
  font-family: sans-serif;
  animation: fxTabModalIn 0.3s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  position: relative;
}

@keyframes fxTabModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Top banner strip by severity */
.fx-tab-modal.warning {
  border-top: 4px solid #f59e0b;
}
.fx-tab-modal.final,
.fx-tab-modal.exceeded {
  border-top: 4px solid #dc2626;
}

/* Icon circle */
.fx-tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 28px;
  margin-bottom: 18px;
}
.fx-tab-icon.warning {
  background: #fef3c7;
  color: #92400e;
}
.fx-tab-icon.final,
.fx-tab-icon.exceeded {
  background: #fee2e2;
  color: #991b1b;
}

/* Icon shake animation on mount */
.fx-tab-icon.warning,
.fx-tab-icon.final,
.fx-tab-icon.exceeded {
  animation: fxTabIconShake 0.5s ease-in-out both;
}
@keyframes fxTabIconShake {
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-8deg); }
  40%      { transform: rotate(8deg); }
  60%      { transform: rotate(-6deg); }
  80%      { transform: rotate(6deg); }
}

.fx-tab-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.25;
}

.fx-tab-message {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 20px;
}

/* Counter display */
.fx-tab-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 24px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
}
.fx-tab-counter.warning {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #92400e;
}
.fx-tab-counter.final,
.fx-tab-counter.exceeded {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.fx-tab-counter strong {
  font-size: 1.05rem;
}

/* Bullet list of consequences */
.fx-tab-consequences {
  text-align: left;
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.6;
}
.fx-tab-consequences li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 6px;
}
.fx-tab-consequences li::before {
  content: '•';
  position: absolute;
  left: 6px;
  color: #d95300;
  font-weight: 700;
}

/* Buttons */
.fx-tab-return {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 14px 20px;
  background: #d95300;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.fx-tab-return:hover,
.fx-tab-return:focus-visible {
  background: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
  outline: none;
}
.fx-tab-return:active {
  transform: translateY(0) scale(0.99);
}

/* Timer note at bottom */
.fx-tab-note {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 16px 0 0;
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  .fx-tab-modal-backdrop,
  .fx-tab-modal,
  .fx-tab-icon {
    animation: none;
  }
}
`;

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type Severity = 'warning' | 'final' | 'exceeded';

interface TabSwitchWarningProps {
  /** Number of tab switches that have occurred, INCLUDING this one. */
  count: number;

  /** Maximum allowed per the exam rules. */
  max: number;

  /** Called when the user clicks "Return to exam". */
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const TabSwitchWarning: React.FC<TabSwitchWarningProps> = ({
  count,
  max,
  onDismiss,
}) => {
  // Determine severity
  const severity: Severity =
    count > max ? 'exceeded'
    : count === max ? 'final'
    : 'warning';

  const remaining = Math.max(0, max - count);

  // Ref for autofocus so keyboard users land on the button
  const returnButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    returnButtonRef.current?.focus();
  }, []);

  // Also trap Escape to dismiss (behaves like "return")
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  // ----- Copy per severity -----
  const icon = severity === 'warning' ? '⚠' : '🚫';

  const title =
    severity === 'warning' ? 'You left the exam'
    : severity === 'final' ? 'Final warning'
    : 'Integrity violation';

  const message =
    severity === 'warning'
      ? `You switched away from the exam window. This activity has been logged and may be reviewed. Please stay on the exam tab to keep your attempt valid.`
    : severity === 'final'
      ? `You have used your last allowed tab switch. Any further switches will invalidate your attempt and may require you to restart.`
    : `You have exceeded the maximum number of tab switches. Your attempt is being flagged for review.`;

  const counterText =
    severity === 'exceeded'
      ? `Exceeded by ${count - max}`
      : remaining === 0
        ? `Last switch`
        : `${remaining} ${remaining === 1 ? 'switch' : 'switches'} remaining`;

  return (
    <>
      <style>{modalCss}</style>

      <div
        className="fx-tab-modal-backdrop"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fx-tab-title"
        aria-describedby="fx-tab-message"
      >
        <div className={`fx-tab-modal ${severity}`}>
          <div className={`fx-tab-icon ${severity}`} aria-hidden="true">
            {icon}
          </div>

          <h2 id="fx-tab-title" className="fx-tab-title">
            {title}
          </h2>

          <p id="fx-tab-message" className="fx-tab-message">
            {message}
          </p>

          <div className={`fx-tab-counter ${severity}`}>
            <span>Tab switches:</span>
            <strong>{count} / {max}</strong>
            <span>·</span>
            <span>{counterText}</span>
          </div>

          <ul className="fx-tab-consequences">
            <li>Every switch is logged with a timestamp for review.</li>
            <li>The exam timer kept running while you were away.</li>
            <li>Fullscreen will be re-enabled when you return.</li>
          </ul>

          <button
            ref={returnButtonRef}
            type="button"
            className="fx-tab-return"
            onClick={onDismiss}
          >
            Return to exam
          </button>

          <p className="fx-tab-note">
            Your answers have been saved automatically. Nothing has been lost.
          </p>
        </div>
      </div>
    </>
  );
};