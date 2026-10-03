// ============================================================================
// src/pages/courses/CourseLearning.tsx
//
// The course learning area. Renders:
//   - A top progress bar (LessonProgressBar)
//   - A left sidebar with modules and lessons (LessonSidebar)
//   - The current lesson in the main area (LessonContent)
//
// Route: /courses/:slug/learn
//
// Access: only for users who own the course (active enrolment).
//         Non-owners are redirected to the course detail page.
//
// 🔌 AWS: Reads content from S3 / DynamoDB, progress from DynamoDB.
//         Ownership check enforced server-side too.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import { LessonProgressBar } from '../../components/courses/LessonProgressBar';
import { LessonSidebar } from '../../components/courses/LessonSidebar';
import { LessonContent } from '../../components/courses/LessonContent';

import type {
  Course,
  CourseContent,
  Lesson,
  LessonProgress,
} from '../../types/course.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-learn-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 90px 20px 60px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-learn-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.fx-learn-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
  margin-top: 20px;
}
@media (min-width: 960px) {
  .fx-learn-layout {
    grid-template-columns: 320px minmax(0, 1fr);
  }
}

.fx-learn-sidebar {
  width: 100%;
}
@media (min-width: 960px) {
  .fx-learn-sidebar {
    position: sticky;
    top: 90px;
  }
}

/* Mobile sidebar toggle */
.fx-learn-mobile-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 12px;
}
.fx-learn-mobile-toggle:hover {
  border-color: #d95300;
  color: #d95300;
}
@media (min-width: 960px) {
  .fx-learn-mobile-toggle { display: none; }
}

.fx-learn-mobile-caret {
  font-size: 0.75rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}
.fx-learn-mobile-toggle.open .fx-learn-mobile-caret {
  transform: rotate(180deg);
}

/* Content column */
.fx-learn-content {
  min-width: 0;
}

/* Bottom navigation (prev / next) */
.fx-learn-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.fx-learn-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-learn-nav-btn:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-learn-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.fx-learn-nav-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.2);
}
.fx-learn-nav-btn.primary:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Loading */
.fx-learn-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
  font-size: 0.95rem;
}
.fx-learn-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #d95300;
  border-radius: 50%;
  animation: fxLearnSpin 0.7s linear infinite;
}
@keyframes fxLearnSpin { to { transform: rotate(360deg); } }

/* Error / not-owned states */
.fx-learn-error {
  max-width: 500px;
  margin: 60px auto;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.fx-learn-error h2 {
  color: #0f172a;
  margin: 0 0 10px;
  font-size: 1.25rem;
}
.fx-learn-error p {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px;
}
.fx-learn-error-btn {
  display: inline-block;
  padding: 11px 22px;
  background: #d95300;
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
  border: none;
  cursor: pointer;
}
.fx-learn-error-btn.secondary {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  margin-left: 8px;
}

/* "Course complete" celebration card */
.fx-learn-complete {
  margin-top: 20px;
  padding: 32px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  text-align: center;
}
.fx-learn-complete-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.fx-learn-complete-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #166534;
  margin: 0 0 6px;
}
.fx-learn-complete-sub {
  font-size: 0.95rem;
  color: #15803d;
  line-height: 1.55;
  margin: 0 0 20px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}
.fx-learn-complete-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.fx-learn-complete-btn {
  padding: 12px 22px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.fx-learn-complete-btn.primary {
  background: #16a34a;
  color: #ffffff;
  border-color: #16a34a;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.25);
}
.fx-learn-complete-btn.primary:hover {
  background: #15803d;
  border-color: #15803d;
  transform: translateY(-1px);
}
.fx-learn-complete-btn.secondary {
  background: #ffffff;
  color: #166534;
  border-color: #86efac;
}
.fx-learn-complete-btn.secondary:hover {
  border-color: #16a34a;
  transform: translateY(-1px);
}

/* Course with no content yet */
.fx-learn-nocontent {
  padding: 60px 24px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
}
.fx-learn-nocontent-icon {
  font-size: 2.5rem;
  opacity: 0.4;
  margin-bottom: 12px;
}
.fx-learn-nocontent-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}
.fx-learn-nocontent-sub {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Flatten all lessons from all modules into a single ordered array.
 * Used for prev/next navigation and for finding the "resume" lesson.
 */
function flattenLessons(content: CourseContent): Array<{
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  lesson: Lesson;
}> {
  const flat: Array<{
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
    lesson: Lesson;
  }> = [];

  const sortedModules = [...content.modules].sort(
    (a, b) => a.order - b.order,
  );

  for (const mod of sortedModules) {
    for (const lesson of mod.lessons) {
      flat.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
        lesson,
      });
    }
  }

  return flat;
}

