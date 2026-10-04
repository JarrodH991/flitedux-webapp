// ============================================================================
// src/components/exam/Navigator.tsx
//
// The question navigator — a grid of numbered buttons, one per question.
// Shows the visual state of each question at a glance:
//
//   answered    → orange filled
//   flagged     → amber ring (overrides other states)
//   current     → dark outline + slightly larger
//   unanswered  → grey outline
//
// Also provides filter modes: All / Flagged / Unanswered. Useful on the
// review screen before submitting.
//
// Reads everything from ExamContext — no props needed.
//
// 🔌 AWS: No backend interaction. Pure UI over context state.
// ============================================================================

import React, { useMemo, useState } from 'react';

import { useExam } from '../../context/examHooks';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const navCss = `
.fx-qnav {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.fx-qnav-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fx-qnav-progress {
  font-size: 0.72rem;
  font-weight: 600;
  color: #d95300;
  letter-spacing: 0;
  text-transform: none;
}

/* Filter tabs */
.fx-qnav-filters {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 14px;
}
.fx-qnav-filter {
  flex: 1;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}
.fx-qnav-filter:hover { color: #d95300; }
.fx-qnav-filter.active {
  background: #ffffff;
  color: #d95300;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* Grid of numbers */
.fx-qnav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 6px;
}

.fx-qnav-btn {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  position: relative;
  padding: 0;
}
.fx-qnav-btn:hover:not(:disabled) {
  border-color: #fdba74;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-qnav-btn:focus-visible {
  outline: 2px solid #d95300;
  outline-offset: 2px;
}

/* Answered — filled orange */
.fx-qnav-btn.answered {
  background: #d95300;
  border-color: #d95300;
  color: #ffffff;
}
.fx-qnav-btn.answered:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Current — thick dark ring */
.fx-qnav-btn.current {
  border-color: #0f172a;
  border-width: 2.5px;
  color: #0f172a;
  transform: scale(1.05);
}
.fx-qnav-btn.current.answered {
  color: #ffffff;
}

/* Flagged — small dot indicator (top-right) */
.fx-qnav-btn.flagged::after {
  content: '';
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 1.5px #ffffff;
}

.fx-qnav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Legend */
.fx-qnav-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.72rem;
  color: #64748b;
}
.fx-qnav-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fx-qnav-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}
.fx-qnav-legend-swatch.answered {
  background: #d95300;
  border-color: #d95300;
}
.fx-qnav-legend-swatch.current {
  border-color: #0f172a;
  border-width: 2.5px;
}
.fx-qnav-legend-swatch.flagged {
  position: relative;
}
.fx-qnav-legend-swatch.flagged::after {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 1.5px #ffffff;
}

.fx-qnav-empty {
  padding: 20px 8px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.82rem;
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

type FilterMode = 'all' | 'flagged' | 'unanswered';

export const Navigator: React.FC = () => {
  const {
    questions,
    attempt,
    currentIndex,
    goToQuestion,
    isLoading,
  } = useExam();

  const [filter, setFilter] = useState<FilterMode>('all');

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    if (!attempt) return { answered: 0, total: questions.length, flagged: 0 };
    let answered = 0;
    let flagged = 0;
    for (const q of questions) {
      const a = attempt.answers[q.id];
      if (a?.selectedOptionIds?.length) answered++;
      if (a?.flaggedForReview) flagged++;
    }
    return { answered, total: questions.length, flagged };
  }, [attempt, questions]);

  /**
   * Which question IDs match the active filter. Returns a Set for O(1) lookup.
   * 'all' returns a Set with everything.
   */
  const visibleSet = useMemo(() => {
    const set = new Set<string>();
    if (!attempt) return set;

    for (const q of questions) {
      const a = attempt.answers[q.id];

      if (filter === 'all') {
        set.add(q.id);
      } else if (filter === 'flagged') {
        if (a?.flaggedForReview) set.add(q.id);
      } else if (filter === 'unanswered') {
        if (!a?.selectedOptionIds?.length) set.add(q.id);
      }
    }
    return set;
  }, [attempt, questions, filter]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleJump = (index: number) => {
    goToQuestion(index);
  };

  // ---------------------------------------------------------------------------
  // Loading / empty
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <>
        <style>{navCss}</style>
        <div className="fx-qnav">
          <div className="fx-qnav-title">Questions</div>
          <div className="fx-qnav-empty">Loading…</div>
        </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <style>{navCss}</style>
        <div className="fx-qnav">
          <div className="fx-qnav-title">Questions</div>
          <div className="fx-qnav-empty">No questions loaded.</div>
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <>
      <style>{navCss}</style>

      <div className="fx-qnav">
        <div className="fx-qnav-title">
          <span>Questions</span>
          <span className="fx-qnav-progress">
            {stats.answered} / {stats.total} answered
          </span>
        </div>

        {/* Filter tabs */}
        <div className="fx-qnav-filters" role="tablist" aria-label="Question filter">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`fx-qnav-filter${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'flagged'}
            className={`fx-qnav-filter${filter === 'flagged' ? ' active' : ''}`}
            onClick={() => setFilter('flagged')}
          >
            Flagged {stats.flagged > 0 ? `(${stats.flagged})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unanswered'}
            className={`fx-qnav-filter${filter === 'unanswered' ? ' active' : ''}`}
            onClick={() => setFilter('unanswered')}
          >
            Unanswered
          </button>
        </div>

        {/* Grid */}
        {visibleSet.size === 0 ? (
          <div className="fx-qnav-empty">
            {filter === 'flagged' && 'No questions flagged yet.'}
            {filter === 'unanswered' && 'You have answered every question. Nice.'}
            {filter === 'all' && 'No questions.'}
          </div>
        ) : (
          <div className="fx-qnav-grid" role="list">
            {questions.map((q, index) => {
              // If this question isn't part of the current filter, skip it —
              // but keep the numbering stable by using the real index.
              if (!visibleSet.has(q.id)) return null;

              const answer = attempt?.answers[q.id];
              const isAnswered = Boolean(answer?.selectedOptionIds?.length);
              const isFlagged = Boolean(answer?.flaggedForReview);
              const isCurrent = index === currentIndex;

              const cls = [
                'fx-qnav-btn',
                isAnswered ? 'answered' : '',
                isFlagged ? 'flagged' : '',
                isCurrent ? 'current' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={q.id}
                  type="button"
                  role="listitem"
                  className={cls}
                  onClick={() => handleJump(index)}
                  aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}${isCurrent ? ', current' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="fx-qnav-legend">
          <div className="fx-qnav-legend-item">
            <span className="fx-qnav-legend-swatch answered" aria-hidden="true" />
            <span>Answered</span>
          </div>
          <div className="fx-qnav-legend-item">
            <span className="fx-qnav-legend-swatch current" aria-hidden="true" />
            <span>Current</span>
          </div>
          <div className="fx-qnav-legend-item">
            <span className="fx-qnav-legend-swatch flagged" aria-hidden="true" />
            <span>Flagged</span>
          </div>
        </div>
      </div>
    </>
  );
};