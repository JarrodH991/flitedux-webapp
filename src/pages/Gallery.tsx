import React from 'react';

export const Gallery: React.FC = () => {
  const images = [
    { title: "Cabin Crew Training", subtitle: "Emergency evacuation drills" },
    { title: "Wet Ditching Exercise", subtitle: "Water survival training facility" },
    { title: "Fire & Smoke Simulation", subtitle: "Practical safety drills" },
    { title: "Aviation Medical Lab", subtitle: "AVMED practical training" },
    { title: "Johannesburg Facilities", subtitle: "Denel North campus" },
    { title: "Durban Center", subtitle: "Glen Murray Business Park" },
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      <section style={{ padding: '60px 20px 40px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          Training Gallery
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem' }}>
          A visual glimpse into our state-of-the-art training facilities and practical sessions.
        </p>
      </section>

      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {images.map((img, index) => (
            <div key={index} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                height: '180px',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                [ Training Photo Placeholder ]
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '6px' }}>{img.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{img.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};