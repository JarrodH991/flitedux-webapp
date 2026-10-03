// ============================================================================
// src/components/courses/LessonContent.tsx
//
// Renders the current lesson in the learning area. Handles three lesson
// types:
//
//   text  — renders ContentBlock[] (headings, paragraphs, lists, callouts…)
//   video — embeds the video + shows transcript/notes below
//   quiz  — interactive questions with instant feedback
//
// Called by CourseLearning.tsx. Takes the lesson, the user's progress for
// it, and callbacks for completing.
// ============================================================================

import React, { useMemo, useState } from 'react';

import type {
  Lesson,
  ContentBlock,
  LessonProgress,
  QuizQuestion,
} from '../../types/course.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const contentCss = `
/* ---------- Wrapper ---------- */
.fx-lesson {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 32px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
@media (max-width: 640px) {
  .fx-lesson { padding: 24px 20px; }
}

.fx-lesson-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}
.fx-lesson-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 8px;
}
.fx-lesson-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.25;
}
.fx-lesson-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ---------- Text content blocks ---------- */
.fx-cb-heading-2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin: 32px 0 14px;
  line-height: 1.3;
}
.fx-cb-heading-2:first-child { margin-top: 0; }

.fx-cb-heading-3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 26px 0 10px;
  line-height: 1.35;
}

.fx-cb-paragraph {
  font-size: 1rem;
  line-height: 1.75;
  color: #334155;
  margin: 0 0 16px;
}

.fx-cb-list {
  margin: 0 0 18px;
  padding-left: 24px;
  font-size: 1rem;
  line-height: 1.8;
  color: #334155;
}
.fx-cb-list li {
  margin-bottom: 6px;
}

.fx-cb-callout {
  display: flex;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  margin: 20px 0;
  font-size: 0.95rem;
  line-height: 1.6;
}
.fx-cb-callout.info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.fx-cb-callout.warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
}
.fx-cb-callout.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.fx-cb-callout-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  line-height: 1.4;
}
.fx-cb-callout-body { flex: 1; }
.fx-cb-callout-title {
  font-weight: 700;
  margin: 0 0 4px;
}
.fx-cb-callout-text {
  margin: 0;
  opacity: 0.9;
}

.fx-cb-image {
  margin: 24px 0;
  text-align: center;
}
.fx-cb-image img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.fx-cb-image-caption {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 10px 0 0;
  font-style: italic;
}

.fx-cb-quote {
  border-left: 4px solid #d95300;
  padding: 8px 20px;
  margin: 24px 0;
  font-size: 1.05rem;
  font-style: italic;
  color: #475569;
  line-height: 1.6;
}
.fx-cb-quote-attribution {
  display: block;
  font-style: normal;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 8px;
}

.fx-cb-code {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px 18px;
  border-radius: 10px;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  margin: 20px 0;
}

.fx-cb-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 32px 0;
}

/* ---------- Video ---------- */
.fx-video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.fx-video-wrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}
.fx-video-transcript {
  margin-top: 24px;
  padding: 18px 20px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 0 10px 10px 0;
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.7;
}
.fx-video-transcript-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 8px;
}
.fx-video-transcript-text {
  margin: 0;
  font-style: italic;
}

/* ---------- Quiz ---------- */
.fx-quiz-intro {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
  padding: 14px 18px;
  background: #f8fafc;
  border-radius: 10px;
}

.fx-quiz-q {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.fx-quiz-q:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.fx-quiz-q-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.fx-quiz-q-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff7ed;
  color: #d95300;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}
.fx-quiz-q-text {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
  margin: 0;
  padding-top: 3px;
}

.fx-quiz-options {
  display: grid;
  gap: 10px;
}

.fx-quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
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
  transition: all 0.15s ease;
}
.fx-quiz-option:hover:not(:disabled) {
  border-color: #fdba74;
  background: #fffbf7;
}
.fx-quiz-option.selected {
  border-color: #d95300;
  background: #fff7ed;
}
.fx-quiz-option.correct {
  border-color: #16a34a;
  background: #f0fdf4;
}
.fx-quiz-option.incorrect {
  border-color: #dc2626;
  background: #fef2f2;
}
.fx-quiz-option:disabled {
  cursor: default;
  opacity: 0.85;
}

