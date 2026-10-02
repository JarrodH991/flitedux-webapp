// ============================================================================
// src/pages/exam/admin/Analytics.tsx
//
// Analytics dashboard for the exam system.
//
// Aggregates attempt data into insights:
//   - Pass rates and average scores per exam
//   - Attempt volume over time
//   - Per-question performance (difficulty index)
//   - Questions candidates flag excessively (potential issues)
//
// All the data comes from devAttempts. As real attempts come in, the
// numbers update automatically.
//
// 🔌 AWS: Aggregations run in a Lambda on a schedule (EventBridge → Lambda
//         → DynamoDB aggregate table). The dashboard reads pre-computed
//         aggregates so it doesn't scan the entire attempts table on
//         every load. For now, we compute in the browser.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/authHooks';
import { useIsAuthenticated } from '../../../context/authHooks';
import * as api from '../../../services/api';

import type { Attempt, Exam, Question } from '../../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-an-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-an-inner { max-width: 1280px; margin: 0 auto; }

.fx-an-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-an-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-an-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.fx-an-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
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
.fx-an-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.fx-an-kpi {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-an-kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}
.fx-an-kpi-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.fx-an-kpi-value.pass { color: #16a34a; }
.fx-an-kpi-value.fail { color: #dc2626; }
.fx-an-kpi-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 6px;
}

/* Filters */
.fx-an-filters {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.fx-an-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-an-filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-an-filter-field select {
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
.fx-an-filter-field select:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}

/* Section */
.fx-an-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.fx-an-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.fx-an-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.fx-an-section-sub {
  font-size: 0.82rem;
  color: #94a3b8;
}

/* Bar chart */
.fx-an-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
  padding: 8px 4px 0;
  border-bottom: 1px solid #f1f5f9;
  overflow-x: auto;
}
.fx-an-bar-wrap {
  flex: 1;
  min-width: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  height: 100%;
}
.fx-an-bar {
  width: 100%;
  background: linear-gradient(180deg, #d95300, #b54400);
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease-out;
  min-height: 2px;
}
.fx-an-bar-label {
  font-size: 0.62rem;
  color: #94a3b8;
  white-space: nowrap;
  margin-top: 4px;
}

/* Table */
.fx-an-table-wrap {
  overflow-x: auto;
  margin: 0 -8px;
  padding: 0 8px;
}
.fx-an-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.fx-an-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.fx-an-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.fx-an-table tr:last-child td { border-bottom: none; }
.fx-an-table tr:hover td { background: #fafafa; }

.fx-an-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.fx-an-table .stem {
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-weight: 500;
}

.fx-an-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.fx-an-badge.pass { background: #dcfce7; color: #166534; }
.fx-an-badge.warn { background: #fef3c7; color: #92400e; }
.fx-an-badge.fail { background: #fee2e2; color: #991b1b; }
.fx-an-badge.info { background: #dbeafe; color: #1e40af; }

/* Difficulty bar in table */
.fx-an-diff {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}
.fx-an-diff-track {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.fx-an-diff-fill {
  height: 100%;
  border-radius: 3px;
}
.fx-an-diff-fill.good { background: #22c55e; }
.fx-an-diff-fill.mid { background: #f59e0b; }
.fx-an-diff-fill.bad { background: #dc2626; }
.fx-an-diff-value {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  min-width: 42px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Empty */
.fx-empty {
  padding: 40px 20px;
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
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

type DateRange = '7d' | '30d' | '90d' | 'all';
type AttemptFilter = 'all' | 'passed' | 'failed';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function filterByDate(attempts: Attempt[], range: DateRange): Attempt[] {
  if (range === 'all') return attempts;
  const cutoff =
    range === '7d' ? daysAgo(7) : range === '30d' ? daysAgo(30) : daysAgo(90);
  return attempts.filter((a) => new Date(a.startedAt) >= cutoff);
}

function formatPercent(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

/**
 * Difficulty index for a question. P is the proportion of correct answers.
 *   0.9 – 1.0 → "too easy"
 *   0.7 – 0.9 → "easy"
 *   0.4 – 0.7 → "ideal"
 *   0.2 – 0.4 → "hard"
 *   0.0 – 0.2 → "too hard"
 */
function difficultyLabel(p: number): { label: string; color: 'good' | 'mid' | 'bad' } {
  if (p >= 0.9) return { label: 'Too easy', color: 'mid' };
  if (p >= 0.7) return { label: 'Easy', color: 'good' };
  if (p >= 0.4) return { label: 'Ideal', color: 'good' };
  if (p >= 0.2) return { label: 'Hard', color: 'mid' };
  return { label: 'Too hard', color: 'bad' };
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const isAuth = useIsAuthenticated();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterExam, setFilterExam] = useState<string>('');
  const [filterDate, setFilterDate] = useState<DateRange>('all');
  const [filterOutcome, setFilterOutcome] = useState<AttemptFilter>('all');

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [examsRes, questionsRes] = await Promise.all([
        api.listExams({}),
        api.listQuestions({ pageSize: 1000 }),
      ]);

      if (cancelled) return;

      if (examsRes.ok) setExams(examsRes.data);
      if (questionsRes.ok) setQuestions(questionsRes.data.items);

      // Fetch attempts for each exam (they're already keyed by exam in the
      // mock, but in production you'd have a single aggregated endpoint).
      const allAttempts: Attempt[] = [];
      if (examsRes.ok) {
        await Promise.all(
          examsRes.data.map(async (e) => {
            const aRes = await api.getExamAttempts(e.id);
            if (aRes.ok) allAttempts.push(...aRes.data);
          }),
        );
      }

      if (cancelled) return;
      setAttempts(allAttempts);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [isAuth]);

  // -------------------------------------------------------------------------
  // Filtered attempts
  // -------------------------------------------------------------------------
  const filteredAttempts = useMemo(() => {
    let list = attempts;
    if (filterExam) list = list.filter((a) => a.examId === filterExam);
    list = filterByDate(list, filterDate);
    if (filterOutcome === 'passed') list = list.filter((a) => a.passed === true);
    if (filterOutcome === 'failed') list = list.filter((a) => a.passed === false);
    return list;
  }, [attempts, filterExam, filterDate, filterOutcome]);

  // -------------------------------------------------------------------------
  // KPIs
  // -------------------------------------------------------------------------
  const kpis = useMemo(() => {
    const completed = filteredAttempts.filter(
      (a) =>
        a.status === 'submitted' ||
        a.status === 'auto-submitted' ||
        a.status === 'invalidated',
    );
    const passed = completed.filter((a) => a.passed === true);
    const scored = completed.filter(
      (a) => typeof a.scorePercent === 'number',
    );
    const avgScore =
      scored.length > 0
        ? scored.reduce((s, a) => s + (a.scorePercent ?? 0), 0) / scored.length
        : 0;
    const flagged = filteredAttempts.filter(
      (a) => a.proctorEventCount > 0,
    ).length;

    return {
      totalAttempts: completed.length,
      passRate: completed.length > 0 ? passed.length / completed.length : 0,
      passCount: passed.length,
      avgScore,
      flaggedAttempts: flagged,
    };
  }, [filteredAttempts]);

  // -------------------------------------------------------------------------
  // Attempt trend (last 30 days, or all if date range is longer)
  // -------------------------------------------------------------------------
  const trendData = useMemo(() => {
    const days = filterDate === '7d' ? 7 : filterDate === '30d' ? 30 : 30;
    const buckets: { date: Date; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      buckets.push({ date: daysAgo(i), count: 0 });
    }

    for (const a of filteredAttempts) {
      const started = new Date(a.startedAt);
      started.setHours(0, 0, 0, 0);
      const bucket = buckets.find(
        (b) => b.date.getTime() === started.getTime(),
      );
      if (bucket) bucket.count += 1;
    }

    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    return { buckets, maxCount };
  }, [filteredAttempts, filterDate]);

  // -------------------------------------------------------------------------
  // Per-exam breakdown
  // -------------------------------------------------------------------------
  const examStats = useMemo(() => {
    const map = new Map<
      string,
      {
        examId: string;
        attempts: number;
        passed: number;
        failed: number;
        invalidated: number;
        totalScore: number;
        scoredCount: number;
      }
    >();

    for (const a of filteredAttempts) {
      const existing = map.get(a.examId) ?? {
        examId: a.examId,
        attempts: 0,
        passed: 0,
        failed: 0,
        invalidated: 0,
        totalScore: 0,
        scoredCount: 0,
      };
      existing.attempts += 1;
      if (a.status === 'invalidated') existing.invalidated += 1;
      else if (a.passed === true) existing.passed += 1;
      else if (a.passed === false) existing.failed += 1;
      if (typeof a.scorePercent === 'number') {
        existing.totalScore += a.scorePercent;
        existing.scoredCount += 1;
      }
      map.set(a.examId, existing);
    }

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        avgScore:
          row.scoredCount > 0 ? row.totalScore / row.scoredCount : 0,
        passRate: row.attempts > 0 ? row.passed / row.attempts : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [filteredAttempts]);

  // -------------------------------------------------------------------------
  // Per-question performance
  // -------------------------------------------------------------------------
  const questionStats = useMemo(() => {
    const map = new Map<
      string,
      {
        questionId: string;
        shown: number;
        correct: number;
        flagged: number;
      }
    >();

    for (const a of filteredAttempts) {
      if (a.status === 'in-progress') continue;
      for (const qId of a.questionIds) {
        const answer = a.answers[qId];
        const question = questions.find((q) => q.id === qId);
        if (!question) continue;

        const entry = map.get(qId) ?? {
          questionId: qId,
          shown: 0,
          correct: 0,
          flagged: 0,
        };

        entry.shown += 1;
        if (answer?.flaggedForReview) entry.flagged += 1;

        // Determine if the answer was correct
        const correctIds = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id)
          .sort();
        const selected = (answer?.selectedOptionIds ?? []).slice().sort();
        const isCorrect =
          correctIds.length === selected.length &&
          correctIds.every((id, i) => id === selected[i]);

        if (isCorrect) entry.correct += 1;

        map.set(qId, entry);
      }
    }

    return Array.from(map.values())
      .filter((row) => row.shown > 0)
      .map((row) => ({
        ...row,
        p: row.correct / row.shown,
      }))
      .sort((a, b) => a.p - b.p); // worst-performing first
  }, [filteredAttempts, questions]);

  // -------------------------------------------------------------------------
  // Lookups
  // -------------------------------------------------------------------------
  const examById = useMemo(() => {
    const m: Record<string, Exam> = {};
    for (const e of exams) m[e.id] = e;
    return m;
  }, [exams]);

  // -------------------------------------------------------------------------
  // CSV export
  // -------------------------------------------------------------------------
  const exportQuestionsCsv = () => {
    const rows = [
      ['Question ID', 'Stem', 'Times Shown', 'Correct', '% Correct', 'Flagged'],
      ...questionStats.map((row) => {
        const q = questions.find((x) => x.id === row.questionId);
        const stem = (q?.stem ?? '').replace(/"/g, '""').replace(/\n/g, ' ');
        return [
          row.questionId,
          `"${stem}"`,
          String(row.shown),
          String(row.correct),
          formatPercent(row.p),
          String(row.flagged),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    downloadCsv(csv, `question-analytics-${Date.now()}.csv`);
  };

  const exportExamCsv = () => {
    const rows = [
      ['Exam ID', 'Title', 'Attempts', 'Passed', 'Failed', 'Invalidated', 'Pass Rate', 'Avg Score'],
      ...examStats.map((row) => {
        const exam = examById[row.examId];
        return [
          row.examId,
          `"${(exam?.title ?? '').replace(/"/g, '""')}"`,
          String(row.attempts),
          String(row.passed),
          String(row.failed),
          String(row.invalidated),
          formatPercent(row.passRate),
          formatPercent(row.avgScore),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    downloadCsv(csv, `exam-analytics-${Date.now()}.csv`);
  };

  // -------------------------------------------------------------------------
  // Guard
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-an-page">
        <style>{pageCss}</style>
        <div className="fx-an-inner">
          <div className="fx-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-an-page">
      <style>{pageCss}</style>

      <div className="fx-an-inner">
        {/* Header */}
        <div className="fx-an-header">
          <div>
            <div className="fx-an-eyebrow">Admin · Exam System</div>
            <h1 className="fx-an-title">Analytics</h1>
            <p className="fx-an-sub">
              Performance insights across all exams, candidates, and
              questions. Use this to spot question problems, failing exams,
              and trending pass rates.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="fx-btn secondary"
              onClick={exportExamCsv}
              disabled={examStats.length === 0}
            >
              Export exam CSV
            </button>
            <button
              type="button"
              className="fx-btn secondary"
              onClick={exportQuestionsCsv}
              disabled={questionStats.length === 0}
            >
              Export questions CSV
            </button>
          </div>
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
        {loading && <div className="fx-loading">Loading analytics…</div>}

        {!loading && (
          <>
            {/* ======================= FILTERS ======================= */}
            <div className="fx-an-filters">
              <div className="fx-an-filter-field">
                <label className="fx-an-filter-label">Exam</label>
                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                >
                  <option value="">All exams</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-an-filter-field">
                <label className="fx-an-filter-label">Time range</label>
                <select
                  value={filterDate}
                  onChange={(e) =>
                    setFilterDate(e.target.value as DateRange)
                  }
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="fx-an-filter-field">
                <label className="fx-an-filter-label">Outcome</label>
                <select
                  value={filterOutcome}
                  onChange={(e) =>
                    setFilterOutcome(e.target.value as AttemptFilter)
                  }
                >
                  <option value="all">All attempts</option>
                  <option value="passed">Only passed</option>
                  <option value="failed">Only failed</option>
                </select>
              </div>
            </div>

            {/* ======================= KPIs ======================= */}
            <div className="fx-an-kpi-grid">
              <div className="fx-an-kpi">
                <div className="fx-an-kpi-label">Total attempts</div>
                <div className="fx-an-kpi-value">{kpis.totalAttempts}</div>
                <div className="fx-an-kpi-sub">
                  Filtered from {attempts.length} total
                </div>
              </div>

              <div className="fx-an-kpi">
                <div className="fx-an-kpi-label">Pass rate</div>
                <div
                  className={`fx-an-kpi-value${
                    kpis.passRate >= 0.7 ? ' pass' : ' fail'
                  }`}
                >
                  {formatPercent(kpis.passRate * 100)}
                </div>
                <div className="fx-an-kpi-sub">
                  {kpis.passCount} passed
                </div>
              </div>

              <div className="fx-an-kpi">
                <div className="fx-an-kpi-label">Average score</div>
                <div className="fx-an-kpi-value">
                  {formatPercent(kpis.avgScore)}
                </div>
                <div className="fx-an-kpi-sub">Across all completed attempts</div>
              </div>

              <div className="fx-an-kpi">
                <div className="fx-an-kpi-label">Flagged attempts</div>
                <div className="fx-an-kpi-value">{kpis.flaggedAttempts}</div>
                <div className="fx-an-kpi-sub">
                  Attempts with proctoring events
                </div>
              </div>
            </div>

            {/* ======================= TREND ======================= */}
            <div className="fx-an-section">
              <div className="fx-an-section-head">
                <h2 className="fx-an-section-title">Attempt volume</h2>
                <div className="fx-an-section-sub">
                  Daily attempts over the selected period
                </div>
              </div>
              {filteredAttempts.length === 0 ? (
                <div className="fx-empty">No attempts in the selected range.</div>
              ) : (
                <div className="fx-an-chart">
                  {trendData.buckets.map((b, i) => {
                    const heightPct =
                      (b.count / trendData.maxCount) * 100;
                    const showLabel =
                      i % Math.ceil(trendData.buckets.length / 8) === 0;
                    return (
                      <div
                        key={i}
                        className="fx-an-bar-wrap"
                        title={`${b.date.toLocaleDateString()}: ${b.count} attempts`}
                      >
                        <div
                          className="fx-an-bar"
                          style={{ height: `${heightPct}%` }}
                        />
                        {showLabel && (
                          <div className="fx-an-bar-label">
                            {b.date.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ======================= PER-EXAM ======================= */}
            <div className="fx-an-section">
              <div className="fx-an-section-head">
                <h2 className="fx-an-section-title">Performance by exam</h2>
                <div className="fx-an-section-sub">
                  {examStats.length} exam
                  {examStats.length === 1 ? '' : 's'} with attempts
                </div>
              </div>
              {examStats.length === 0 ? (
                <div className="fx-empty">
                  No exam attempts in the selected range.
                </div>
              ) : (
                <div className="fx-an-table-wrap">
                  <table className="fx-an-table">
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th className="num">Attempts</th>
                        <th className="num">Passed</th>
                        <th className="num">Failed</th>
                        <th className="num">Invalidated</th>
                        <th className="num">Pass rate</th>
                        <th className="num">Avg score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examStats.map((row) => {
                        const exam = examById[row.examId];
                        const passRatePct = row.passRate * 100;
                        const rateBadge =
                          passRatePct >= 70
                            ? 'pass'
                            : passRatePct >= 50
                              ? 'warn'
                              : 'fail';
                        return (
                          <tr key={row.examId}>
                            <td>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  maxWidth: 300,
                                }}
                              >
                                {exam?.title ?? row.examId}
                              </div>
                            </td>
                            <td className="num">{row.attempts}</td>
                            <td className="num" style={{ color: '#16a34a', fontWeight: 600 }}>
                              {row.passed}
                            </td>
                            <td className="num" style={{ color: '#dc2626', fontWeight: 600 }}>
                              {row.failed}
                            </td>
                            <td className="num" style={{ color: '#64748b' }}>
                              {row.invalidated}
                            </td>
                            <td className="num">
                              <span className={`fx-an-badge ${rateBadge}`}>
                                {formatPercent(passRatePct)}
                              </span>
                            </td>
                            <td className="num">
                              {formatPercent(row.avgScore)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ======================= PER-QUESTION ======================= */}
            <div className="fx-an-section">
              <div className="fx-an-section-head">
                <h2 className="fx-an-section-title">
                  Question performance
                </h2>
                <div className="fx-an-section-sub">
                  Sorted by lowest correctness — the questions candidates
                  struggle with most appear first
                </div>
              </div>

              {questionStats.length === 0 ? (
                <div className="fx-empty">
                  No questions have been shown yet in the selected range.
                </div>
              ) : (
                <div className="fx-an-table-wrap">
                  <table className="fx-an-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th className="num">Shown</th>
                        <th className="num">Correct</th>
                        <th>% Correct</th>
                        <th>Flagged</th>
                        <th>Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionStats.map((row) => {
                        const q = questions.find((x) => x.id === row.questionId);
                        const pct = row.p * 100;
                        const diff = difficultyLabel(row.p);
                        const flagRate = row.shown > 0 ? row.flagged / row.shown : 0;

                        return (
                          <tr key={row.questionId}>
                            <td>
                              <div className="stem" title={q?.stem ?? ''}>
                                {q?.stem ?? row.questionId}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#94a3b8',
                                  marginTop: 2,
                                }}
                              >
                                {q?.moduleId ?? ''} · {q?.difficulty ?? ''}
                              </div>
                            </td>
                            <td className="num">{row.shown}</td>
                            <td className="num">{row.correct}</td>
                            <td style={{ minWidth: 140 }}>
                              <div className="fx-an-diff">
                                <div className="fx-an-diff-track">
                                  <div
                                    className={`fx-an-diff-fill ${diff.color}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="fx-an-diff-value">
                                  {formatPercent(pct)}
                                </div>
                              </div>
                            </td>
                            <td>
                              {row.flagged > 0 ? (
                                <span
                                  className={`fx-an-badge ${
                                    flagRate >= 0.3 ? 'fail' : 'warn'
                                  }`}
                                >
                                  {row.flagged} ({formatPercent(flagRate * 100)})
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </td>
                            <td>
                              <span className={`fx-an-badge ${diff.color === 'good' ? 'pass' : diff.color === 'mid' ? 'warn' : 'fail'}`}>
                                {diff.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
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