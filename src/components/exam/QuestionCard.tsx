// ============================================================================
// src/components/exam/QuestionCard.tsx
//
// Renders ONE question in the exam room. Handles all four question types:
//   - mcq          single-select radio behaviour
//   - multi-select multiple checkboxes
//   - scenario     long stem with a scenario block, otherwise like mcq
//   - true-false   special-cased two-option layout
//
// Reads nothing from context directly — it takes a question + answer as
// props and calls back to the parent for changes. That makes it testable
// in isolation and reusable.
//
// 🔌 AWS: No backend interaction. The exam room wires it to the context.
// ============================================================================

import React, { useState } from 'react';

import type {
  QuestionForCandidate,
  Answer,
} from '../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-q {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

@media (max-width: 640px) {
  .fx-q { padding: 20px; }
}

/* Top meta row — badges */
.fx-q-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.fx-q-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fx-q-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
}

.fx-q-badge.cat    { background: #fff7ed; color: #d95300; }
.fx-q-badge.type   { background: #f1f5f9; color: #475569; }
.fx-q-badge.easy   { background: #dcfce7; color: #166534; }
.fx-q-badge.medium { background: #fef3c7; color: #92400e; }
.fx-q-badge.hard   { background: #fee2e2; color: #991b1b; }

/* Flag button */
.fx-q-flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.fx-q-flag:hover {
  border-color: #d95300;
  color: #d95300;
}
.fx-q-flag.flagged {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #d95300;
}

/* Scenario block */
.fx-q-scenario {
  background: #f8fafc;
  border-left: 3px solid #d95300;
  border-radius: 0 8px 8px 0;
  padding: 14px 18px;
  margin-bottom: 18px;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.65;
  white-space: pre-wrap;
}
.fx-q-scenario-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}

/* Question stem */
.fx-q-stem {
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 600;
  line-height: 1.55;
  margin: 0 0 20px;
  white-space: pre-wrap;
}

/* Hint for multi-select */
.fx-q-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  padding: 5px 10px;
  border-radius: 6px;
  margin-bottom: 14px;
}

/* Options */
.fx-q-options {
  display: grid;
  gap: 10px;
}

.fx-q-option {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  color: #1e293b;
  text-align: left;
  line-height: 1.5;
  width: 100%;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.fx-q-option:hover:not(:disabled) {
  border-color: #fdba74;
  background: #fffbf7;
}

.fx-q-option:active:not(:disabled) {
  transform: scale(0.995);
}

.fx-q-option:focus-visible {
  outline: 2px solid #d95300;
  outline-offset: 2px;
}

.fx-q-option.selected {
  border-color: #d95300;
  background: #fff7ed;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.08);
}

.fx-q-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* The letter/checkbox */
.fx-q-marker {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.15s ease;
}

.fx-q-option.selected .fx-q-marker {
  background: #d95300;
  color: #ffffff;
}

/* Multi-select uses square markers */
.fx-q-option.multi .fx-q-marker {
  border-radius: 6px;
}

/* True-false layout is a bit wider spacing */
.fx-q-option.tf {
  font-weight: 600;
}

/* Save indicator */
.fx-q-save {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  min-height: 24px;
  transition: color 0.2s ease;
}
.fx-q-save.saving { color: #d95300; }
.fx-q-save.saved  { color: #16a34a; }
.fx-q-save-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.fx-q-save.saving .fx-q-save-dot {
  animation: fxQSavingPulse 1s ease-in-out infinite;
}
@keyframes fxQSavingPulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Render a friendly label for the question type.
 */
function typeLabel(t: QuestionForCandidate['type']): string {
  switch (t) {
    case 'mcq': return 'Multiple choice';
    case 'multi-select': return 'Multi-select';
    case 'scenario': return 'Scenario';
    case 'true-false': return 'True / false';
  }
}

/**
 * True if the question allows selecting multiple options.
 */
function isMultiSelect(t: QuestionForCandidate['type']): boolean {
  return t === 'multi-select';
}

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface QuestionCardProps {
  question: QuestionForCandidate;

  /** Existing answer, if any. */
  answer?: Answer;

  /** Called when the user selects/deselects options. */
  onChange: (selectedOptionIds: string[]) => void;

  /** Called when the user clicks the flag button. */
  onToggleFlag: () => void;

  /** Called on every selection — parent uses this to show the save state. */
  onSelectionChange?: () => void;

  /** 'idle' | 'saving' | 'saved' — driven by the parent. */
  saveState?: 'idle' | 'saving' | 'saved';

  /** Disable all interaction (e.g. time is up). */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  onChange,
  onToggleFlag,
  onSelectionChange,
  saveState = 'idle',
  disabled = false,
}) => {
  const flagged = answer?.flaggedForReview ?? false;
  const multi = isMultiSelect(question.type);

  // ---------------------------------------------------------------------------
  // Local mirror for optimistic UI.
  //
  // Why local state at all? When the user clicks an option, we want the
  // selection to reflect immediately — before the parent's round-trip
  // through ExamContext completes. So we keep a local copy that we update
  // synchronously on click, and we resync from props whenever the props
  // change (e.g. when the parent finishes saving and pushes down new
  // answer data, or when the user navigates to a different question).
  //
  // Why not useEffect? Because calling setState inside an effect that only
  // depends on a prop is the classic "you might not need an effect" mistake.
  // React 19's dev detector flags it, and it costs an extra render cycle
  // every time the prop changes. The recommended pattern (per the React
  // docs) is to reset state *during render* by comparing against a
  // previous-value tracker.
  //
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // ---------------------------------------------------------------------------
  const [localSelected, setLocalSelected] = useState<Set<string>>(
    () => new Set(answer?.selectedOptionIds ?? []),
  );
  const [prevAnswerKey, setPrevAnswerKey] = useState(
    () => (answer?.selectedOptionIds ?? []).join('|'),
  );
  const answerKey = (answer?.selectedOptionIds ?? []).join('|');
  if (answerKey !== prevAnswerKey) {
    setPrevAnswerKey(answerKey);
    setLocalSelected(new Set(answer?.selectedOptionIds ?? []));
  }

  const handleOptionClick = (optionId: string) => {
    if (disabled) return;

    let next: Set<string>;
    if (multi) {
      next = new Set(localSelected);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
    } else {
      // Single-select: clicking the already-selected option does nothing
      // (prevents accidental deselection).
      if (localSelected.has(optionId)) return;
      next = new Set([optionId]);
    }

    setLocalSelected(next);
    onSelectionChange?.();
    onChange(Array.from(next));
  };

  // Special-case the true/false layout — the marker shows ✓ / ✗ instead of
  // a letter. We rely on option ids being 'true' / 'false' (which they are
  // in devQuestions.ts).
  const markerFor = (optionId: string, index: number) => {
    if (question.type === 'true-false') {
      return optionId === 'true' ? '✓' : '✗';
    }
    // Otherwise, letter A, B, C, D...
    return String.fromCharCode(65 + index);
  };

  return (
    <>
      <style>{pageCss}</style>

      <div className="fx-q">
        {/* ---- Meta row ---- */}
        <div className="fx-q-meta">
          <div className="fx-q-badges">
            <span className="fx-q-badge type">{typeLabel(question.type)}</span>
            <span className={`fx-q-badge ${question.difficulty}`}>
            {question.difficulty}
            </span>
          </div>
          <button
            type="button"
            className={`fx-q-flag${flagged ? ' flagged' : ''}`}
            onClick={onToggleFlag}
            disabled={disabled}
            aria-pressed={flagged}
          >
            <span aria-hidden="true">{flagged ? '★' : '☆'}</span>
            {flagged ? 'Flagged' : 'Flag for review'}
          </button>
        </div>

        {/* ---- Scenario ---- */}
        {question.scenario && (
          <div className="fx-q-scenario">
            <span className="fx-q-scenario-label">Scenario</span>
            {question.scenario}
          </div>
        )}

        {/* ---- Stem ---- */}
        <h2 className="fx-q-stem">{question.stem}</h2>

        {/* ---- Multi-select hint ---- */}
        {multi && (
          <div className="fx-q-hint">
            <span aria-hidden="true">✓</span>
            Select all that apply
          </div>
        )}

        {/* ---- Options ---- */}
        <div
          className="fx-q-options"
          role={multi ? 'group' : 'radiogroup'}
          aria-label="Answer options"
        >
          {question.options.map((opt, i) => {
            const isSelected = localSelected.has(opt.id);
            const cls = [
              'fx-q-option',
              isSelected ? 'selected' : '',
              multi ? 'multi' : '',
              question.type === 'true-false' ? 'tf' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={opt.id}
                type="button"
                className={cls}
                onClick={() => handleOptionClick(opt.id)}
                disabled={disabled}
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={isSelected}
              >
                <span className="fx-q-marker" aria-hidden="true">
                  {markerFor(opt.id, i)}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* ---- Save indicator ---- */}
        <div className={`fx-q-save ${saveState}`}>
          <span className="fx-q-save-dot" aria-hidden="true" />
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Answer saved'}
          {saveState === 'idle' && (
            answer?.selectedOptionIds?.length
              ? 'Answer recorded'
              : 'Not answered yet'
          )}
        </div>
      </div>
    </>
  );
};