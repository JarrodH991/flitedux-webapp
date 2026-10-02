// ============================================================================
// src/pages/exam/admin/AuditLog.tsx
//
// Regulatory audit log viewer.
//
// Every sensitive action in the system writes an audit entry. This page
// displays them in a searchable, filterable, exportable form.
//
// Why it exists: aviation authorities (SACAA, ICAO, IATA) require a
// complete, immutable trail of who did what and when, especially for:
//   - Question changes (a question's answer key must be provably
//     unchanged since the attempt was scored)
//   - Exam rule changes (the rules in effect at attempt time)
//   - Attempt submissions and invalidations
//   - Data exports
//
// 🔌 AWS: DynamoDB `audit_log` with an append-only IAM policy.
//         PK: actorId, SK: timestamp (for actor-scoped queries)
//         GSI: entityType-index, action-index, timestamp-index
//
//         Optionally replicate to S3 with Object Lock for compliance
//         retention (7+ years for aviation records).
//
//         CloudTrail is a separate, complementary trail for AWS API calls
//         (who called which Lambda, who read which S3 object, etc).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/authHooks';
import { useIsAuthenticated } from '../../../context/authHooks';
import * as api from '../../../services/api';

import type { AuditEntry, AuditAction } from '../../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-al-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-al-inner { max-width: 1400px; margin: 0 auto; }

.fx-al-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-al-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-al-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.fx-al-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
  max-width: 720px;
}

