// ============================================================================
// src/pages/CourseDetails.tsx
//
// Course detail page. Now includes a hero image banner at the top when the
// course has an `image` field.
//
// Shows marketing copy, course facts, and an action panel. If the user
// already owns the course, the panel shows "You own this course" with an
// access-until date and a "Continue learning" button.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { courses } from '../data/courses';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/authHooks';
import * as api from '../services/api';
import type { Enrolment } from '../types/course.types';

const pageCss = `
.fx-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 900px) {
  .fx-detail-grid {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 40px;
  }
}

@media (min-width: 900px) {
  .fx-detail-sidebar {
    position: sticky;
    top: 100px;
  }
}

.fx-detail-sidebar {
  width: 100%;
  box-sizing: border-box;
}

.fx-detail-btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  text-decoration: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 14px 20px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.fx-detail-btn.primary {
  background-color: #d95300;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-detail-btn.primary:hover,
.fx-detail-btn.primary:focus-visible {
  background-color: #b54400;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.4);
}
.fx-detail-btn.primary:active {
  background-color: #a84000;
  transform: translateY(0) scale(0.98);
}
.fx-detail-btn.primary.owned {
  background-color: #166534;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.25);
}
.fx-detail-btn.primary.owned:hover,
.fx-detail-btn.primary.owned:focus-visible {
  background-color: #14532d;
  box-shadow: 0 8px 20px rgba(22, 101, 52, 0.4);
}
.fx-detail-btn.primary.renew {
  background-color: #b45309;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25);
}
.fx-detail-btn.primary.renew:hover,
.fx-detail-btn.primary.renew:focus-visible {
  background-color: #92400e;
  box-shadow: 0 8px 20px rgba(180, 83, 9, 0.4);
}
.fx-detail-btn.secondary {
  background-color: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.fx-detail-btn.secondary:hover,
.fx-detail-btn.secondary:focus-visible {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-2px);
}
.fx-detail-btn.secondary:active {
  transform: translateY(0) scale(0.98);
}

.fx-detail-pill {
  display: inline-block;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.fx-back-link {
  color: #d95300;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}
.fx-back-link:hover { opacity: 0.75; }

.fx-owned-banner {
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-size: 0.88rem;
  line-height: 1.5;
}
.fx-owned-banner.active {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}
.fx-owned-banner.expired {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.fx-owned-banner-title {
  font-weight: 700;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fx-owned-banner-sub {
  font-size: 0.82rem;
  margin: 0;
  opacity: 0.85;
}

/* ---------- HERO with background image ---------- */
.fx-detail-hero {
  position: relative;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  color: #ffffff;
  padding: 120px 20px 60px;
  overflow: hidden;
  isolation: isolate;
}
.fx-detail-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(15, 23, 42, 0.55) 40%,
    rgba(15, 23, 42, 0.85) 100%
  );
  z-index: 0;
}
.fx-detail-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}
.fx-detail-hero .fx-back-link {
  color: #fed7aa;
}
.fx-detail-hero .fx-back-link:hover {
  color: #ffffff;
  opacity: 1;
}
.fx-detail-hero-pill {
  display: inline-block;
  font-size: 0.72rem;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  backdrop-filter: blur(6px);
}
.fx-detail-hero-pill.accent {
  background: #d95300;
  border-color: #d95300;
}
.fx-detail-hero-pill.owned {
  background: #16a34a;
  border-color: #16a34a;
}
.fx-detail-hero-pill.expired {
  background: #dc2626;
  border-color: #dc2626;
}
.fx-detail-hero-title {
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 800;
  margin: 16px 0 14px;
  line-height: 1.15;
  word-wrap: break-word;
  max-width: 820px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}
@media (min-width: 640px) {
  .fx-detail-hero-title {
    font-size: 2.6rem;
  }
}
.fx-detail-hero-desc {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0;
  max-width: 720px;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.25);
}

/* Fallback hero when no image — light background */
.fx-detail-hero.plain {
  background-color: #ffffff;
  color: #0f172a;
  padding: 90px 16px 32px;
}
.fx-detail-hero.plain::before {
  display: none;
}
.fx-detail-hero.plain .fx-detail-hero-title {
  color: #0f172a;
  text-shadow: none;
}
.fx-detail-hero.plain .fx-detail-hero-desc {
  color: #475569;
  text-shadow: none;
}
.fx-detail-hero.plain .fx-detail-hero-pill {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}
.fx-detail-hero.plain .fx-detail-hero-pill.accent {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #d95300;
}
.fx-detail-hero.plain .fx-detail-hero-pill.owned {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}
.fx-detail-hero.plain .fx-detail-hero-pill.expired {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}
.fx-detail-hero.plain .fx-back-link {
  color: #d95300;
}

.fx-detail-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 16px;
  box-sizing: border-box;
}
@media (min-width: 640px) {
  .fx-detail-body {
    padding: 48px 20px;
  }
}
`;

