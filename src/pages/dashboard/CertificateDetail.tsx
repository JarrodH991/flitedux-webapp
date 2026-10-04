// ============================================================================
// src/pages/dashboard/CertificateDetail.tsx
//
// Certificate detail page. Renders a formal A4 landscape certificate and
// provides print / save-as-PDF via the browser's native print dialog.
//
// Route: /dashboard/certificates/:id
//
// The printed output uses a dedicated print stylesheet that hides
// everything except the certificate itself, so the user gets a clean,
// full-page certificate when they print or save as PDF.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Certificate } from '../../types/certificate.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-cert-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.fx-cert-inner {
  max-width: 1100px;
  margin: 0 auto;
}

/* Header */
.fx-cert-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-cert-back {
  color: #d95300;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 8px;
}
.fx-cert-back:hover {
  text-decoration: underline;
}
.fx-cert-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.25;
}
.fx-cert-sub {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

/* Action buttons */
.fx-cert-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.fx-cert-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
}
.fx-cert-btn:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-cert-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-cert-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Certificate wrapper — sets up landscape A4 preview */
.fx-cert-wrap {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  overflow: hidden;
}

/* ---------- The certificate itself ---------- */
.fx-cert {
  position: relative;
  width: 100%;
  aspect-ratio: 297 / 210; /* A4 landscape */
  background: #fefdfb;
  background-image:
    radial-gradient(circle at 10% 10%, rgba(217, 83, 0, 0.04), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(217, 83, 0, 0.04), transparent 40%);
  border: 2px solid #d95300;
  border-radius: 6px;
  padding: 6% 8%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  font-family: Georgia, 'Times New Roman', serif;
  color: #1e293b;
}

/* Inner double border */
.fx-cert-inner-border {
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(217, 83, 0, 0.35);
  border-radius: 3px;
  pointer-events: none;
}

/* Corner ornaments */
.fx-cert-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: #d95300;
  border-style: solid;
  pointer-events: none;
}
.fx-cert-corner.tl { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
.fx-cert-corner.tr { top: 20px; right: 20px; border-width: 2px 2px 0 0; }
.fx-cert-corner.bl { bottom: 20px; left: 20px; border-width: 0 0 2px 2px; }
.fx-cert-corner.br { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }

/* Top row: issuer + certificate number */
.fx-cert-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  z-index: 1;
}
.fx-cert-issuer {
  display: flex;
  align-items: center;
  gap: 12px;
}
.fx-cert-issuer-tile {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #d95300, #b54400);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
  padding: 3px;
  box-sizing: border-box;
}
.fx-cert-issuer-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.fx-cert-issuer-name {
  font-family: sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.fx-cert-issuer-sub {
  font-family: sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-top: 2px;
}
.fx-cert-num {
  text-align: right;
  font-family: sans-serif;
}
.fx-cert-num-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-cert-num-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

/* Main content area */
.fx-cert-body {
  text-align: center;
  position: relative;
  z-index: 1;
  padding: 2% 0;
}
.fx-cert-eyebrow {
  font-family: sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 4px;
}
.fx-cert-h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(28px, 4.4vw, 52px);
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.05;
  letter-spacing: -0.5px;
}
.fx-cert-h1-sub {
  font-family: sans-serif;
  font-size: clamp(10px, 1vw, 12px);
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4%;
}
.fx-cert-presented {
  font-size: clamp(12px, 1.2vw, 15px);
  font-style: italic;
  color: #64748b;
  margin-bottom: 10px;
}
.fx-cert-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(22px, 3.4vw, 40px);
  font-weight: 700;
  color: #d95300;
  margin: 0 0 4px;
  line-height: 1.1;
  padding: 0 10%;
  word-break: break-word;
}
.fx-cert-name-rule {
  width: 60%;
  max-width: 420px;
  margin: 0 auto 4%;
  border: none;
  border-top: 1px solid #cbd5e1;
}
.fx-cert-for {
  font-size: clamp(12px, 1.2vw, 15px);
  font-style: italic;
  color: #64748b;
  margin-bottom: 10px;
}
.fx-cert-course {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(16px, 1.9vw, 22px);
  font-weight: 700;
  color: #1e293b;
  margin: 0 auto 4%;
  line-height: 1.3;
  max-width: 80%;
}
.fx-cert-score {
  font-size: clamp(11px, 1vw, 13px);
  color: #475569;
  margin: 0;
}
.fx-cert-score strong {
  color: #d95300;
  font-weight: 800;
}

