// ============================================================================
// src/components/exam/ProctorBar.tsx
//
// The integrity status bar for the exam room. Shows at-a-glance:
//
//   - Remaining time (via the Timer component)
//   - Fullscreen status (on/off)
//   - Webcam status (live / disconnected / not required)
//   - Tab-switch count vs. allowed maximum
//   - Question progress
//
// Colour-codes the whole bar based on integrity state:
//   green → all good
//   amber → some warnings, still allowed
//   red   → integrity compromised (exceeded max tab switches)
//
// 🔌 AWS: In production, the "webcam status" would be driven by a real
//         WebRTC stream to a proctoring vendor (ProctorU, Proctorio, etc.)
//         or to your own media server. For now, it reflects the browser's
//         getUserMedia status. See WebcamPreview.tsx for the actual stream.
// ============================================================================

import React from 'react';

import { useExam } from '../../context/examHooks';
import { Timer } from './Timer';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const barCss = `
.fx-proctor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: #ffffff;
  font-family: sans-serif;
  flex-wrap: wrap;
  transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
}

/* Overall state colors */
.fx-proctor.ok {
  border-color: #e2e8f0;
  background: #ffffff;
}
.fx-proctor.warn {
  border-color: #fcd34d;
  background: #fffbeb;
  box-shadow: 0 0 0 3px rgba(252, 211, 77, 0.15);
}
.fx-proctor.danger {
  border-color: #fca5a5;
  background: #fef2f2;
  box-shadow: 0 0 0 3px rgba(252, 165, 165, 0.20);
  animation: fxProctorPulse 1.6s ease-in-out infinite;
}
@keyframes fxProctorPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(252, 165, 165, 0.20); }
  50%      { box-shadow: 0 0 0 6px rgba(252, 165, 165, 0.05); }
}

/* Left group: status indicators */
.fx-proctor-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.fx-proctor-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.fx-proctor-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.fx-proctor-dot.green { background: #16a34a; }
.fx-proctor-dot.amber { background: #f59e0b; }
.fx-proctor-dot.red   { background: #dc2626; }
.fx-proctor-dot.grey  { background: #cbd5e1; }

/* Pulsing green dot for "live" webcam */
.fx-proctor-dot.live::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.4;
  animation: fxProctorDotPulse 1.6s ease-in-out infinite;
}
@keyframes fxProctorDotPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50%      { transform: scale(1.6); opacity: 0; }
}

.fx-proctor-label {
  color: #94a3b8;
  font-weight: 500;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-right: 2px;
}

/* Right group: timer + exit */
.fx-proctor-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fx-proctor-exit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #64748b;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.fx-proctor-exit:hover {
  border-color: #dc2626;
  color: #dc2626;
}

@media (max-width: 640px) {
  .fx-proctor {
    padding: 10px 14px;
    gap: 10px;
  }
  .fx-proctor-group {
    gap: 12px;
  }
  .fx-proctor-item {
    font-size: 0.75rem;
  }
  .fx-proctor-label {
    display: none; /* Drop the label on mobile to save space */
  }
}

@media (prefers-reduced-motion: reduce) {
  .fx-proctor.danger { animation: none; }
  .fx-proctor-dot.live::after { animation: none; }
}
`;

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface ProctorBarProps {
  /**
   * Whether the webcam is currently streaming. In production this comes
   * from the WebcamPreview component via a callback.
   */
  webcamLive?: boolean;

  /**
   * Whether fullscreen is currently active. In production this comes from
   * a fullscreenchange listener in ExamRoom.
   */
  fullscreenActive?: boolean;

  /**
   * Called when the user clicks the exit button.
   */
  onExit?: () => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ProctorBar: React.FC<ProctorBarProps> = ({
  webcamLive = true,
  fullscreenActive = true,
  onExit,
}) => {
  const {
    tabSwitchCount,
    maxTabSwitches,
    integrityCompromised,
    currentIndex,
    questions,
  } = useExam();

  // ---------------------------------------------------------------------------
  // Compute overall state
  // ---------------------------------------------------------------------------
  const tabSwitchesLeft = Math.max(0, maxTabSwitches - tabSwitchCount);

  const overallState: 'ok' | 'warn' | 'danger' = integrityCompromised
    ? 'danger'
    : tabSwitchesLeft <= 1 || !webcamLive || !fullscreenActive
      ? 'warn'
      : 'ok';

  // ---------------------------------------------------------------------------
  // Webcam state
  // ---------------------------------------------------------------------------
  const webcamDot = webcamLive ? 'live' : 'red';
  const webcamLabel = webcamLive ? 'Webcam live' : 'Webcam off';

  // ---------------------------------------------------------------------------
  // Fullscreen state
  // ---------------------------------------------------------------------------
  const fullscreenDot = fullscreenActive ? 'green' : 'amber';
  const fullscreenLabel = fullscreenActive ? 'Fullscreen' : 'Not fullscreen';

  // ---------------------------------------------------------------------------
  // Tab switches state
  // ---------------------------------------------------------------------------
  const tabDot: 'green' | 'amber' | 'red' =
    integrityCompromised ? 'red'
    : tabSwitchesLeft <= 1 ? 'amber'
    : 'green';

  const tabLabel = integrityCompromised
    ? 'Integrity compromised'
    : `${tabSwitchCount} / ${maxTabSwitches} tab switches`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <style>{barCss}</style>

      <div
        className={`fx-proctor ${overallState}`}
        role="status"
        aria-live="polite"
      >
        {/* ---- Left: status indicators ---- */}
        <div className="fx-proctor-group">
          {/* Timer (reuses the shared component) */}
          <Timer />

          {/* Webcam */}
          <div className="fx-proctor-item">
            <span className={`fx-proctor-dot ${webcamDot}`} aria-hidden="true" />
            <span className="fx-proctor-label">Cam</span>
            <span>{webcamLabel}</span>
          </div>

          {/* Fullscreen */}
          <div className="fx-proctor-item">
            <span className={`fx-proctor-dot ${fullscreenDot}`} aria-hidden="true" />
            <span className="fx-proctor-label">Screen</span>
            <span>{fullscreenLabel}</span>
          </div>

          {/* Tab switches */}
          <div className="fx-proctor-item">
            <span className={`fx-proctor-dot ${tabDot}`} aria-hidden="true" />
            <span className="fx-proctor-label">Tabs</span>
            <span>{tabLabel}</span>
          </div>
        </div>

        {/* ---- Right: progress + exit ---- */}
        <div className="fx-proctor-right">
          {questions.length > 0 && (
            <div className="fx-proctor-item">
              <span className="fx-proctor-label">Q</span>
              <span>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          )}

          {onExit && (
            <button
              type="button"
              className="fx-proctor-exit"
              onClick={onExit}
              aria-label="Exit exam"
            >
              ✕ Exit
            </button>
          )}
        </div>
      </div>
    </>
  );
};