.fx-quiz-option-marker {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.15s ease;
}
.fx-quiz-option.selected .fx-quiz-option-marker {
  background: #d95300;
  color: #ffffff;
}
.fx-quiz-option.correct .fx-quiz-option-marker {
  background: #16a34a;
  color: #ffffff;
}
.fx-quiz-option.incorrect .fx-quiz-option-marker {
  background: #dc2626;
  color: #ffffff;
}

.fx-quiz-explanation {
  margin: 12px 0 0 36px;
  padding: 12px 14px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 0 8px 8px 0;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.6;
}
.fx-quiz-explanation strong {
  color: #1e293b;
}

/* Quiz result */
.fx-quiz-result {
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: center;
}
.fx-quiz-result.pass {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.fx-quiz-result.fail {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.fx-quiz-result-score {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 6px;
}
.fx-quiz-result-label {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}
.fx-quiz-result-sub {
  font-size: 0.82rem;
  opacity: 0.85;
  margin: 6px 0 0;
}

/* Quiz footer (submit / retry) */
.fx-quiz-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.fx-quiz-btn {
  padding: 12px 22px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.fx-quiz-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-quiz-btn.primary:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
}
.fx-quiz-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-quiz-btn.secondary:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-quiz-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// ---------------------------------------------------------------------------
// TEXT BLOCK RENDERERS
// ---------------------------------------------------------------------------

/**
 * Render one ContentBlock.
 */
const Block: React.FC<{ block: ContentBlock }> = ({ block }) => {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2 className="fx-cb-heading-2">{block.text}</h2>
      ) : (
        <h3 className="fx-cb-heading-3">{block.text}</h3>
      );

    case 'paragraph':
      return <p className="fx-cb-paragraph">{block.text}</p>;

    case 'list':
      return block.ordered ? (
        <ol className="fx-cb-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="fx-cb-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'callout': {
      const icon =
        block.variant === 'info' ? 'ℹ'
        : block.variant === 'warning' ? '⚠'
        : '✓';
      return (
        <div className={`fx-cb-callout ${block.variant}`}>
          <span className="fx-cb-callout-icon" aria-hidden="true">
            {icon}
          </span>
          <div className="fx-cb-callout-body">
            {block.title && (
              <p className="fx-cb-callout-title">{block.title}</p>
            )}
            <p className="fx-cb-callout-text">{block.text}</p>
          </div>
        </div>
      );
    }

    case 'image':
      return (
        <div className="fx-cb-image">
          <img src={block.src} alt={block.alt} loading="lazy" />
          {block.caption && (
            <p className="fx-cb-image-caption">{block.caption}</p>
          )}
        </div>
      );

    case 'quote':
      return (
        <blockquote className="fx-cb-quote">
          {block.text}
          {block.attribution && (
            <span className="fx-cb-quote-attribution">
              — {block.attribution}
            </span>
          )}
        </blockquote>
      );

    case 'code':
      return <pre className="fx-cb-code">{block.code}</pre>;

    case 'divider':
      return <hr className="fx-cb-divider" />;
  }
};

/**
 * Render a list of content blocks.
 */
const ContentBlocks: React.FC<{ blocks: ContentBlock[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, i) => (
      <Block key={i} block={block} />
    ))}
  </>
);

// ---------------------------------------------------------------------------
// VIDEO LESSON RENDERER
// ---------------------------------------------------------------------------

/**
 * Normalise a video URL. Accepts:
 *   - A full YouTube embed URL      (https://www.youtube.com/embed/ABC)
 *   - A full YouTube watch URL      (https://www.youtube.com/watch?v=ABC)
 *   - Just a YouTube video ID       (ABC123)
 *   - A Vimeo URL                   (https://vimeo.com/123456789)
 *   - An MP4 URL
 *
 * Returns { embedUrl, provider }.
 */
