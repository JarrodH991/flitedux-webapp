// ============================================================================
// src/pages/dashboard/CertificatesList.tsx
//
// The full certificates list. Shows every certificate the user has earned,
// with filters by year and course name search.
//
// Route: /dashboard/certificates
//
// 🔌 AWS: Reads from services/api.ts. Certificates are derived from passed
//         attempts — no separate storage.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import * as api from '../../services/api';

import type { Certificate } from '../../types/certificate.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-certlist-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.fx-certlist-inner {
  max-width: 1100px;
  margin: 0 auto;
}

/* Header */
.fx-certlist-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.fx-certlist-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-certlist-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.fx-certlist-sub {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

/* Buttons */
.fx-certlist-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
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
.fx-certlist-btn:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-certlist-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-certlist-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  color: #ffffff;
}

/* Stats */
.fx-certlist-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.fx-certlist-stat {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-certlist-stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-certlist-stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

/* Filters */
.fx-certlist-filters {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.fx-certlist-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-certlist-filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-certlist-filter-field select,
.fx-certlist-filter-field input {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #0f172a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
  box-sizing: border-box;
}
.fx-certlist-filter-field select:focus,
.fx-certlist-filter-field input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}

/* Results meta */
.fx-certlist-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 0 4px;
  font-size: 0.88rem;
  color: #64748b;
}
.fx-certlist-meta strong {
  color: #0f172a;
}
.fx-certlist-clear {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: #d95300;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.fx-certlist-clear:hover {
  background: #fff7ed;
}

/* Grid of certificates */
.fx-certlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Card */
.fx-certlist-card {
  display: block;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  position: relative;
  overflow: hidden;
}
.fx-certlist-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, #d95300, #b54400);
}
.fx-certlist-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(217, 83, 0, 0.12);
  border-color: #fed7aa;
}

.fx-certlist-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff7ed;
  color: #d95300;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 16px;
}

.fx-certlist-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.35;
}
.fx-certlist-card-exam {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 14px;
  line-height: 1.4;
}

.fx-certlist-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.78rem;
  color: #64748b;
}
.fx-certlist-card-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fx-certlist-card-meta-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-certlist-card-meta-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.fx-certlist-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  color: #d95300;
  font-size: 0.85rem;
  font-weight: 700;
}

/* Empty states */
.fx-certlist-empty {
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
  padding: 60px 24px;
  text-align: center;
}
.fx-certlist-empty-icon {
  font-size: 2.6rem;
  opacity: 0.4;
  margin-bottom: 12px;
}
.fx-certlist-empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}
.fx-certlist-empty-sub {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.55;
  margin: 0 0 20px;
  max-width: 460px;
  margin-left: auto;
  margin-right: auto;
}
.fx-certlist-empty-btn {
  display: inline-block;
  padding: 11px 22px;
  background: #d95300;
  color: #ffffff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
  transition: all 0.15s ease;
}
.fx-certlist-empty-btn:hover {
  background: #b54400;
  transform: translateY(-1px);
}

/* Loading */
.fx-certlist-loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .fx-certlist-title { font-size: 1.6rem; }
  .fx-certlist-grid { grid-template-columns: 1fr; }
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

