// ============================================================================
// src/pages/Courses.tsx
//
// The course catalogue. Shows all courses with a filter between online and
// in-person modes. If the user is signed in, purchased courses show an
// "Owned" badge and a "Continue →" button instead of "Add to Cart".
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/authHooks';
import * as api from '../services/api';
import { courses, type Mode } from '../data/courses';
import type { Course, Enrolment } from '../types/course.types';

const pageCss = `
/* ---------- Tab pill with sliding indicator ---------- */
.fx-tab-wrap {
  position: relative;
  display: flex;
  gap: 6px;
  max-width: 460px;
  margin: 0 auto;
  padding: 6px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  isolation: isolate;
}

.fx-tab-indicator {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 6px;
  width: calc(50% - 9px);
  background-color: #d95300;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  will-change: transform;
}

.fx-tab {
  position: relative;
  z-index: 1;
  flex: 1;
  border: none;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.3s ease;
}
.fx-tab:hover { color: #d95300; }
.fx-tab.active { color: #ffffff; }
.fx-tab.active:hover { color: #ffffff; }
.fx-tab:focus-visible { outline: 2px solid #d95300; outline-offset: 2px; }

/* ---------- Subtle card settle animation ---------- */
@keyframes fxCardSettle {
  from {
    opacity: 0.55;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fx-grid-enter > * {
  animation: fxCardSettle 0.32s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

.fx-grid-enter > *:nth-child(1) { animation-delay: 0ms; }
.fx-grid-enter > *:nth-child(2) { animation-delay: 30ms; }
.fx-grid-enter > *:nth-child(3) { animation-delay: 60ms; }
.fx-grid-enter > *:nth-child(4) { animation-delay: 90ms; }
.fx-grid-enter > *:nth-child(5) { animation-delay: 120ms; }
.fx-grid-enter > *:nth-child(6) { animation-delay: 150ms; }
.fx-grid-enter > *:nth-child(7) { animation-delay: 180ms; }
.fx-grid-enter > *:nth-child(8) { animation-delay: 210ms; }

/* ---------- Ownership badge ---------- */
.fx-owned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 4px 9px;
  border-radius: 6px;
  white-space: nowrap;
}
.fx-owned-badge.active {
  background: #dcfce7;
  color: #166534;
}
.fx-owned-badge.expired {
  background: #fee2e2;
  color: #991b1b;
}
.fx-owned-badge .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ---------- Buttons ---------- */
.fx-btn {
  display: inline-block;
  box-sizing: border-box;
  text-align: center;
  text-decoration: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.fx-btn.primary {
  background-color: #d95300;
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-btn.primary:hover,
.fx-btn.primary:focus-visible {
  background-color: #b54400;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.4);
}
.fx-btn.primary:active {
  background-color: #a84000;
  transform: translateY(0) scale(0.97);
}
.fx-btn.primary.owned {
  background-color: #166534;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.25);
}
.fx-btn.primary.owned:hover,
.fx-btn.primary.owned:focus-visible {
  background-color: #14532d;
  box-shadow: 0 8px 20px rgba(22, 101, 52, 0.4);
}
.fx-btn.primary.renew {
  background-color: #b45309;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25);
}
.fx-btn.secondary {
  background-color: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.fx-btn.secondary:hover,
.fx-btn.secondary:focus-visible {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-2px);
}
.fx-btn.secondary:active { transform: translateY(0) scale(0.97); }

.fx-badge-link {
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.fx-badge-link:hover { background-color: #ffedd5 !important; }

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .fx-tab-indicator { transition: none; }
  .fx-grid-enter > * { animation: none; }
}
`;