/* Bottom row: signature + verify */
.fx-cert-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-top: 2%;
}
.fx-cert-sign {
  text-align: center;
  min-width: 160px;
}
.fx-cert-sign-line {
  border-top: 1px solid #1e293b;
  width: 100%;
  margin-bottom: 4px;
}
.fx-cert-sign-label {
  font-family: sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #64748b;
}
.fx-cert-sign-name {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
  font-family: sans-serif;
}

.fx-cert-verify {
  text-align: right;
  max-width: 260px;
}
.fx-cert-verify-label {
  font-family: sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-cert-verify-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 2px;
  margin-top: 2px;
}
.fx-cert-verify-hint {
  font-family: sans-serif;
  font-size: 9px;
  color: #94a3b8;
  margin-top: 2px;
}

.fx-cert-issued {
  text-align: center;
  font-family: sans-serif;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 1%;
  position: relative;
  z-index: 1;
}

/* Details panel */
.fx-cert-details {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-cert-details-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
}
.fx-cert-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.fx-cert-detail {
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 10px;
}
.fx-cert-detail-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}
.fx-cert-detail-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}
.fx-cert-detail-value.mono {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  font-size: 0.88rem;
}

/* Loading / error */
.fx-cert-loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}
.fx-cert-error {
  max-width: 500px;
  margin: 60px auto;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.fx-cert-error h2 {
  color: #0f172a;
  margin: 0 0 10px;
  font-size: 1.2rem;
}
.fx-cert-error p {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px;
}

/* ---------- PRINT STYLES ---------- */
@media print {
  /* Hide everything by default */
  body * {
    visibility: hidden;
  }

  /* Show only the certificate itself and its descendants */
  .fx-cert,
  .fx-cert * {
    visibility: visible;
  }

  /* Position the certificate to fill the printed page */
  .fx-cert {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    border-width: 3px;
    border-color: #d95300;
    background: #fefdfb;
    box-shadow: none;
    border-radius: 0;
    page-break-inside: avoid;
  }

  /* Ensure the page itself has no margins */
  @page {
    size: A4 landscape;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    width: 100%;
    height: 100%;
  }
  .fx-cert-page,
  .fx-cert-inner,
  .fx-cert-wrap,
  .fx-cert-header,
  .fx-cert-details {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const CertificateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load
  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await api.getCertificateById(id!);
      if (cancelled) return;

      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      if (!res.data) {
        setError('Certificate not found.');
        setLoading(false);
        return;
      }

      // Ownership check — only show your own certificates
      if (res.data.userId !== user!.id) {
        setError('You do not have access to this certificate.');
        setLoading(false);
        return;
      }

      setCertificate(res.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNumber = async () => {
    if (!certificate) return;
    try {
      await navigator.clipboard.writeText(certificate.certificateNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard might be blocked — silently fail
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-cert-page">
        <style>{pageCss}</style>
        <div className="fx-cert-inner">
          <div className="fx-cert-loading">Loading certificate…</div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="fx-cert-page">
        <style>{pageCss}</style>
        <div className="fx-cert-inner">
          <div className="fx-cert-error">
            <h2>Certificate unavailable</h2>
            <p>{error ?? 'Certificate not found.'}</p>
            <button
              type="button"
              className="fx-cert-btn primary"
              onClick={() => navigate('/dashboard/certificates')}
            >
              ← Back to certificates
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fx-cert-page">
      <style>{pageCss}</style>

      <div className="fx-cert-inner">
        {/* Header */}
        <div className="fx-cert-header">
          <div>
            <Link
              to="/dashboard/certificates"
              className="fx-cert-back"
            >
              ← All certificates
            </Link>
            <h1 className="fx-cert-title">{certificate.courseTitle}</h1>
            <p className="fx-cert-sub">
              {certificate.examTitle} · Issued {formatDate(certificate.issuedAt)}
            </p>
          </div>

          <div className="fx-cert-actions">
            <button
              type="button"
              className="fx-cert-btn"
              onClick={handleCopyNumber}
            >
              {copied ? '✓ Copied' : '📋 Copy number'}
            </button>
            <button
              type="button"
              className="fx-cert-btn primary"
              onClick={handlePrint}
            >
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Certificate preview */}
        <div className="fx-cert-wrap">
          <div className="fx-cert">
            <div className="fx-cert-inner-border" />
            <span className="fx-cert-corner tl" aria-hidden="true" />
            <span className="fx-cert-corner tr" aria-hidden="true" />
            <span className="fx-cert-corner bl" aria-hidden="true" />
            <span className="fx-cert-corner br" aria-hidden="true" />

            {/* Top row */}
            <div className="fx-cert-top">
              <div className="fx-cert-issuer">
                <div className="fx-cert-issuer-tile">
                  <img src="/images/flitedux-logo.png" alt="Flitedux" />
                </div>
                <div>
                  <div className="fx-cert-issuer-name">Flitedux</div>
                  <div className="fx-cert-issuer-sub">
                    Aviation Training
                  </div>
                </div>
              </div>

              <div className="fx-cert-num">
                <div className="fx-cert-num-label">Certificate No.</div>
                <div className="fx-cert-num-value">
                  {certificate.certificateNumber}
                </div>
              </div>
            </div>

            {/* Main body */}
            <div className="fx-cert-body">
              <div className="fx-cert-eyebrow">Certificate</div>
              <h2 className="fx-cert-h1">of Achievement</h2>
              <div className="fx-cert-h1-sub">Awarded to</div>

              <div className="fx-cert-presented">This is to certify that</div>
              <div className="fx-cert-name">{certificate.recipientName}</div>
              <hr className="fx-cert-name-rule" />

              <div className="fx-cert-for">
                has successfully completed and passed
              </div>
              <div className="fx-cert-course">{certificate.examTitle}</div>

              <p className="fx-cert-score">
                with a final score of{' '}
                <strong>{certificate.scorePercent}%</strong>
              </p>
            </div>

            {/* Bottom row */}
            <div className="fx-cert-bottom">
              <div className="fx-cert-sign">
                <div className="fx-cert-sign-line" />
                <div className="fx-cert-sign-label">
                  Authorised Signatory
                </div>
                <div className="fx-cert-sign-name">
                  Flitedux Aviation Training
                </div>
              </div>

              <div className="fx-cert-verify">
                <div className="fx-cert-verify-label">
                  Verification code
                </div>
                <div className="fx-cert-verify-value">
                  {certificate.verificationCode}
                </div>
                <div className="fx-cert-verify-hint">
                  Verify at flitedux.co.za/verify
                </div>
              </div>
            </div>

            <div className="fx-cert-issued">
              Issued on {formatDate(certificate.issuedAt)} · Johannesburg,
              South Africa
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div className="fx-cert-details">
          <h3 className="fx-cert-details-title">Certificate details</h3>
          <div className="fx-cert-details-grid">
            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Recipient</div>
              <div className="fx-cert-detail-value">
                {certificate.recipientName}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Course</div>
              <div className="fx-cert-detail-value">
                {certificate.courseTitle}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Exam</div>
              <div className="fx-cert-detail-value">
                {certificate.examTitle}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Score</div>
              <div className="fx-cert-detail-value">
                {certificate.scorePercent}%
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Issued</div>
              <div className="fx-cert-detail-value">
                {formatDate(certificate.issuedAt)}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Certificate number</div>
              <div className="fx-cert-detail-value mono">
                {certificate.certificateNumber}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Verification code</div>
              <div className="fx-cert-detail-value mono">
                {certificate.verificationCode}
              </div>
            </div>

            <div className="fx-cert-detail">
              <div className="fx-cert-detail-label">Attempt ID</div>
              <div className="fx-cert-detail-value mono">
                {certificate.attemptId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};