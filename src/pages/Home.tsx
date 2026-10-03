import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageCarousel } from '../components/common/ImageCarousel';

// ---------------------------------------------------------------------------
// Courses on the home page. Each one has a slug, title, and image.
//
// The image path is relative to /public. So `image: '/home/Course1.jpg'`
// points at /public/home/Course1.jpg.
//
// The slug must match the slug in src/data/courses.ts — otherwise the
// detail page will 404.
// ---------------------------------------------------------------------------

interface FeaturedCourse {
  slug: string;
  title: string;
  image: string;
}

const featuredCourses: FeaturedCourse[] = [
  {
    slug: 'avmed',
    title: 'Aviation Medicine (AVMED) Course',
    image: 'images/home/Course1.jpg',
  },
  {
    slug: 'avsec-awareness',
    title: 'Aviation Security (AVSEC) Awareness Training',
    image: 'images/home/Course2.png',
  },
  {
    slug: 'initial-cabin-crew',
    title: 'Initial Cabin Crew Training Course',
    image: 'images/home/Course3.jpg',
  },
  {
    slug: 'cabin-crew-service',
    title: 'Cabin Crew Service Training (05 Days)',
    image: 'images/home/Course4.jpg',
  },
  {
    slug: 'crew-resource-management',
    title: 'Crew Resource Management',
    image: 'images/home/Course5.jpg',
  },
  {
    slug: 'dangerous-goods',
    title: 'Dangerous Goods Training',
    image: 'images/home/Course6.jpg',
  },
  {
    slug: 'english-proficiency',
    title: 'English Proficiency Testing',
    image: 'images/home/Course7.png',
  },
  {
    slug: 'rvsm',
    title: 'Reduced Vertical Separation Minimum (RVSM) Course',
    image: 'images/home/Course8.jpg',
  },
  {
    slug: 'safety-emergency-procedures',
    title: 'Safety and Emergency Procedures Training',
    image: 'images/home/Course9.jpg',
  },
  {
    slug: 'sccm',
    title: 'Senior Cabin Crew Member (SCCM) Course',
    image: 'images/home/Course10.jpg',
  },
  {
    slug: 'train-the-trainer',
    title: 'Train The Trainer',
    image: 'images/home/Course11.jpg',
  },
  {
    slug: 'wet-ditching',
    title: 'Wet Ditching & Survival Course',
    image: 'images/home/Course12.jpg',
  },
];

// ---------------------------------------------------------------------------
// Styles for the course tiles. Kept in a CSS string so hover states are
// real CSS (inline styles can't target :hover pseudo-classes cleanly).
// ---------------------------------------------------------------------------

const pageCss = `
.fx-home-tile {
  display: block;
  text-decoration: none;
  color: inherit;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}
.fx-home-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(217, 83, 0, 0.15);
  border-color: #fed7aa;
}
.fx-home-tile:focus-visible {
  outline: 2px solid #d95300;
  outline-offset: 2px;
}

.fx-home-tile-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background-color: #f1f5f9;
  overflow: hidden;
}
.fx-home-tile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.fx-home-tile:hover .fx-home-tile-image img {
  transform: scale(1.06);
}

.fx-home-tile-body {
  padding: 20px 22px 22px;
}
.fx-home-tile-label {
  color: #d95300;
  font-weight: 700;
  font-size: 0.8rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fx-home-tile-title {
  color: #1e293b;
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 14px;
  line-height: 1.4;
}
.fx-home-tile-cta {
  color: #d95300;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.15s ease;
}
.fx-home-tile:hover .fx-home-tile-cta {
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .fx-home-tile,
  .fx-home-tile-image img,
  .fx-home-tile-cta {
    transition: none;
  }
  .fx-home-tile:hover {
    transform: none;
  }
  .fx-home-tile:hover .fx-home-tile-image img {
    transform: none;
  }
}
`;

export const Home: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const carouselImages = [
    'public/images/slide1.jpg',
    'public/images/slide2.jpg',
    'public/images/slide3.png',
    'public/images/slide5.png',
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <style>{pageCss}</style>

      {/* Hero Section with Carousel */}
      <section style={{ padding: isMobile ? '30px 15px' : '50px 40px', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '25px', color: '#0f172a', fontSize: isMobile ? '2rem' : '2.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
          Welcome to FLITEDUX
        </h1>
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'transparent',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          width: '100%'
        }}>
          <ImageCarousel images={carouselImages} autoPlayInterval={6000} />
        </div>
      </section>

      {/* Company Overview Section */}
      <section style={{ width: '100%', margin: '20px 0', padding: isMobile ? '0 15px' : '0 40px', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: isMobile ? '24px' : '45px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: isMobile ? '1.4rem' : '1.85rem' }}>
            Aviation Safety & Emergency Specialists
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.7', fontSize: isMobile ? '0.98rem' : '1.05rem', marginBottom: '20px' }}>
            Flitedux is a privately owned company accredited by the South African Civil Aviation Authority 
            (SACAA approval number <strong>CAA/0213</strong> & Aviation Security approval number <strong>CAA/10910/ASTO</strong>)
            as well as a number of other African Civil Aviation Authorities. We specialise in Safety & Emergency 
            Procedures training for Pilots, Cabin Crew, and Ground Staff.
          </p>
          <p style={{ color: '#475569', lineHeight: '1.7', fontSize: isMobile ? '0.98rem' : '1.05rem', marginBottom: '20px' }}>
            Our head office is situated in Jet Park on the East Rand, Johannesburg (just down the road from OR Tambo 
            International Airport and a number of airlines). We also have a satellite office in Durban.
          </p>
          <p style={{ color: '#475569', lineHeight: '1.7', fontSize: isMobile ? '0.98rem' : '1.05rem', margin: 0 }}>
            Flitedux has a number of SACAA accredited instructors with many years of flying experience. In order to 
            maintain current ratings these instructors still fly, allowing us to keep abreast of latest trends in the 
            industry and to "keep a finger on the aviation pulse."
          </p>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section style={{ width: '100%', margin: '50px 0 0', padding: isMobile ? '0 15px' : '0 40px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#0f172a', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: 700, marginBottom: '10px' }}>
            Our Professional Courses
          </h2>
          <p style={{ color: '#64748b', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '16px' }}>
            Comprehensive, accredited training programs tailored for aviation professionals.
          </p>
          <Link
            to="/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#d95300',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #fed7aa',
              backgroundColor: '#fff7ed',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffedd5';
              e.currentTarget.style.borderColor = '#d95300';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff7ed';
              e.currentTarget.style.borderColor = '#fed7aa';
            }}
          >
            View all courses →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          width: '100%',
        }}>
          {featuredCourses.map((course) => (
            <Link
              key={course.slug}
              to={`/courses/${course.slug}`}
              className="fx-home-tile"
            >
              <div className="fx-home-tile-image">
                <img
                  src={course.image}
                  alt={course.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Hide broken images gracefully
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="fx-home-tile-body">
                <div className="fx-home-tile-label">
                  Certification Course
                </div>
                <h3 className="fx-home-tile-title">{course.title}</h3>
                <span className="fx-home-tile-cta">
                  View course →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};