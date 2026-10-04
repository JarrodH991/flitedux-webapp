// ============================================================================
// src/components/dashboard/CertificateCard.tsx
//
// Compact certificate card. Used on the dashboard "Recent certificates"
// widget and anywhere else we need a small preview of a certificate.
//
// Tapping the card navigates to the full certificate page.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

import type { Certificate } from '../../types/certificate.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const cardCss = `
.fx-certcard {
  display: block;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  position: relative;
  overflow: hidden;
}
.fx-certcard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #d95300, #b54400);
}
.fx-certcard:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(217, 83, 0, 0.12);
  border-color: #fed7aa;
}

.fx-certcard-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #fff7ed;
  color: #d95300;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 14px;
}

.fx-certcard-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fx-certcard-exam {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0 0 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fx-certcard-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.fx-certcard-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.fx-certcard-meta-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-certcard-meta-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fx-certcard-score {
  font-size: 1.05rem;
  font-weight: 800;
  color: #16a34a;
}

.fx-certcard-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  color: #d95300;
  font-size: 0.82rem;
  font-weight: 700;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface CertificateCardProps {
  certificate: Certificate;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
}) => {
  return (
    <>
      <style>{cardCss}</style>

      <Link
        to={`/dashboard/certificates/${certificate.id}`}
        className="fx-certcard"
      >
        <div className="fx-certcard-icon" aria-hidden="true">
          🏆
        </div>

        <h3 className="fx-certcard-title">{certificate.courseTitle}</h3>
        <p className="fx-certcard-exam">{certificate.examTitle}</p>

        <div className="fx-certcard-meta">
          <div className="fx-certcard-meta-item">
            <span className="fx-certcard-meta-label">Issued</span>
            <span className="fx-certcard-meta-value">
              {formatShortDate(certificate.issuedAt)}
            </span>
          </div>

          <div className="fx-certcard-meta-item">
            <span className="fx-certcard-meta-label">Certificate</span>
            <span className="fx-certcard-meta-value">
              {certificate.certificateNumber}
            </span>
          </div>

          <span className="fx-certcard-score">
            {certificate.scorePercent}%
          </span>
        </div>

        <span className="fx-certcard-cta">View certificate →</span>
      </Link>
    </>
  );
};