export const Courses: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search')?.toLowerCase() || '';

  const [mode, setMode] = useState<Mode>(() => {
    const saved = sessionStorage.getItem('flitedux_course_mode');
    return saved === 'online' || saved === 'inperson' ? saved : 'inperson';
  });

  // The user's enrolments, keyed by courseSlug for O(1) lookup
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);

  // ---------------------------------------------------------------------------
  // Reset the enrolment list whenever the user changes (signs in, signs out,
  // or switches accounts). Doing this during render instead of inside an
  // effect avoids the "cascading renders" warning React gives for
  // synchronous setState inside an effect body.
  //
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // ---------------------------------------------------------------------------
  const currentUserId = user?.id ?? null;
  const [prevUserId, setPrevUserId] = useState<string | null>(currentUserId);
  if (currentUserId !== prevUserId) {
    setPrevUserId(currentUserId);
    setEnrolments([]);
  }

  // ---------------------------------------------------------------------------
  // Load the user's enrolments whenever the user changes.
  // We return early when there's no user rather than calling setEnrolments([]),
  // because the reset-during-render block above already handles clearing.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void api.getUserEnrolments(user.id).then((res) => {
      if (!cancelled && res.ok) {
        setEnrolments(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const enrolmentBySlug = useMemo(() => {
    const m: Record<string, Enrolment> = {};
    for (const e of enrolments) m[e.courseSlug] = e;
    return m;
  }, [enrolments]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    sessionStorage.setItem('flitedux_course_mode', newMode);
  };

  const matchesSearch = (course: Course) =>
    course.title.toLowerCase().includes(searchQuery) ||
    course.category.toLowerCase().includes(searchQuery);

  const onlineCourses = courses.filter((c) => c.online && matchesSearch(c));
  const inPersonCourses = courses.filter(matchesSearch);
  const visibleCourses = mode === 'online' ? onlineCourses : inPersonCourses;

  const handleAddToCart = (course: Course) => {
    const priceNumber = course.online?.price
      ? parseFloat(course.online.price.replace(/[^0-9.]/g, ''))
      : 199;

    addToCart({
      id: course.slug,
      title: course.title,
      description: course.description,
      price: priceNumber,
      accessDurationDays: course.accessDurationDays,
    } as never);

    navigate('/cart');
  };

  const cardBase: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  };

  const liftOn = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 8px 20px rgba(217, 83, 0, 0.12)';
    e.currentTarget.style.borderColor = '#fed7aa';
  };
  const liftOff = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
    e.currentTarget.style.borderColor = '#e2e8f0';
  };

  const pillStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: 600,
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <style>{pageCss}</style>

      {/* Header Section */}
      <section style={{ padding: '60px 20px 30px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          Professional Aviation Training Courses
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', margin: 0 }}>
          SACAA accredited safety, emergency, and operational training programs tailored for pilots, cabin crew, and ground personnel.
        </p>
        {searchQuery && (
          <p style={{ color: '#d95300', marginTop: '10px', fontWeight: 600 }}>
            Showing results for search: "{searchQuery}"
          </p>
        )}
      </section>

      {/* Online / In-Person Toggle */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 30px', boxSizing: 'border-box' }}>
        <div className="fx-tab-wrap" role="tablist" aria-label="Course delivery type">
          <div
            className="fx-tab-indicator"
            style={{ transform: mode === 'online' ? 'translateX(0)' : 'translateX(calc(100% + 6px))' }}
            aria-hidden="true"
          />
          <button
            role="tab"
            aria-selected={mode === 'online'}
            className={`fx-tab${mode === 'online' ? ' active' : ''}`}
            onClick={() => handleModeChange('online')}
          >
            Online Courses
          </button>
          <button
            role="tab"
            aria-selected={mode === 'inperson'}
            className={`fx-tab${mode === 'inperson' ? ' active' : ''}`}
            onClick={() => handleModeChange('inperson')}
          >
            In-Person Courses
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.95rem', margin: '16px 0 0' }}>
          {mode === 'online'
            ? 'Learn at your own pace. AVSEC, Crew Resource Management and Dangerous Goods are available online.'
            : 'Instructor-led training at our Jet Park and Durban offices. Every course is available in person.'}
        </p>
      </section>

      {/* Course Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
        {visibleCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {searchQuery
              ? `No ${mode === 'online' ? 'online' : 'in-person'} courses found matching your search.`
              : 'No courses available.'}
          </div>
        ) : (
          <div
            key={mode}
            className="fx-grid-enter"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {visibleCourses.map((course) => {
              const inCart = cart.some((item) => item.id === course.slug);
              const enrolment = enrolmentBySlug[course.slug];
              const isOwned = enrolment?.status === 'active';
              const isExpired = enrolment?.status === 'expired';

              return mode === 'online' && course.online ? (
                /* ---------- ONLINE CARD ---------- */
                <div
                  key={course.slug}
                  style={cardBase}
                  onMouseEnter={liftOn}
                  onMouseLeave={liftOff}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#d95300', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {course.category}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {isOwned && (
                          <span className="fx-owned-badge active">
                            <span className="dot" aria-hidden="true" />
                            Owned
                          </span>
                        )}
                        {isExpired && (
                          <span className="fx-owned-badge expired">
                            <span className="dot" aria-hidden="true" />
                            Expired
                          </span>
                        )}
                        <span style={{ ...pillStyle, backgroundColor: '#fff7ed', color: '#d95300' }}>
                          Online
                        </span>
                      </div>
                    </div>

                    <Link to={`/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ color: '#1e293b', fontSize: '1.15rem', fontWeight: 600, margin: '0 0 10px', lineHeight: 1.4 }}>
                        {course.title}
                      </h3>
                    </Link>

                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 16px' }}>
                      {course.description}
                    </p>

                    <div style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                      What you'll learn
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {course.online.learn.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={pillStyle}>{course.accreditation}</span>
                      {course.online.duration && <span style={pillStyle}>{course.online.duration}</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>
                      {course.online.price || ''}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/courses/${course.slug}`}
                        className="fx-btn secondary"
                        style={{ padding: '10px 16px' }}
                      >
                        Details
                      </Link>
                      {isOwned ? (
                        <Link
                          to={`/courses/${course.slug}`}
                          className="fx-btn primary owned"
                        >
                          Continue →
                        </Link>
                      ) : isExpired ? (
                        <button
                          className="fx-btn primary renew"
                          onClick={() => handleAddToCart(course)}
                        >
                          Renew
                        </button>
                      ) : (
                        <button
                          className="fx-btn primary"
                          onClick={() => handleAddToCart(course)}
                          style={inCart ? { backgroundColor: '#475569' } : {}}
                        >
                          {inCart ? 'View in Cart' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------- IN-PERSON CARD ---------- */
                <div
                  key={course.slug}
                  style={cardBase}
                  onMouseEnter={liftOn}
                  onMouseLeave={liftOff}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#d95300', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {course.category}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {isOwned && (
                          <span className="fx-owned-badge active">
                            <span className="dot" aria-hidden="true" />
                            Owned
                          </span>
                        )}
                        {isExpired && (
                          <span className="fx-owned-badge expired">
                            <span className="dot" aria-hidden="true" />
                            Expired
                          </span>
                        )}
                        <span style={pillStyle}>{course.accreditation}</span>
                      </div>
                    </div>

                    <Link to={`/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ color: '#1e293b', fontSize: '1.15rem', fontWeight: 600, margin: '0 0 10px', lineHeight: 1.4 }}>
                        {course.title}
                      </h3>
                    </Link>

                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                      {course.description}
                    </p>

                    {course.online && (
                      <button
                        className="fx-badge-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModeChange('online');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{ ...pillStyle, backgroundColor: '#fff7ed', color: '#d95300', marginTop: '14px' }}
                      >
                        Also available online →
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                      Duration: <strong>{course.duration}</strong>
                    </span>
                    <Link
                      to={`/courses/${course.slug}`}
                      style={{ color: isOwned ? '#166534' : '#d95300', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {isOwned ? 'Continue →' : 'View details →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};