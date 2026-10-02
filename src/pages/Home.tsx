import React, { useState, useEffect } from 'react';
import { ImageCarousel } from '../components/common/ImageCarousel';

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

  // Course offerings list based on company profile
  const courses = [
    'Aviation Medicine (AVMED) Course',
    'Aviation Security (AVSEC) Awareness Training',
    'Initial Cabin Crew Training Course',
    'Cabin Crew Service Training (05 Days)',
    'Crew Resource Management',
    'Dangerous Goods Training',
    'English Proficiency Testing',
    'Reduced Vertical Separation Minimum (RVSM) Course',
    'Safety and Emergency Procedures Training',
    'Senior Cabin Crew Member (SCCM) Course',
    'Train The Trainer',
    'Wet Ditching & Survival Course',
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif', width: '100%', boxSizing: 'border-box' }}>
      
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
            industry and to “keep a finger on the aviation pulse.”
          </p>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section style={{ width: '100%', margin: '50px 0 0', padding: isMobile ? '0 15px' : '0 40px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#0f172a', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: 700, marginBottom: '10px' }}>
            Our Professional Courses
          </h2>
          <p style={{ color: '#64748b', fontSize: isMobile ? '1rem' : '1.1rem' }}>
            Comprehensive, accredited training programs tailored for aviation professionals.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          width: '100%',
        }}>
          {courses.map((course, index) => (
            <div 
              key={index} 
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(217, 83, 0, 0.12)';
                e.currentTarget.style.borderColor = '#fed7aa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ color: '#d95300', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Certification Course
              </div>
              <h3 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 600, margin: 0, lineHeight: '1.4' }}>
                {course}
              </h3>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};