import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { courses } from '../data/courses';
import { useCart } from '../context/CartContext';

const pageCss = `
/* Layout: stack on mobile, two columns on desktop */
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

/* Sticky sidebar only on desktop */
@media (min-width: 900px) {
  .fx-detail-sidebar {
    position: sticky;
    top: 100px;
  }
}

/* On mobile the aside just sits below the content */
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

/* Responsive hero title */
.fx-detail-title {
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 800;
  margin: 16px 0 12px;
  line-height: 1.2;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .fx-detail-title {
    font-size: 2.4rem;
  }
}

/* Responsive hero padding */
.fx-detail-hero {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 90px 16px 32px;
}
@media (min-width: 640px) {
  .fx-detail-hero {
    padding: 100px 20px 40px;
  }
}

/* Responsive body padding */
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

  const course = courses.find((c) => c.slug === slug);

  // ---------- Not found ----------
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

  const handleAddToCart = () => {
    const priceNumber = onlinePrice
      ? parseFloat(onlinePrice.replace(/[^0-9.]/g, ''))
      : 199;

    addToCart({
      id: course.slug,
      title: course.title,
      description: course.description,
      price: priceNumber,
    });

    navigate('/cart');
  };

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

      {/* ---------- Hero band ---------- */}
      <section className="fx-detail-hero">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Link to="/courses" className="fx-back-link">
            ← All Courses
          </Link>

          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="fx-detail-pill"
              style={{
                backgroundColor: '#fff7ed',
                color: '#d95300',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {course.category}
            </span>
            <span
              className="fx-detail-pill"
              style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
            >
              {course.accreditation}
            </span>
            {hasOnline && (
              <span
                className="fx-detail-pill"
                style={{ backgroundColor: '#fff7ed', color: '#d95300' }}
              >
                Online Available
              </span>
            )}
          </div>

          <h1 className="fx-detail-title">{course.title}</h1>
          <p
            style={{
              color: '#475569',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '720px',
            }}
          >
            {course.description}
          </p>
        </div>
      </section>

      {/* ---------- Two-column body ---------- */}
      <section className="fx-detail-body">
        <div className="fx-detail-grid">
          {/* ============ LEFT: CONTENT ============ */}
          <div style={{ display: 'grid', gap: '36px', minWidth: 0 }}>
            {/* Overview */}
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

            {/* What you'll learn */}
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

            {/* Course details */}
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
              </div>
            </div>

            {/* Who is it for */}
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
              {/* Price / starting info */}
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
                      Online from
                    </div>
                    <div
                      style={{
                        color: '#0f172a',
                        fontSize: '1.9rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {onlinePrice}
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

              {/* Buttons */}
              <div style={{ display: 'grid', gap: '10px' }}>
                {hasOnline && (
                  <button
                    className="fx-detail-btn primary"
                    onClick={handleAddToCart}
                    style={inCart ? { backgroundColor: '#475569', boxShadow: 'none' } : {}}
                  >
                    {inCart ? 'View in Cart' : 'Add to Cart'}
                  </button>
                )}

                <Link to="/contact" className="fx-detail-btn secondary">
                  Enquire about this course
                </Link>
              </div>

              {/* Quick facts */}
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
              </div>

              {/* Delivery note */}
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  margin: '18px 0 0',
                }}
              >
                {hasOnline
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