/* Buttons */
.fx-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  background: #ffffff;
  color: #334155;
}
.fx-btn.primary {
  background: #d95300;
  color: #fff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-btn.primary:hover:not(:disabled) {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
}
.fx-btn.secondary { border-color: #cbd5e1; }
.fx-btn.secondary:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
}
.fx-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* KPI grid */
.fx-al-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.fx-al-kpi {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-al-kpi-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-al-kpi-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  word-break: break-word;
}
.fx-al-kpi-value.small {
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

/* Filters */
.fx-al-filters {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.fx-al-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-al-filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-al-filter-field select,
.fx-al-filter-field input {
  padding: 9px 11px;
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
.fx-al-filter-field select:focus,
.fx-al-filter-field input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}

/* Results head */
.fx-al-results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 0 4px;
}
.fx-al-results-count {
  font-size: 0.88rem;
  color: #64748b;
}
.fx-al-results-count strong { color: #0f172a; }
.fx-al-clear-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: #d95300;
  cursor: pointer;
  padding: 4px 8px;
}
.fx-al-clear-btn:hover { text-decoration: underline; }

/* Table */
.fx-al-table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-al-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.fx-al-table th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.fx-al-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: top;
}
.fx-al-table tr {
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.fx-al-table tr:hover td { background: #fafafa; }
.fx-al-table tr:last-child td { border-bottom: none; }

.fx-al-time {
  white-space: nowrap;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.78rem;
  color: #64748b;
}
.fx-al-actor {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
}
.fx-al-actor-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.85rem;
}
.fx-al-actor-email {
  font-size: 0.72rem;
  color: #94a3b8;
}

.fx-al-action {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}
.fx-al-action.cat-auth { background: #dbeafe; color: #1e40af; }
.fx-al-action.cat-exam { background: #fff7ed; color: #d95300; }
.fx-al-action.cat-question { background: #dcfce7; color: #166534; }
.fx-al-action.cat-attempt { background: #f3e8ff; color: #6b21a8; }
.fx-al-action.cat-subject { background: #fef3c7; color: #92400e; }

.fx-al-entity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fx-al-entity-type {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-al-entity-id {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.78rem;
  color: #475569;
  word-break: break-all;
}

.fx-al-meta-preview {
  font-size: 0.78rem;
  color: #94a3b8;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

/* Empty */
.fx-empty {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
}

.fx-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Modal */
.fx-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(3px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: fxAlFadeIn 0.2s ease-out both;
}
@keyframes fxAlFadeIn { from { opacity: 0; } to { opacity: 1; } }
.fx-modal {
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
  animation: fxAlModalIn 0.25s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxAlModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.fx-modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 18px;
}

.fx-modal-field {
  margin-bottom: 16px;
}
.fx-modal-field-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}
.fx-modal-field-value {
  font-size: 0.92rem;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}
.fx-modal-field-value.mono {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.82rem;
  color: #475569;
}

.fx-modal-code {
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
  margin-top: 6px;
}

.fx-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

type DateRange = '1d' | '7d' | '30d' | '90d' | 'all';

/**
 * Category prefix of an audit action, used for badge colouring.
 */
function actionCategory(action: AuditAction): string {
  if (action.startsWith('user.')) return 'cat-auth';
  if (action.startsWith('exam.')) return 'cat-exam';
  if (action.startsWith('question.')) return 'cat-question';
  if (action.startsWith('attempt.')) return 'cat-attempt';
  if (action.startsWith('subject.')) return 'cat-subject';
  return '';
}

function actionLabel(action: string): string {
  // "user.login" → "User · Login"
  const [a, b] = action.split('.');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(a)} · ${cap(b)}`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function filterByDate(entries: AuditEntry[], range: DateRange): AuditEntry[] {
  if (range === 'all') return entries;
  const days =
    range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = daysAgo(days);
  return entries.filter((e) => new Date(e.timestamp) >= cutoff);
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const AuditLog: React.FC = () => {
  const { user } = useAuth();
  const isAuth = useIsAuthenticated();

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState<DateRange>('30d');
  const [filterActor, setFilterActor] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterEntityId, setFilterEntityId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Detail modal
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // -------------------------------------------------------------------------
  // Load audit entries
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await api.listAuditEntries({
        page: 1,
        pageSize: 500,
      });

      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      setEntries(res.data.items);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [isAuth]);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const uniqueActors = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) m.set(e.actorId, e.actorEmail);
    return Array.from(m.entries()).map(([id, email]) => ({ id, email }));
  }, [entries]);

  const uniqueActions = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(e.action);
    return Array.from(s).sort();
  }, [entries]);

  const uniqueEntityTypes = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(e.entityType);
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let list = filterByDate(entries, filterDate);
    if (filterActor) list = list.filter((e) => e.actorId === filterActor);
    if (filterAction) list = list.filter((e) => e.action === filterAction);
    if (filterEntityType)
      list = list.filter((e) => e.entityType === filterEntityType);
    if (filterEntityId)
      list = list.filter((e) =>
        e.entityId.toLowerCase().includes(filterEntityId.toLowerCase()),
      );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.actorEmail.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.entityId.toLowerCase().includes(q) ||
          JSON.stringify(e.metadata ?? {}).toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
  }, [
    entries,
    filterDate,
    filterActor,
    filterAction,
    filterEntityType,
    filterEntityId,
    searchQuery,
  ]);

  const stats = useMemo(() => {
    const totalInRange = filtered.length;
    const actorsInRange = new Set(filtered.map((e) => e.actorId)).size;

    // Most common action
    const actionCounts = new Map<string, number>();
    for (const e of filtered) {
      actionCounts.set(e.action, (actionCounts.get(e.action) ?? 0) + 1);
    }
    let topAction = '—';
    let topCount = 0;
    for (const [action, count] of actionCounts.entries()) {
      if (count > topCount) {
        topAction = action;
        topCount = count;
      }
    }

    return { totalInRange, actorsInRange, topAction, topCount };
  }, [filtered]);

  const hasActiveFilters =
    filterActor ||
    filterAction ||
    filterEntityType ||
    filterEntityId ||
    searchQuery ||
    filterDate !== '30d';

  const clearFilters = () => {
    setFilterDate('30d');
    setFilterActor('');
    setFilterAction('');
    setFilterEntityType('');
    setFilterEntityId('');
    setSearchQuery('');
  };

  // -------------------------------------------------------------------------
  // CSV export
  // -------------------------------------------------------------------------
  const exportCsv = () => {
    const rows = [
      [
        'Timestamp',
        'Actor ID',
        'Actor Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'Metadata',
      ],
      ...filtered.map((e) => [
        e.timestamp,
        e.actorId,
        e.actorEmail,
        e.action,
        e.entityType,
        e.entityId,
        e.ipAddress ?? '',
        `"${JSON.stringify(e.metadata ?? {}).replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    downloadCsv(csv, `audit-log-${Date.now()}.csv`);
  };

  // -------------------------------------------------------------------------
  // Guard
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-al-page">
        <style>{pageCss}</style>
        <div className="fx-al-inner">
          <div className="fx-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-al-page">
      <style>{pageCss}</style>

      <div className="fx-al-inner">
        {/* Header */}
        <div className="fx-al-header">
          <div>
            <div className="fx-al-eyebrow">Admin · Compliance</div>
            <h1 className="fx-al-title">Audit Log</h1>
            <p className="fx-al-sub">
              An immutable record of every sensitive action in the system —
              who did what, when, and to which entity. Use this for internal
              review and for regulatory submissions to aviation authorities.
            </p>
          </div>
          <button
            type="button"
            className="fx-btn secondary"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 10,
              fontSize: '0.88rem',
              marginBottom: 20,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="fx-loading">Loading audit entries…</div>}

        {!loading && (
          <>
            {/* ====================== KPIs ====================== */}
            <div className="fx-al-kpi-grid">
              <div className="fx-al-kpi">
                <div className="fx-al-kpi-label">Total entries</div>
                <div className="fx-al-kpi-value">{entries.length}</div>
              </div>
              <div className="fx-al-kpi">
                <div className="fx-al-kpi-label">In selected range</div>
                <div className="fx-al-kpi-value">{stats.totalInRange}</div>
              </div>
              <div className="fx-al-kpi">
                <div className="fx-al-kpi-label">Unique actors</div>
                <div className="fx-al-kpi-value">{stats.actorsInRange}</div>
              </div>
              <div className="fx-al-kpi">
                <div className="fx-al-kpi-label">Most common action</div>
                <div className="fx-al-kpi-value small">
                  {stats.topAction}
                  {stats.topCount > 0 && (
                    <span style={{ color: '#94a3b8', marginLeft: 6 }}>
                      × {stats.topCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ====================== FILTERS ====================== */}
            <div className="fx-al-filters">
              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Date range</label>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value as DateRange)}
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Actor</label>
                <select
                  value={filterActor}
                  onChange={(e) => setFilterActor(e.target.value)}
                >
                  <option value="">All actors</option>
                  {uniqueActors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Action</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="">All actions</option>
                  {uniqueActions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Entity type</label>
                <select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                >
                  <option value="">All entities</option>
                  {uniqueEntityTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Entity ID</label>
                <input
                  type="text"
                  value={filterEntityId}
                  onChange={(e) => setFilterEntityId(e.target.value)}
                  placeholder="Search by ID…"
                />
              </div>

              <div className="fx-al-filter-field">
                <label className="fx-al-filter-label">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Email, action, metadata…"
                />
              </div>
            </div>

            {/* ====================== RESULTS ====================== */}
            <div className="fx-al-results-head">
              <div className="fx-al-results-count">
                {filtered.length === 0 ? (
                  'No entries match'
                ) : (
                  <>
                    Showing <strong>{filtered.length}</strong>{' '}
                    {filtered.length === 1 ? 'entry' : 'entries'}
                  </>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="fx-al-clear-btn"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="fx-al-table-wrap">
                <div className="fx-empty">
                  {hasActiveFilters
                    ? 'No audit entries match the current filters.'
                    : 'No audit entries recorded yet. As you perform actions in the admin tools, entries will appear here.'}
                </div>
              </div>
            ) : (
              <div className="fx-al-table-wrap">
                <table className="fx-al-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => {
                      const metaPreview =
                        entry.metadata && Object.keys(entry.metadata).length > 0
                          ? JSON.stringify(entry.metadata)
                          : '—';
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          title="Click for full details"
                        >
                          <td>
                            <div className="fx-al-time">
                              {formatTimestamp(entry.timestamp)}
                            </div>
                          </td>
                          <td>
                            <div className="fx-al-actor">
                              <div className="fx-al-actor-name">
                                {entry.actorId}
                              </div>
                              <div className="fx-al-actor-email">
                                {entry.actorEmail}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`fx-al-action ${actionCategory(entry.action)}`}
                            >
                              {entry.action}
                            </span>
                          </td>
                          <td>
                            <div className="fx-al-entity">
                              <div className="fx-al-entity-type">
                                {entry.entityType}
                              </div>
                              <div className="fx-al-entity-id">
                                {entry.entityId}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div
                              className="fx-al-meta-preview"
                              title={metaPreview}
                            >
                              {metaPreview}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================== DETAIL MODAL ====================== */}
      {selectedEntry && (
        <div
          className="fx-modal-backdrop"
          onClick={() => setSelectedEntry(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-al-detail-title"
        >
          <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="fx-al-detail-title" className="fx-modal-title">
              Audit entry detail
            </h2>

            <div className="fx-modal-field">
              <div className="fx-modal-field-label">Entry ID</div>
              <div className="fx-modal-field-value mono">
                {selectedEntry.id}
              </div>
            </div>

            <div className="fx-modal-field">
              <div className="fx-modal-field-label">Timestamp</div>
              <div className="fx-modal-field-value">
                {formatTimestamp(selectedEntry.timestamp)}
              </div>
            </div>

            <div className="fx-modal-field">
              <div className="fx-modal-field-label">Actor</div>
              <div className="fx-modal-field-value">
                {selectedEntry.actorEmail}
              </div>
              <div
                className="fx-modal-field-value mono"
                style={{ marginTop: 4 }}
              >
                {selectedEntry.actorId}
              </div>
            </div>

            <div className="fx-modal-field">
              <div className="fx-modal-field-label">Action</div>
              <div className="fx-modal-field-value">
                <span
                  className={`fx-al-action ${actionCategory(selectedEntry.action)}`}
                >
                  {selectedEntry.action}
                </span>{' '}
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {actionLabel(selectedEntry.action)}
                </span>
              </div>
            </div>

            <div className="fx-modal-field">
              <div className="fx-modal-field-label">Entity</div>
              <div className="fx-modal-field-value">
                {selectedEntry.entityType}
              </div>
              <div
                className="fx-modal-field-value mono"
                style={{ marginTop: 4 }}
              >
                {selectedEntry.entityId}
              </div>
            </div>

            {selectedEntry.ipAddress && (
              <div className="fx-modal-field">
                <div className="fx-modal-field-label">IP address</div>
                <div className="fx-modal-field-value mono">
                  {selectedEntry.ipAddress}
                </div>
              </div>
            )}

            {selectedEntry.userAgent && (
              <div className="fx-modal-field">
                <div className="fx-modal-field-label">User agent</div>
                <div className="fx-modal-field-value mono">
                  {selectedEntry.userAgent}
                </div>
              </div>
            )}

            {selectedEntry.metadata &&
              Object.keys(selectedEntry.metadata).length > 0 && (
                <div className="fx-modal-field">
                  <div className="fx-modal-field-label">Metadata</div>
                  <div className="fx-modal-code">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </div>
                </div>
              )}

            <div className="fx-modal-actions">
              <button
                type="button"
                className="fx-btn secondary"
                onClick={() => setSelectedEntry(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CSV EXPORT HELPER
// ---------------------------------------------------------------------------

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}