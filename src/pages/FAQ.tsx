import React, { useState, useEffect } from 'react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const faqs = [
    {
      q: "There are so many names / terms relating to a cabin crew member – what is the official term / name?",
      a: "There have been many over the years from sky girl, air hostess, stewardess and steward (when males were first employed) to flight attendant and finally to cabin crew member which is the CAA recognised name. However flight attendant is still widely accepted and spoken about."
    },
    {
      q: "Is there a height restriction?",
      a: "This varies according to the specific airline and which aircraft type they operate. Usually no shorter than 1.58m."
    },
    {
      q: "Is there an age cutoff?",
      a: "No – you can fly as a cabin crew member until retirement age providing you pass your medical and annual legislated training."
    },
    {
      q: "What types of job could I expect to get?",
      a: "You can either fly for a commercial airline where you fly according to a roster and are employed by the airline either on a permanent or contract basis. There is contract flying whereby you could be away from home for up to 8 weeks at a time flying out of another city / country. This is often part time work based on the contract that the airline gets from the client. One can also do freelance flying whereby you fly on a temporary basis for one or two different companies."
    },
    {
      q: "Can I fly on as many aircraft as I want to?",
      a: "No, the SACAA allow a cabin crew member to only fly on 3 different aircraft types."
    },
    {
      q: "How do I stay legal?",
      a: "By doing your annual recurrent training and medicals as regularly as is legally required (this differs slightly according to certain subjects)."
    },
    {
      q: "How do I prove I have done the course and are legal?",
      a: "Once you have completed the 6 week initial course you will qualify to write the SACAA exam. This is an external exam written at the SACAA offices in Midrand. Upon passing this exam you will be issued with a SACAA license. Flitedux will also issue you with accredited certificates."
    },
    {
      q: "How difficult is the course?",
      a: "The passmark is 90% for most written exams and the practical assessments passmark is 100%. You need to study and take the course seriously. Flitedux will provide you with all the necessary training manuals and course material."
    },
    {
      q: "Does Flitedux charge a placement fee if they find me work?",
      a: "No we do not believe in doing that. If Flitedux does manage to find you work then we do so free of charge."
    },
    {
      q: "Does Flitedux guarantee employment?",
      a: "As Flitedux is not a recruitment agency we cannot guarantee employment. We do however assist where we can by passing on CV’s to airlines we conduct training for. Many airlines do call us when they are recruiting and then we will put names forward."
    },
    {
      q: "What accreditations do your courses hold?",
      a: "Our courses are fully accredited and compliant with the South African Civil Aviation Authority (SACAA) and relevant training standards[cite: 1]."
    },
    {
      q: "Where are your training centers located?",
      a: "Our head office is situated in Jet Park on the East Rand, Johannesburg (just down the road from OR Tambo International Airport). We also have a satellite office in Durban."
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* Header Section */}
      <section style={{ padding: isMobile ? '40px 15px 30px' : '60px 20px 40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: '#475569', fontSize: isMobile ? '1rem' : '1.1rem', lineHeight: '1.5' }}>
          Find answers to common queries regarding our aviation training courses, licensing, career opportunities, and requirements.
        </p>
      </section>

      {/* FAQ Accordion List */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              onClick={() => setOpenIndex(isOpen ? null : index)}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '18px' : '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fed7aa';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 83, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                <h3 style={{ color: '#1e293b', fontSize: isMobile ? '1rem' : '1.1rem', margin: 0, fontWeight: 600, lineHeight: '1.4' }}>
                  {faq.q}
                </h3>
                <span style={{ color: '#d95300', fontWeight: 'bold', fontSize: '1.25rem', flexShrink: 0 }}>
                  {isOpen ? '−' : '+'}
                </span>
              </div>
              {isOpen && (
                <p style={{ color: '#475569', lineHeight: '1.6', marginTop: '14px', marginBottom: 0, fontSize: isMobile ? '0.95rem' : '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </section>

    </div>
  );
};