/**
 * Build a lookup from lessonId → LessonProgress.
 */
function buildProgressMap(
  progress: LessonProgress[],
): Record<string, LessonProgress> {
  const map: Record<string, LessonProgress> = {};
  for (const p of progress) {
    map[p.lessonId] = p;
  }
  return map;
}

/**
 * Find the first lesson that isn't completed. If all are complete,
 * return the last lesson.
 */
function findResumeLesson(
  flat: ReturnType<typeof flattenLessons>,
  progressMap: Record<string, LessonProgress>,
): string | null {
  if (flat.length === 0) return null;
  for (const item of flat) {
    if (progressMap[item.lesson.id]?.status !== 'completed') {
      return item.lesson.id;
    }
  }
  // All complete — resume at the last lesson
  return flat[flat.length - 1].lesson.id;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export const CourseLearning: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---- Loaded data ----
  const [course, setCourse] = useState<Course | null>(null);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [progressMap, setProgressMap] = useState<
    Record<string, LessonProgress>
  >({});

  // ---- Access state ----
  const [accessDenied, setAccessDenied] = useState<'none' | 'not-owned' | 'expired' | null>(null);

  // ---- Loading / error ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Mobile sidebar drawer ----
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Load course, content, and progress on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!slug || !user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAccessDenied(null);

      // 1. Load the course from the catalogue
      const courseRes = await api.getCourseBySlug(slug!);
      if (cancelled) return;
      if (!courseRes.ok || !courseRes.data) {
        setError('Course not found.');
        setLoading(false);
        return;
      }
      setCourse(courseRes.data);

      // 2. Check ownership
      const enrolmentRes = await api.getUserEnrolmentForCourse(
        user!.id,
        slug!,
      );
      if (cancelled) return;
      if (!enrolmentRes.ok) {
        setError('Could not verify your access.');
        setLoading(false);
        return;
      }
      const enrolment = enrolmentRes.data;
      if (!enrolment) {
        setAccessDenied('not-owned');
        setLoading(false);
        return;
      }
      if (enrolment.status === 'expired') {
        setAccessDenied('expired');
        setLoading(false);
        return;
      }
      if (enrolment.status === 'refunded') {
        setAccessDenied('not-owned');
        setLoading(false);
        return;
      }

      // 3. Load the learning content
      const contentRes = await api.getCourseContent(slug!);
      if (cancelled) return;
      if (!contentRes.ok) {
        setError('Could not load course content.');
        setLoading(false);
        return;
      }
      if (!contentRes.data) {
        // No content for this course yet
        setContent(null);
        setLoading(false);
        return;
      }
      setContent(contentRes.data);

      // 4. Load the user's progress
      const progressRes = await api.getUserCourseProgress(user!.id, slug!);
      if (cancelled) return;
      if (progressRes.ok) {
        setProgressMap(buildProgressMap(progressRes.data));
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  // -------------------------------------------------------------------------
  // Flat lesson list (ordered)
  // -------------------------------------------------------------------------
  const flatLessons = useMemo(
    () => (content ? flattenLessons(content) : []),
    [content],
  );

  const totalLessons = flatLessons.length;
  const completedLessons = useMemo(
    () =>
      Object.values(progressMap).filter((p) => p.status === 'completed')
        .length,
    [progressMap],
  );
  const courseComplete =
    totalLessons > 0 && completedLessons === totalLessons;

  // -------------------------------------------------------------------------
  // Current lesson — from URL `?lesson=xxx` or fall back to resume logic
  // -------------------------------------------------------------------------
  const lessonFromUrl = searchParams.get('lesson');
  const currentLessonId = useMemo(() => {
    if (lessonFromUrl && flatLessons.some((f) => f.lesson.id === lessonFromUrl)) {
      return lessonFromUrl;
    }
    return findResumeLesson(flatLessons, progressMap);
  }, [lessonFromUrl, flatLessons, progressMap]);

  const currentIndex = useMemo(
    () =>
      flatLessons.findIndex((f) => f.lesson.id === currentLessonId),
    [flatLessons, currentLessonId],
  );

  const currentEntry =
    currentIndex >= 0 ? flatLessons[currentIndex] : null;

  // -------------------------------------------------------------------------
  // Set `?lesson=` in URL when the current lesson changes and it's not
  // already there. This makes deep-linking work.
  //
  // Note: we compare during render, not in an effect — avoids cascading
  // render warnings.
  // -------------------------------------------------------------------------
  const [prevLessonForUrl, setPrevLessonForUrl] = useState<string | null>(
    null,
  );
  if (
    currentLessonId &&
    currentLessonId !== prevLessonForUrl &&
    currentLessonId !== lessonFromUrl
  ) {
    setPrevLessonForUrl(currentLessonId);
    // Update URL
    const next = new URLSearchParams(searchParams);
    next.set('lesson', currentLessonId);
    setSearchParams(next, { replace: true });
  }

  // -------------------------------------------------------------------------
  // Mark the current lesson as in-progress on first view.
  // Uses a ref-like pattern (compare during render) to avoid effects.
  // -------------------------------------------------------------------------
  const [markedInProgress, setMarkedInProgress] = useState<Set<string>>(
    () => new Set(),
  );
  if (
    currentLessonId &&
    user &&
    !markedInProgress.has(currentLessonId) &&
    progressMap[currentLessonId]?.status === undefined
  ) {
    // Mark as seen — add to the local set immediately, fire API call
    const next = new Set(markedInProgress);
    next.add(currentLessonId);
    setMarkedInProgress(next);

    void api
      .updateLessonProgress({
        userId: user.id,
        courseSlug: slug!,
        lessonId: currentLessonId,
        status: 'in-progress',
      })
      .then((res) => {
        if (res.ok) {
          setProgressMap((prev) => ({
            ...prev,
            [currentLessonId]: res.data,
          }));
        }
      });
  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const selectLesson = (lessonId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('lesson', lessonId);
    setSearchParams(next, { replace: true });
    setMobileSidebarOpen(false);
    // Scroll to top of the lesson
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeCurrentLesson = async (score?: number) => {
    if (!user || !currentLessonId || !slug) return;

    const res = await api.updateLessonProgress({
      userId: user.id,
      courseSlug: slug,
      lessonId: currentLessonId,
      status: 'completed',
      score,
    });

    if (res.ok) {
      setProgressMap((prev) => ({
        ...prev,
        [currentLessonId]: res.data,
      }));

      // Auto-advance to the next lesson after a short delay
      const nextIndex = currentIndex + 1;
      if (nextIndex < flatLessons.length) {
        const nextLessonId = flatLessons[nextIndex].lesson.id;
        setTimeout(() => {
          selectLesson(nextLessonId);
        }, 400);
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      selectLesson(flatLessons[currentIndex - 1].lesson.id);
    }
  };

  const goToNext = () => {
    if (currentIndex < flatLessons.length - 1) {
      selectLesson(flatLessons[currentIndex + 1].lesson.id);
    }
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-learn-page">
        <style>{pageCss}</style>
        <div className="fx-learn-inner">
          <div className="fx-learn-loading">
            <div className="fx-learn-spinner" />
            <div>Loading course…</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div className="fx-learn-page">
        <style>{pageCss}</style>
        <div className="fx-learn-inner">
          <div className="fx-learn-error">
            <h2>Could not load course</h2>
            <p>{error}</p>
            <Link to="/dashboard" className="fx-learn-error-btn">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Access denied
  // -------------------------------------------------------------------------
  if (accessDenied) {
    const message =
      accessDenied === 'expired'
        ? 'Your access to this course has expired. Renew to continue.'
        : 'You don\'t own this course. Purchase it to start learning.';

    return (
      <div className="fx-learn-page">
        <style>{pageCss}</style>
        <div className="fx-learn-inner">
          <div className="fx-learn-error">
            <h2>
              {accessDenied === 'expired' ? 'Access expired' : 'Not enrolled'}
            </h2>
            <p>{message}</p>
            <Link
              to={`/courses/${slug}`}
              className="fx-learn-error-btn"
            >
              {accessDenied === 'expired'
                ? 'Renew access'
                : 'View course'}
            </Link>
            <Link
              to="/dashboard"
              className="fx-learn-error-btn secondary"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // No content
  // -------------------------------------------------------------------------
  if (!content || !course) {
    return (
      <div className="fx-learn-page">
        <style>{pageCss}</style>
        <div className="fx-learn-inner">
          <div className="fx-learn-nocontent">
            <div className="fx-learn-nocontent-icon" aria-hidden="true">
              🚧
            </div>
            <h2 className="fx-learn-nocontent-title">
              Content coming soon
            </h2>
            <p className="fx-learn-nocontent-sub">
              You have access to this course, but the learning material is
              still being prepared. We'll notify you by email the moment it's
              live.
            </p>
            <Link
              to={`/courses/${slug}`}
              className="fx-learn-error-btn"
            >
              ← Back to course page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Empty content (has modules but no lessons)
  // -------------------------------------------------------------------------
  if (totalLessons === 0) {
    return (
      <div className="fx-learn-page">
        <style>{pageCss}</style>
        <div className="fx-learn-inner">
          <div className="fx-learn-nocontent">
            <div className="fx-learn-nocontent-icon" aria-hidden="true">
              📖
            </div>
            <h2 className="fx-learn-nocontent-title">
              No lessons yet
            </h2>
            <p className="fx-learn-nocontent-sub">
              This course has modules but no lessons yet.
            </p>
            <Link
              to={`/courses/${slug}`}
              className="fx-learn-error-btn"
            >
              ← Back to course page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main render — learning area
  // -------------------------------------------------------------------------
  const moduleTitle = currentEntry
    ? `Module ${currentEntry.moduleOrder} · ${currentEntry.moduleTitle}`
    : undefined;

  return (
    <div className="fx-learn-page">
      <style>{pageCss}</style>

      <div className="fx-learn-inner">
        {/* Top bar */}
        <LessonProgressBar
          courseSlug={course.slug}
          courseTitle={course.title}
          completed={completedLessons}
          total={totalLessons}
        />

        {/* Two-column layout */}
        <div className="fx-learn-layout">
          {/* Sidebar — always rendered, hidden on mobile unless toggled */}
          <aside className="fx-learn-sidebar">
            {/* Mobile toggle */}
            <button
              type="button"
              className={`fx-learn-mobile-toggle${mobileSidebarOpen ? ' open' : ''}`}
              onClick={() => setMobileSidebarOpen((v) => !v)}
              aria-expanded={mobileSidebarOpen}
            >
              <span>
                📚 Course content ({completedLessons} / {totalLessons})
              </span>
              <span className="fx-learn-mobile-caret" aria-hidden="true">
                ▼
              </span>
            </button>

            {/* Sidebar visible on desktop, or toggled on mobile */}
            <div
              style={{
                display:
                  typeof window !== 'undefined' && window.innerWidth < 960
                    ? mobileSidebarOpen
                      ? 'block'
                      : 'none'
                    : 'block',
              }}
            >
              <LessonSidebar
                modules={content.modules}
                progressMap={progressMap}
                currentLessonId={currentLessonId ?? ''}
                onSelectLesson={selectLesson}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="fx-learn-content">
            {currentEntry ? (
              <>
                <LessonContent
                  lesson={currentEntry.lesson}
                  moduleTitle={moduleTitle}
                  progress={progressMap[currentEntry.lesson.id]}
                  onComplete={completeCurrentLesson}
                />

                {/* Bottom nav — prev/next */}
                <div className="fx-learn-nav">
                  <button
                    type="button"
                    className="fx-learn-nav-btn"
                    onClick={goToPrevious}
                    disabled={currentIndex <= 0}
                  >
                    ← Previous lesson
                  </button>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    Lesson {currentIndex + 1} of {totalLessons}
                  </span>

                  <button
                    type="button"
                    className="fx-learn-nav-btn primary"
                    onClick={goToNext}
                    disabled={currentIndex >= totalLessons - 1}
                  >
                    Next lesson →
                  </button>
                </div>
              </>
            ) : (
              <div className="fx-learn-error">
                <h2>Lesson not found</h2>
                <p>The lesson you're looking for isn't available.</p>
                <button
                  type="button"
                  className="fx-learn-error-btn"
                  onClick={() => {
                    const first = flatLessons[0]?.lesson.id;
                    if (first) selectLesson(first);
                  }}
                >
                  Start from the beginning
                </button>
              </div>
            )}

            {/* Course complete celebration */}
            {courseComplete && (
              <div className="fx-learn-complete">
                <div className="fx-learn-complete-icon" aria-hidden="true">
                  🎉
                </div>
                <h2 className="fx-learn-complete-title">
                  Course complete
                </h2>
                <p className="fx-learn-complete-sub">
                  You've finished every lesson in {course.title}. Your
                  progress has been saved. If this course has an associated
                  certification exam, you can take it from your dashboard.
                </p>
                <div className="fx-learn-complete-actions">
                  <Link
                    to="/dashboard"
                    className="fx-learn-complete-btn primary"
                  >
                    Back to dashboard
                  </Link>
                  <Link
                    to="/exam/dashboard"
                    className="fx-learn-complete-btn secondary"
                  >
                    View my exams →
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};