export const CertificatesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await api.getCertificatesForUser(user!.id);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      setCertificates(res.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const c of certificates) {
      try {
        set.add(new Date(c.issuedAt).getFullYear());
      } catch {
        // ignore invalid dates
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [certificates]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return certificates.filter((c) => {
      if (filterYear) {
        const year = new Date(c.issuedAt).getFullYear();
        if (String(year) !== filterYear) return false;
      }
      if (q) {
        const haystack = `${c.courseTitle} ${c.examTitle} ${c.certificateNumber}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [certificates, filterYear, searchQuery]);

  const hasActiveFilters = Boolean(filterYear || searchQuery);

  const clearFilters = () => {
    setFilterYear('');
    setSearchQuery('');
  };

  // Stats
  const thisYear = new Date().getFullYear();
  const certificatesThisYear = certificates.filter((c) => {
    try {
      return new Date(c.issuedAt).getFullYear() === thisYear;
    } catch {
      return false;
    }
  }).length;

  const averageScore = certificates.length > 0
    ? Math.round(
        certificates.reduce((sum, c) => sum + c.scorePercent, 0) /
          certificates.length,
      )
    : 0;

  // ---------------------------------------------------------------------------
  // Loading / error / empty
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="fx-certlist-page">
        <style>{pageCss}</style>
        <div className="fx-certlist-inner">
          <div className="fx-certlist-loading">Loading your certificates…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-certlist-page">
        <style>{pageCss}</style>
        <div className="fx-certlist-inner">
          <div className="fx-certlist-empty">
            <div className="fx-certlist-empty-icon" aria-hidden="true">⚠</div>
            <h2 className="fx-certlist-empty-title">Could not load certificates</h2>
            <p className="fx-certlist-empty-sub">{error}</p>
            <button
              type="button"
              className="fx-certlist-empty-btn"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to dashboard
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
    <div className="fx-certlist-page">
      <style>{pageCss}</style>

      <div className="fx-certlist-inner">
        {/* Header */}
        <div className="fx-certlist-header">
          <div>
            <div className="fx-certlist-eyebrow">Dashboard · Certificates</div>
            <h1 className="fx-certlist-title">Your certificates</h1>
            <p className="fx-certlist-sub">
              Every certificate you've earned from passing a certification exam.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="fx-certlist-btn"
              onClick={() => navigate('/exam/dashboard')}
            >
              📝 My exams
            </button>
            <button
              type="button"
              className="fx-certlist-btn primary"
              onClick={() => navigate('/dashboard')}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        {certificates.length > 0 && (
          <div className="fx-certlist-stats">
            <div className="fx-certlist-stat">
              <div className="fx-certlist-stat-label">Total certificates</div>
              <div className="fx-certlist-stat-value">{certificates.length}</div>
            </div>
            <div className="fx-certlist-stat">
              <div className="fx-certlist-stat-label">Earned in {thisYear}</div>
              <div className="fx-certlist-stat-value">{certificatesThisYear}</div>
            </div>
            <div className="fx-certlist-stat">
              <div className="fx-certlist-stat-label">Average score</div>
              <div className="fx-certlist-stat-value">{averageScore}%</div>
            </div>
          </div>
        )}

        {/* Empty overall */}
        {certificates.length === 0 ? (
          <div className="fx-certlist-empty">
            <div className="fx-certlist-empty-icon" aria-hidden="true">🏆</div>
            <h2 className="fx-certlist-empty-title">No certificates yet</h2>
            <p className="fx-certlist-empty-sub">
              Pass a certification exam to earn your first certificate. Your
              certificates will appear here permanently once you do.
            </p>
            <button
              type="button"
              className="fx-certlist-empty-btn"
              onClick={() => navigate('/exam/dashboard')}
            >
              View available exams →
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="fx-certlist-filters">
              <div className="fx-certlist-filter-field">
                <label className="fx-certlist-filter-label">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">All years</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-certlist-filter-field">
                <label className="fx-certlist-filter-label">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Course, exam or certificate no…"
                />
              </div>
            </div>

            {/* Meta + clear */}
            <div className="fx-certlist-meta">
              <span>
                Showing <strong>{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'certificate' : 'certificates'}
                {hasActiveFilters && ` of ${certificates.length}`}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="fx-certlist-clear"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* No results after filter */}
            {filtered.length === 0 ? (
              <div className="fx-certlist-empty">
                <div className="fx-certlist-empty-icon" aria-hidden="true">🔍</div>
                <h2 className="fx-certlist-empty-title">
                  No certificates match
                </h2>
                <p className="fx-certlist-empty-sub">
                  Try adjusting or clearing the filters.
                </p>
                <button
                  type="button"
                  className="fx-certlist-empty-btn"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="fx-certlist-grid">
                {filtered.map((cert) => (
                  <a
                    key={cert.id}
                    href={`/dashboard/certificates/${cert.id}`}
                    className="fx-certlist-card"
                  >
                    <div className="fx-certlist-icon" aria-hidden="true">🏆</div>
                    <h3 className="fx-certlist-card-title">
                      {cert.courseTitle}
                    </h3>
                    <p className="fx-certlist-card-exam">{cert.examTitle}</p>

                    <div className="fx-certlist-card-meta">
                      <div className="fx-certlist-card-meta-item">
                        <span className="fx-certlist-card-meta-label">
                          Score
                        </span>
                        <span className="fx-certlist-card-meta-value">
                          {cert.scorePercent}%
                        </span>
                      </div>
                      <div className="fx-certlist-card-meta-item">
                        <span className="fx-certlist-card-meta-label">
                          Issued
                        </span>
                        <span className="fx-certlist-card-meta-value">
                          {formatDate(cert.issuedAt)}
                        </span>
                      </div>
                      <div className="fx-certlist-card-meta-item">
                        <span className="fx-certlist-card-meta-label">
                          Cert. No.
                        </span>
                        <span className="fx-certlist-card-meta-value">
                          {cert.certificateNumber}
                        </span>
                      </div>
                    </div>

                    <span className="fx-certlist-card-cta">
                      View certificate →
                    </span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};