function normaliseVideoUrl(url: string): {
  embedUrl: string;
  provider: 'youtube' | 'vimeo' | 'mp4';
} {
  // YouTube embed URL
  if (url.includes('youtube.com/embed/')) {
    return { embedUrl: url, provider: 'youtube' };
  }

  // YouTube watch URL
  const ytMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      provider: 'youtube',
    };
  }

  // YouTube short URL
  const ytShortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (ytShortMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytShortMatch[1]}`,
      provider: 'youtube',
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      provider: 'vimeo',
    };
  }

  // MP4 or unknown — treat as mp4
  return { embedUrl: url, provider: 'mp4' };
}

const VideoLessonView: React.FC<{
  lesson: Extract<Lesson, { type: 'video' }>;
}> = ({ lesson }) => {
  const { embedUrl, provider } = normaliseVideoUrl(lesson.videoUrl);

  return (
    <div>
      <div className="fx-video-wrap">
        {provider === 'mp4' ? (
          <video controls style={{ width: '100%', height: '100%' }}>
            <source src={embedUrl} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      {lesson.transcript && (
        <div className="fx-video-transcript">
          <p className="fx-video-transcript-label">Transcript</p>
          <p className="fx-video-transcript-text">{lesson.transcript}</p>
        </div>
      )}

      {lesson.notes && lesson.notes.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <ContentBlocks blocks={lesson.notes} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// QUIZ LESSON RENDERER
// ---------------------------------------------------------------------------

/**
 * Grade a set of answers against a set of questions.
 * Returns correct / total and percentage.
 */
function gradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, string>,
): { correct: number; total: number; percent: number } {
  let correct = 0;
  for (const q of questions) {
    const selected = answers[q.id];
    const correctOption = q.options.find((o) => o.isCorrect);
    if (selected && correctOption && selected === correctOption.id) {
      correct += 1;
    }
  }
  const total = questions.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percent };
}

const QuizLessonView: React.FC<{
  lesson: Extract<Lesson, { type: 'quiz' }>;
  /** Optional pre-existing score (from a previous attempt). */
  previousScore?: number;
  /** Called when the user submits the quiz. */
  onComplete: (score: number) => void;
}> = ({ lesson, previousScore, onComplete }) => {
  const passMark = lesson.passMarkPercent ?? 70;
  const allowRetry = lesson.allowRetry ?? true;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // If we've already attempted this quiz (score is stored), show the
  // previous result immediately and let the user retry if allowed.
  const showPreviousResult =
    !submitted && previousScore !== undefined && previousScore > 0;

  const allAnswered = lesson.questions.every((q) => answers[q.id]);
  const result = useMemo(
    () => (submitted ? gradeQuiz(lesson.questions, answers) : null),
    [submitted, lesson.questions, answers],
  );

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    const r = gradeQuiz(lesson.questions, answers);
    setSubmitted(true);
    onComplete(r.percent);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // Pre-existing attempt
  if (showPreviousResult) {
    const passed = previousScore >= passMark;
    return (
      <div>
        <p className="fx-quiz-intro">
          You've already completed this quiz. You scored{' '}
          <strong>{previousScore}%</strong>. {passed
            ? 'Well done — you passed.'
            : `The pass mark is ${passMark}%.`}
        </p>

        <div
          className={`fx-quiz-result ${passed ? 'pass' : 'fail'}`}
        >
          <div className="fx-quiz-result-score">{previousScore}%</div>
          <p className="fx-quiz-result-label">
            {passed ? 'Passed' : 'Not passed'}
          </p>
        </div>

        {allowRetry && (
          <div className="fx-quiz-footer">
            <button
              type="button"
              className="fx-quiz-btn secondary"
              onClick={handleRetry}
            >
              Retake quiz
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="fx-quiz-intro">
        This quiz has {lesson.questions.length}{' '}
        {lesson.questions.length === 1 ? 'question' : 'questions'}. Pass mark
        is {passMark}%. Answer every question, then submit for instant
        feedback.
      </p>

      {lesson.questions.map((q, qIndex) => {
        const selected = answers[q.id];
        const correctOption = q.options.find((o) => o.isCorrect);

        return (
          <div key={q.id} className="fx-quiz-q">
            <div className="fx-quiz-q-head">
              <span className="fx-quiz-q-num">{qIndex + 1}</span>
              <p className="fx-quiz-q-text">{q.question}</p>
            </div>

            <div className="fx-quiz-options">
              {q.options.map((option) => {
                const isSelected = selected === option.id;
                const isCorrectOption = option.id === correctOption?.id;
                const isWrongSelection =
                  submitted && isSelected && !isCorrectOption;

                let stateClass = '';
                if (submitted) {
                  if (isCorrectOption) stateClass = 'correct';
                  else if (isWrongSelection) stateClass = 'incorrect';
                } else if (isSelected) {
                  stateClass = 'selected';
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`fx-quiz-option ${stateClass}`}
                    onClick={() => handleSelect(q.id, option.id)}
                    disabled={submitted}
                  >
                    <span className="fx-quiz-option-marker">
                      {submitted
                        ? isCorrectOption
                          ? '✓'
                          : isWrongSelection
                            ? '✗'
                            : option.id.toUpperCase()
                        : option.id.toUpperCase()}
                    </span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <div className="fx-quiz-explanation">
                <strong>
                  {selected === correctOption?.id
                    ? 'Correct. '
                    : 'Incorrect. '}
                </strong>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Result banner */}
      {submitted && result && (
        <div
          className={`fx-quiz-result ${result.percent >= passMark ? 'pass' : 'fail'}`}
        >
          <div className="fx-quiz-result-score">{result.percent}%</div>
          <p className="fx-quiz-result-label">
            {result.percent >= passMark
              ? 'You passed this quiz'
              : 'Not passed yet'}
          </p>
          <p className="fx-quiz-result-sub">
            {result.correct} of {result.total} correct
          </p>
        </div>
      )}

      {/* Footer buttons */}
      <div className="fx-quiz-footer">
        {!submitted ? (
          <button
            type="button"
            className="fx-quiz-btn primary"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit quiz
          </button>
        ) : (
          allowRetry && (
            <button
              type="button"
              className="fx-quiz-btn secondary"
              onClick={handleRetry}
            >
              Retake quiz
            </button>
          )
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

interface LessonContentProps {
  lesson: Lesson;
  /** Module title for the eyebrow, e.g. "Module 1 · Introduction". */
  moduleTitle?: string;
  /** The user's existing progress on this lesson (if any). */
  progress?: LessonProgress;
  /** Called when the user completes the lesson (via quiz or mark-complete). */
  onComplete: (score?: number) => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  moduleTitle,
  progress,
  onComplete,
}) => {
  return (
    <>
      <style>{contentCss}</style>

      <div className="fx-lesson">
        {/* Header */}
        <div className="fx-lesson-header">
          {moduleTitle && (
            <div className="fx-lesson-eyebrow">{moduleTitle}</div>
          )}
          <h1 className="fx-lesson-title">{lesson.title}</h1>
          {lesson.description && (
            <p className="fx-lesson-subtitle">{lesson.description}</p>
          )}
        </div>

        {/* Body — switch on lesson type */}
        {lesson.type === 'text' && (
          <div>
            <ContentBlocks blocks={lesson.content} />
          </div>
        )}

        {lesson.type === 'video' && (
          <VideoLessonView lesson={lesson} />
        )}

        {lesson.type === 'quiz' && (
          <QuizLessonView
            lesson={lesson}
            previousScore={progress?.score}
            onComplete={(score) => onComplete(score)}
          />
        )}

        {/* Bottom action bar for text/video lessons */}
        {lesson.type !== 'quiz' && (
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="fx-quiz-btn primary"
              onClick={() => onComplete(progress?.score)}
            >
              {progress?.status === 'completed'
                ? 'Mark as reviewed'
                : 'Mark complete →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};