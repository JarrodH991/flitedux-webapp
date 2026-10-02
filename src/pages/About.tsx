import React from 'react';

export const About: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      <section style={{ padding: '60px 20px 40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          About Flitedux
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Flitedux Aviation Training is a premier provider of specialized aviation education, empowering crew members and aviation professionals with world-class safety, medical, and operational capabilities.
        </p>
      </section>

      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ color: '#1e293b', fontSize: '1.4rem' }}>Our Mission & Standards</h2>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: 0 }}>
            With dedicated facilities in Johannesburg (Bonaero Park) and Durban (Moreland Drive), we pride ourselves on delivering rigorous training modules ranging from Initial Cabin Crew Certification to Aviation Medicine and Dangerous Goods handling. Our commitment is to maintain the highest levels of safety awareness and regulatory compliance across the industry.
          </p>
        </div>
      </section>
    </div>
  );
};