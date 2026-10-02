import React, { useState } from 'react';

export const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* Header Section */}
      <section style={{ padding: '60px 20px 40px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          Contact Us
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', margin: 0 }}>
          Get in touch with our team for professional aviation training inquiries, course registrations, or general support.
        </p>
      </section>

      {/* Main Container */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
        }}>
          
          {/* Contact Details Card */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            <div>
              <h2 style={{ color: '#1e293b', fontSize: '1.5rem', marginBottom: '16px', fontWeight: 700 }}>
                Get In Touch
              </h2>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
                <strong>Postal Address:</strong><br />
                P.O. Box 3789, Edenvale, 1610.
              </p>
            </div>

            {/* Johannesburg Office */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <h3 style={{ color: '#000000', fontSize: '1.1rem', marginBottom: '8px' }}>Johannesburg Head Office</h3>
              <p style={{ color: '#475569', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>
                Denel North, Building R01, Second Floor<br />
                Atlas Road, Bonaero Park
              </p>
            </div>

            {/* Durban Office */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <h3 style={{ color: '#000000', fontSize: '1.1rem', marginBottom: '8px' }}>Durban Office</h3>
              <p style={{ color: '#475569', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>
                Unit A7, Glen Murray Business Park<br />
                Moreland Drive
              </p>
            </div>

            {/* Direct Contacts */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <h3 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '8px' }}>Direct Contacts</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
                <strong>Phone / Fax:</strong> +27 (0)11 397 8428<br />
                <strong>Email:</strong> <a href="mailto:info@flitedux.co.za" style={{ color: '#2563eb', textDecoration: 'none' }}>info@flitedux.co.za</a><br />
                <strong>GPS Co-ordinates:</strong> S26°9.74’, E28°13.30’
              </p>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
          }}>
            <h2 style={{ color: '#1e293b', fontSize: '1.5rem', marginBottom: '20px', fontWeight: 700 }}>
              Send Us a Message
            </h2>

            {submitted ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#166534',
              }}>
                <h3 style={{ marginBottom: '8px' }}>Thank You!</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Your message has been received. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#334155', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#334155', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#334155', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                    Message
                  </label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button 
                  type="submit"
                  style={{
                    backgroundColor: '#d95300',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b54400')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d95300')}
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};