/* ---------- Small helper components ---------- */

const DetailCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '14px 18px',
      minWidth: 0,
    }}
  >
    <div
      style={{
        color: '#64748b',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '6px',
      }}
    >
      {label}
    </div>
    <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.95rem', wordWrap: 'break-word' }}>
      {value}
    </div>
  </div>
);

const SidebarFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
    <span style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
      {value}
    </span>
  </div>
);

/* ---------- Page component ---------- */

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { user } = useAuth();

  const course = courses.find((c) => c.slug === slug);

  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);

  const currentKey = `${user?.id ?? 'anon'}::${slug ?? ''}`;
  const [prevKey, setPrevKey] = useState<string>(currentKey);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setEnrolment(null);
  }

  useEffect(() => {
    if (!user || !course) return;
    let cancelled = false;
    void api.getUserEnrolmentForCourse(user.id, course.slug).then((res) => {
      if (!cancelled && res.ok) {
        setEnrolment(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, course]);

  if (!course) {
    return (
      <div
        style={{
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          padding: '120px 20px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <style>{pageCss}</style>
        <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 800 }}>Course not found</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          The course you're looking for doesn't exist or may have been renamed.
        </p>
        <Link
          to="/courses"
          className="fx-detail-btn primary"
          style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }}
        >
          ← Back to all courses
        </Link>
      </div>
    );
  }

  const inCart = cart.some((item) => item.id === course.slug);
  const hasOnline = !!course.online;
  const onlinePrice = course.online?.price;

  const isOwned = enrolment?.status === 'active';
  const isExpired = enrolment?.status === 'expired';

  const handleAddToCart = () => {
    const priceNumber = onlinePrice
      ? parseFloat(onlinePrice.replace(/[^0-9.]/g, ''))
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

  const expiryLabel = (() => {
    if (!enrolment?.expiresAt) return 'Lifetime access';
    try {
      return `Access until ${new Date(
        enrolment.expiresAt,
      ).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
    } catch {
      return 'Access until an unknown date';
    }
  })();

  const expiredOnLabel = (() => {
    if (!enrolment?.expiresAt) return '';
    try {
      return `Expired on ${new Date(
        enrolment.expiresAt,
      ).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
    } catch {
      return 'Expired';
    }
  })();

  // Hero uses the course image if present
  const heroImageStyle: React.CSSProperties = course.image
    ? { backgroundImage: `url(${course.image})` }
    : {};

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        paddingBottom: '80px',
        fontFamily: 'sans-serif',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <style>{pageCss}</style>

      {/* ---------- HERO ---------- */}
      <section
        className={`fx-detail-hero${course.image ? '' : ' plain'}`}
        style={heroImageStyle}
      >
        <div className="fx-detail-hero-inner">
          <Link to="/courses" className="fx-back-link">
            ← All Courses
          </Link>

          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="fx-detail-hero-pill accent">
              {course.category}
            </span>
            <span className="fx-detail-hero-pill">
              {course.accreditation}
            </span>
            {hasOnline && (
              <span className="fx-detail-hero-pill accent">
                Online Available
              </span>
            )}
            {isOwned && (
              <span className="fx-detail-hero-pill owned">✓ Owned</span>
            )}
            {isExpired && (
              <span className="fx-detail-hero-pill expired">
                Access expired
              </span>
            )}
          </div>

          <h1 className="fx-detail-hero-title">{course.title}</h1>
          <p className="fx-detail-hero-desc">{course.description}</p>
        </div>
      </section>

      {/* ---------- BODY ---------- */}
      <section className="fx-detail-body">
        <div className="fx-detail-grid">
          {/* ============ LEFT: CONTENT ============ */}
          <div style={{ display: 'grid', gap: '36px', minWidth: 0 }}>
            <div>
              <h2
                style={{
                  color: '#0f172a',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 0 14px',
                }}
              >
                Course overview
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.7, margin: 0 }}>
                {course.description} This program is delivered by experienced aviation
                instructors and is designed to meet the regulatory requirements set out by the
                relevant aviation authorities. Whether you're new to the industry or looking to
                upskill, this course provides practical, hands-on training that you can apply
                immediately in the field.
              </p>
            </div>

            {course.online?.learn && (
              <div>
                <h2
                  style={{
                    color: '#0f172a',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 14px',
                  }}
                >
                  What you'll learn
                </h2>
                <ul
                  style={{
                    paddingLeft: '20px',
                    color: '#475569',
                    lineHeight: 1.9,
                    margin: 0,
                    fontSize: '1rem',
                  }}
                >
                  {course.online.learn.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2
                style={{
                  color: '#0f172a',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 0 14px',
                }}
              >
                Course details
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                <DetailCard label="Duration" value={course.duration} />
                <DetailCard label="Accreditation" value={course.accreditation} />
                <DetailCard label="Category" value={course.category} />
                {course.online?.duration && (
                  <DetailCard label="Online duration" value={course.online.duration} />
                )}
                {course.accessDurationDays && (
                  <DetailCard
                    label="Access window"
                    value={`${course.accessDurationDays} days`}
                  />
                )}
              </div>
            </div>

            <div>
              <h2
                style={{
                  color: '#0f172a',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 0 14px',
                }}
              >
                Who is it for
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.7, margin: 0 }}>
                This course is suitable for aviation professionals looking to meet regulatory
                training requirements, expand their skillset, or prepare for a specific role
                within the industry. It's designed to be accessible to both new entrants and
                experienced personnel.
              </p>
            </div>
          </div>

          {/* ============ RIGHT: ACTION PANEL ============ */}
          <aside className="fx-detail-sidebar">
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '22px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {isOwned && (
                <div className="fx-owned-banner active">
                  <p className="fx-owned-banner-title">
                    <span aria-hidden="true">✓</span>
                    You own this course
                  </p>
                  <p className="fx-owned-banner-sub">{expiryLabel}</p>
                </div>
              )}
              {isExpired && (
                <div className="fx-owned-banner expired">
                  <p className="fx-owned-banner-title">
                    <span aria-hidden="true">⚠</span>
                    Access expired
                  </p>
                  <p className="fx-owned-banner-sub">
                    {expiredOnLabel}. Renew to regain access.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                {onlinePrice ? (
                  <>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      {isOwned ? 'You paid' : 'Online from'}
                    </div>
                    <div
                      style={{
                        color: '#0f172a',
                        fontSize: '1.9rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {isOwned
                        ? `$${enrolment?.price.toFixed(2) ?? onlinePrice}`
                        : onlinePrice}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      Pricing
                    </div>
                    <div
                      style={{
                        color: '#0f172a',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      Request a quote
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {isOwned ? (
                  <>
                    <Link
                      to={`/courses/${course.slug}/learn`}
                      className="fx-detail-btn primary owned"
                    >
                      Continue learning →
                    </Link>
                    <Link to="/dashboard" className="fx-detail-btn secondary">
                      Back to dashboard
                    </Link>
                  </>
                ) : isExpired ? (
                  <>
                    {hasOnline && (
                      <button
                        className="fx-detail-btn primary renew"
                        onClick={handleAddToCart}
                      >
                        Renew for $
                        {parseFloat(
                          (onlinePrice ?? '199').replace(/[^0-9.]/g, ''),
                        ).toFixed(2)}
                      </button>
                    )}
                    <Link to="/contact" className="fx-detail-btn secondary">
                      Contact support
                    </Link>
                  </>
                ) : (
                  <>
                    {hasOnline && (
                      <button
                        className="fx-detail-btn primary"
                        onClick={handleAddToCart}
                        style={
                          inCart
                            ? { backgroundColor: '#475569', boxShadow: 'none' }
                            : {}
                        }
                      >
                        {inCart ? 'View in Cart' : 'Add to Cart'}
                      </button>
                    )}
                    <Link to="/contact" className="fx-detail-btn secondary">
                      Enquire about this course
                    </Link>
                  </>
                )}
              </div>

              <div
                style={{
                  marginTop: '22px',
                  paddingTop: '18px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <SidebarFact label="Duration" value={course.duration} />
                <SidebarFact label="Accreditation" value={course.accreditation} />
                {course.online?.duration && (
                  <SidebarFact label="Online" value={course.online.duration} />
                )}
                {course.accessDurationDays && (
                  <SidebarFact
                    label="Access"
                    value={`${course.accessDurationDays} days`}
                  />
                )}
              </div>

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  margin: '18px 0 0',
                }}
              >
                {isOwned
                  ? 'Your access is active. Click Continue learning to open the course.'
                  : isExpired
                    ? 'Your previous access has ended. Renew to continue studying.'
                    : hasOnline
                      ? 'Enroll online instantly, or contact us to arrange in-person training.'
                      : 'Instructor-led training at our Jet Park and Durban offices.'}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};