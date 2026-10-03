// ============================================================================
// src/components/courses/LessonSidebar.tsx
//
// The left navigation for the course learning area. Shows modules as
// collapsible sections, lessons with status indicators (completed /
// in-progress / not started), and highlights the current lesson.
//
// Reads nothing from a context — takes everything as props and reports
// navigation via onSelectLesson.
// ============================================================================

import React, { useState } from 'react';
import type {
  ContentModule,
  Lesson,
  LessonProgress,
} from '../../types/course.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const sidebarCss = `
.fx-lesson-nav {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.fx-lesson-nav-header {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fx-lesson-nav-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #d95300;
  letter-spacing: 0;
  text-transform: none;
}

/* Module */
.fx-lesson-module {
  margin-bottom: 8px;
}
.fx-lesson-module:last-child {
  margin-bottom: 0;
}

.fx-lesson-module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 10px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}
.fx-lesson-module-head:hover {
  background: #f8fafc;
}

.fx-lesson-module-info {
  flex: 1;
  min-width: 0;
}
.fx-lesson-module-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px;
  line-height: 1.3;
}
.fx-lesson-module-progress {
  font-size: 0.7rem;
  color: #94a3b8;
}
.fx-lesson-module-caret {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}
.fx-lesson-module.open .fx-lesson-module-caret {
  transform: rotate(90deg);
}

/* Lessons */
.fx-lesson-list {
  list-style: none;
  margin: 0 0 8px 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

.fx-lesson-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px 9px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background-color 0.15s ease;
}
.fx-lesson-item:hover {
  background: #f8fafc;
}
.fx-lesson-item.current {
  background: #fff7ed;
}
.fx-lesson-item.current .fx-lesson-item-title {
  color: #d95300;
  font-weight: 700;
}

.fx-lesson-status {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.fx-lesson-status.completed {
  background: #16a34a;
  border-color: #16a34a;
}
.fx-lesson-status.in-progress {
  border-color: #d95300;
  background: #fff7ed;
  color: #d95300;
}

.fx-lesson-item-info {
  flex: 1;
  min-width: 0;
}
.fx-lesson-item-title {
  font-size: 0.82rem;
  font-weight: 500;
  color: #334155;
  margin: 0;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.fx-lesson-item-meta {
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fx-lesson-type-icon {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Empty state */
.fx-lesson-nav-empty {
  font-size: 0.82rem;
  color: #94a3b8;
  text-align: center;
  padding: 12px;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function lessonTypeIcon(lesson: Lesson): string {
  switch (lesson.type) {
    case 'text':
      return '📄';
    case 'video':
      return '🎥';
    case 'quiz':
      return '✓';
  }
}

function lessonTypeLabel(lesson: Lesson): string {
  switch (lesson.type) {
    case 'text':
      return 'Reading';
    case 'video':
      return 'Video';
    case 'quiz':
      return 'Quiz';
  }
}

function findProgress(
  progressMap: Record<string, LessonProgress>,
  lessonId: string,
): LessonProgress | undefined {
  return progressMap[lessonId];
}

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface LessonSidebarProps {
  modules: ContentModule[];
  /** All lesson progress for this user + course, keyed by lessonId. */
  progressMap: Record<string, LessonProgress>;
  /** The lessonId currently being viewed. */
  currentLessonId: string;
  /** Called when the user clicks a lesson. */
  onSelectLesson: (lessonId: string) => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  modules,
  progressMap,
  currentLessonId,
  onSelectLesson,
}) => {
  // ---------------------------------------------------------------------------
  // Track which modules are open. Default: the module containing the current
  // lesson is open, others are closed. Only initialised on first render so
  // the user's manual open/close isn't overridden.
  //
  // We use a "compare during render" approach so this stays in sync if
  // the current lesson changes from outside (e.g. deep link).
  // ---------------------------------------------------------------------------
  const findModuleForLesson = (lessonId: string): string | null => {
    for (const m of modules) {
      if (m.lessons.some((l) => l.id === lessonId)) return m.id;
    }
    return null;
  };

  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const moduleId = findModuleForLesson(currentLessonId);
    if (moduleId) initial.add(moduleId);
    // Also open the first module by default
    if (modules.length > 0) initial.add(modules[0].id);
    return initial;
  });

  // If the current lesson moves to a different module, make sure that
  // module is open. Compare during render to avoid an effect.
  const [prevLessonId, setPrevLessonId] = useState(currentLessonId);
  if (currentLessonId !== prevLessonId) {
    setPrevLessonId(currentLessonId);
    const moduleId = findModuleForLesson(currentLessonId);
    if (moduleId && !openModules.has(moduleId)) {
      setOpenModules((prev) => {
        const next = new Set(prev);
        next.add(moduleId);
        return next;
      });
    }
  }

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // Count total lessons and completed lessons across all modules
  const totalLessons = modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const completedLessons = Object.values(progressMap).filter(
    (p) => p.status === 'completed',
  ).length;

  // Suppress unused-variable warnings for helpers we might use later
  void findProgress;

  return (
    <>
      <style>{sidebarCss}</style>

      <div className="fx-lesson-nav">
        <h3 className="fx-lesson-nav-header">
          <span>Course content</span>
          <span className="fx-lesson-nav-count">
            {completedLessons} / {totalLessons}
          </span>
        </h3>

        {modules.length === 0 ? (
          <div className="fx-lesson-nav-empty">No lessons yet.</div>
        ) : (
          modules.map((module) => {
            const isOpen = openModules.has(module.id);
            const moduleProgress = module.lessons.filter(
              (l) => progressMap[l.id]?.status === 'completed',
            ).length;

            return (
              <div
                key={module.id}
                className={`fx-lesson-module${isOpen ? ' open' : ''}`}
              >
                <button
                  type="button"
                  className="fx-lesson-module-head"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isOpen}
                >
                  <div className="fx-lesson-module-info">
                    <div className="fx-lesson-module-title">
                      {module.title}
                    </div>
                    <div className="fx-lesson-module-progress">
                      {moduleProgress} / {module.lessons.length} complete
                    </div>
                  </div>
                  <span
                    className="fx-lesson-module-caret"
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </button>

                {isOpen && (
                  <ul className="fx-lesson-list">
                    {module.lessons.map((lesson) => {
                      const progress = progressMap[lesson.id];
                      const isCompleted = progress?.status === 'completed';
                      const isInProgress = progress?.status === 'in-progress';
                      const isCurrent = lesson.id === currentLessonId;

                      const statusClass = isCompleted
                        ? 'completed'
                        : isInProgress
                          ? 'in-progress'
                          : '';

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={`fx-lesson-item${isCurrent ? ' current' : ''}`}
                            onClick={() => onSelectLesson(lesson.id)}
                            aria-current={isCurrent ? 'true' : undefined}
                          >
                            <span
                              className={`fx-lesson-status ${statusClass}`}
                              aria-hidden="true"
                            >
                              {isCompleted && '✓'}
                              {isInProgress && '•'}
                            </span>
                            <div className="fx-lesson-item-info">
                              <p className="fx-lesson-item-title">
                                {lesson.title}
                              </p>
                              <p className="fx-lesson-item-meta">
                                <span
                                  className="fx-lesson-type-icon"
                                  aria-hidden="true"
                                >
                                  {lessonTypeIcon(lesson)}
                                </span>
                                <span>{lessonTypeLabel(lesson)}</span>
                                {lesson.estimatedMinutes && (
                                  <>
                                    <span>·</span>
                                    <span>{lesson.estimatedMinutes} min</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};