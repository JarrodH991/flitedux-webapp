// ============================================================================
// src/pages/exam/admin/ExamBuilder.tsx
//
// Admin tool for creating and editing exam blueprints.
//
// An exam = a subject + rules + a blueprint. The blueprint is the
// interesting part: it says how many questions to draw from each module
// at each difficulty level. Each candidate's attempt draws a fresh,
// randomised set from the question bank based on this blueprint.
//
// 🔌 AWS: Exams live in DynamoDB `exams` (PK: id, GSI: subjectId-index).
//         API Gateway:
//           GET    /exams              → list
//           GET    /exams/{id}         → single
//           POST   /exams              → create
//           PUT    /exams/{id}         → update (bumps version)
//           DELETE /exams/{id}         → soft delete
//
//         When an attempt starts, a Lambda reads the exam, draws questions
//         per the blueprint, and writes an immutable S3 snapshot.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/authHooks';
import { useIsAuthenticated } from '../../../context/authHooks';
import * as api from '../../../services/api';

import type {
  Exam,
  ExamRules,
  ExamBlueprint,
  Subject,
  Module,
  Difficulty,
} from '../../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-eb-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-eb-inner { max-width: 1280px; margin: 0 auto; }

/* Header */
.fx-eb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-eb-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-eb-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.fx-eb-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Layout */
.fx-eb-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 960px) {
  .fx-eb-layout {
    grid-template-columns: 320px minmax(0, 1fr);
    align-items: start;
  }
}

/* Sidebar */
.fx-eb-sidebar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
@media (min-width: 960px) {
  .fx-eb-sidebar { position: sticky; top: 90px; }
}
.fx-eb-sidebar-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 12px;
}

.fx-eb-list { display: grid; gap: 6px; }
.fx-eb-list-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-eb-list-item:hover {
  background: #f8fafc;
}
.fx-eb-list-item.active {
  background: #fff7ed;
  border-color: #d95300;
}
.fx-eb-list-item-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 3px;
  line-height: 1.35;
}
.fx-eb-list-item.active .fx-eb-list-item-title { color: #d95300; }
.fx-eb-list-item-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  display: flex;
  gap: 8px;
}
.fx-eb-list-item.active .fx-eb-list-item-meta { color: #d95300; opacity: 0.75; }

/* Main panel */
.fx-eb-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
@media (max-width: 640px) {
  .fx-eb-panel { padding: 20px; }
}

.fx-eb-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.fx-eb-panel-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}
.fx-eb-panel-sub {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Section */
.fx-eb-section {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.fx-eb-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.fx-eb-section-title {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 14px;
}

/* Form fields */
.fx-field { margin-bottom: 16px; }
.fx-field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}
.fx-field input,
.fx-field textarea,
.fx-field select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #0f172a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  resize: vertical;
}
.fx-field input:focus,
.fx-field textarea:focus,
.fx-field select:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.15);
}
.fx-field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 5px;
  line-height: 1.45;
}
.fx-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 640px) {
  .fx-field-row { grid-template-columns: 1fr; }
}

/* Toggle switch */
.fx-toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f8fafc;
}
.fx-toggle-row:last-child { border-bottom: none; }
.fx-toggle-info { flex: 1; min-width: 0; }
.fx-toggle-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 3px;
}
.fx-toggle-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.45;
  margin: 0;
}
.fx-toggle {
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}
.fx-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.fx-toggle.on {
  background: #d95300;
}
.fx-toggle.on::after {
  transform: translateX(18px);
}

/* Blueprint editor */
.fx-bp {
  display: grid;
  gap: 12px;
}
.fx-bp-module {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
}
.fx-bp-module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.fx-bp-module-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1e293b;
}
.fx-bp-module-avail {
  font-size: 0.72rem;
  color: #94a3b8;
}
.fx-bp-module-avail.warn { color: #dc2626; font-weight: 600; }

.fx-bp-counts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.fx-bp-count {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-bp-count-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-bp-count.easy .fx-bp-count-label { color: #16a34a; }
.fx-bp-count.medium .fx-bp-count-label { color: #d97706; }
.fx-bp-count.hard .fx-bp-count-label { color: #dc2626; }

.fx-bp-count input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #0f172a;
  text-align: center;
  outline: none;
  font-weight: 700;
}
.fx-bp-count input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}
.fx-bp-count input.over {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

/* Summary bar */
.fx-bp-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 0.88rem;
  color: #475569;
  flex-wrap: wrap;
}
.fx-bp-summary.total {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #7c2d12;
}
.fx-bp-summary.warn {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.fx-bp-summary strong { font-size: 1.05rem; }

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
.fx-btn.danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}
.fx-btn.danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}
.fx-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.fx-eb-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

/* Empty state */
.fx-empty {
  padding: 60px 20px;
  text-align: center;
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
}
.fx-empty-icon { font-size: 2.5rem; opacity: 0.4; margin-bottom: 12px; }
.fx-empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.fx-empty-sub {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 20px;
}

.fx-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.fx-inline-error {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 16px;
}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const EMPTY_RULES: ExamRules = {
  timeLimitMinutes: 60,
  allowBackwardNavigation: true,
  allowFlagging: true,
  allowReviewBeforeSubmit: true,
  randomiseQuestionOrder: true,
  randomiseAnswerOrder: true,
  requireRulesAcknowledgment: true,
  integrity: {
    enforceFullscreen: true,
    detectTabSwitch: true,
    maxTabSwitches: 3,
    blockCopyPaste: true,
    blockRightClick: true,
    blockDevTools: false,
    requireWebcam: true,
    requireIdVerification: false,
    requireSystemCheck: false,
  },
  passMarkPercent: 80,
};

interface ExamFormState {
  subjectId: string;
  title: string;
  description: string;
  active: boolean;
  rules: ExamRules;
  blueprint: ExamBlueprint;
}

const EMPTY_FORM: ExamFormState = {
  subjectId: '',
  title: '',
  description: '',
  active: true,
  rules: EMPTY_RULES,
  blueprint: {
    perModule: {},
    totalQuestions: 0,
  },
};

/**
 * Total up the counts in a blueprint to get the number of questions.
 */
function totalQuestions(bp: ExamBlueprint): number {
  let total = 0;
  for (const counts of Object.values(bp.perModule)) {
    total += counts.easy + counts.medium + counts.hard;
  }
  return total;
}

function timeLabel(minutes: number): string {
  if (minutes === 0) return 'No time limit';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const ExamBuilder: React.FC = () => {
  const { user } = useAuth();
  const isAuth = useIsAuthenticated();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modulesBySubject, setModulesBySubject] = useState<Record<string, Module[]>>({});
  const [questionCounts, setQuestionCounts] = useState<
    Record<string, { easy: number; medium: number; hard: number }>
  >({});

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<ExamFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  // -------------------------------------------------------------------------
  // Load reference + exams
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const subjRes = await api.getSubjects();
      if (cancelled || !subjRes.ok) {
        setLoading(false);
        return;
      }
      setSubjects(subjRes.data);

      const moduleMap: Record<string, Module[]> = {};
      const countsMap: Record<
        string,
        { easy: number; medium: number; hard: number }
      > = {};

      await Promise.all(
        subjRes.data.map(async (s) => {
          const mRes = await api.getModules(s.id);
          if (!mRes.ok) return;
          moduleMap[s.id] = mRes.data;

          // For each module, count available questions by difficulty
          await Promise.all(
            mRes.data.map(async (mod) => {
              const qRes = await api.listQuestions({
                moduleId: mod.id,
                pageSize: 500,
              });
              if (!qRes.ok) return;
              const counts = { easy: 0, medium: 0, hard: 0 };
              for (const q of qRes.data.items) {
                counts[q.difficulty] += 1;
              }
              countsMap[mod.id] = counts;
            }),
          );
        }),
      );

      if (cancelled) return;
      setModulesBySubject(moduleMap);
      setQuestionCounts(countsMap);

      const examsRes = await api.listExams({});
      if (cancelled) return;
      if (examsRes.ok) {
        setExams(examsRes.data);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [isAuth]);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.title.localeCompare(b.title);
      }),
    [exams],
  );

  const currentModules = form.subjectId
    ? modulesBySubject[form.subjectId] ?? []
    : [];

  const blueprintTotal = totalQuestions(form.blueprint);
  const blueprintValid = currentModules.length > 0 && blueprintTotal > 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSelect = (exam: Exam) => {
    setSelectedId(exam.id);
    setIsNew(false);
    setForm({
      subjectId: exam.subjectId,
      title: exam.title,
      description: exam.description,
      active: exam.active,
      rules: JSON.parse(JSON.stringify(exam.rules)),
      blueprint: JSON.parse(JSON.stringify(exam.blueprint)),
    });
    setError(null);
  };

  const handleNew = () => {
    const defaultSubject = subjects[0]?.id ?? '';
    const defaultModules = defaultSubject
      ? modulesBySubject[defaultSubject] ?? []
      : [];

    // Seed the blueprint with a 1-easy/1-medium entry for the first module
    const seedBp: Record<string, { easy: number; medium: number; hard: number }> = {};
    if (defaultModules.length > 0) {
      seedBp[defaultModules[0].id] = { easy: 1, medium: 1, hard: 0 };
    }

    setSelectedId(null);
    setIsNew(true);
    setForm({
      ...EMPTY_FORM,
      subjectId: defaultSubject,
      rules: JSON.parse(JSON.stringify(EMPTY_RULES)),
      blueprint: {
        perModule: seedBp,
        totalQuestions: 2,
      },
    });
    setError(null);
  };

  const handleSubjectChange = (newSubjectId: string) => {
    // Reset the blueprint when the subject changes — the modules belong
    // to the old subject and no longer apply.
    const newModules = modulesBySubject[newSubjectId] ?? [];
    const seedBp: Record<string, { easy: number; medium: number; hard: number }> = {};
    if (newModules.length > 0) {
      seedBp[newModules[0].id] = { easy: 1, medium: 1, hard: 0 };
    }
    setForm((f) => ({
      ...f,
      subjectId: newSubjectId,
      blueprint: {
        perModule: seedBp,
        totalQuestions: totalQuestions({ perModule: seedBp, totalQuestions: 0 }),
      },
    }));
  };

  const updateBlueprintCount = (
    moduleId: string,
    difficulty: Difficulty,
    value: number,
  ) => {
    setForm((f) => {
      const current = f.blueprint.perModule[moduleId] ?? {
        easy: 0,
        medium: 0,
        hard: 0,
      };
      const next = {
        ...f.blueprint.perModule,
        [moduleId]: { ...current, [difficulty]: Math.max(0, value) },
      };
      return {
        ...f,
        blueprint: {
          perModule: next,
          totalQuestions: totalQuestions({ perModule: next, totalQuestions: 0 }),
        },
      };
    });
  };

  const updateRule = <K extends keyof ExamRules>(
    key: K,
    value: ExamRules[K],
  ) => {
    setForm((f) => ({
      ...f,
      rules: { ...f.rules, [key]: value },
    }));
  };

  const updateIntegrity = <K extends keyof ExamRules['integrity']>(
    key: K,
    value: ExamRules['integrity'][K],
  ) => {
    setForm((f) => ({
      ...f,
      rules: {
        ...f.rules,
        integrity: { ...f.rules.integrity, [key]: value },
      },
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.subjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!blueprintValid) {
      setError('The blueprint must contain at least one question.');
      return;
    }

    // Validate that no module's count exceeds available questions
    for (const [moduleId, counts] of Object.entries(form.blueprint.perModule)) {
      const available = questionCounts[moduleId] ?? { easy: 0, medium: 0, hard: 0 };
      if (counts.easy > available.easy) {
        setError(`Not enough easy questions in module ${moduleId}.`);
        return;
      }
      if (counts.medium > available.medium) {
        setError(`Not enough medium questions in module ${moduleId}.`);
        return;
      }
      if (counts.hard > available.hard) {
        setError(`Not enough hard questions in module ${moduleId}.`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    const now = new Date().toISOString();

    if (isNew) {
      const newExam: Exam = {
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subjectId: form.subjectId,
        title: form.title,
        description: form.description,
        rules: form.rules,
        blueprint: form.blueprint,
        active: form.active,
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id ?? 'unknown',
      };
      setExams((prev) => [newExam, ...prev]);
      setSelectedId(newExam.id);
      setIsNew(false);
    } else if (selectedId) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === selectedId
            ? {
                ...e,
                subjectId: form.subjectId,
                title: form.title,
                description: form.description,
                rules: form.rules,
                blueprint: form.blueprint,
                active: form.active,
                updatedAt: now,
                version: e.version + 1,
              }
            : e,
        ),
      );
    }

    setSaving(false);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    // 🔌 AWS: DELETE /exams/{id} → soft delete (active = false)
    setExams((prev) =>
      prev.map((e) =>
        e.id === selectedId ? { ...e, active: false } : e,
      ),
    );
    setSelectedId(null);
    setIsNew(false);
    setConfirmDelete(false);
    setForm(EMPTY_FORM);
  };

  // -------------------------------------------------------------------------
  // Guard
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-eb-page">
        <style>{pageCss}</style>
        <div className="fx-eb-inner">
          <div className="fx-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  const showPanel = isNew || selectedId !== null;

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-eb-page">
      <style>{pageCss}</style>

      <div className="fx-eb-inner">
        {/* Header */}
        <div className="fx-eb-header">
          <div>
            <div className="fx-eb-eyebrow">Admin · Exam System</div>
            <h1 className="fx-eb-title">Exam Builder</h1>
            <p className="fx-eb-sub">
              Create exam blueprints. Each blueprint says how many questions
              to draw from each module at each difficulty. Every attempt is
              a fresh randomised draw from the question bank.
            </p>
          </div>
          <button
            type="button"
            className="fx-btn primary"
            onClick={handleNew}
            disabled={subjects.length === 0}
          >
            + New exam
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="fx-inline-error" role="alert">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="fx-loading">Loading exams…</div>}

        {/* Layout */}
        {!loading && (
          <div className="fx-eb-layout">
            {/* ============ SIDEBAR: exam list ============ */}
            <aside className="fx-eb-sidebar">
              <h2 className="fx-eb-sidebar-title">
                Exams ({sortedExams.length})
              </h2>

              {sortedExams.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  No exams yet. Click "+ New exam" to create the first one.
                </p>
              ) : (
                <div className="fx-eb-list">
                  {sortedExams.map((exam) => {
                    const total = totalQuestions(exam.blueprint);
                    const subject = subjects.find(
                      (s) => s.id === exam.subjectId,
                    );
                    const isActive =
                      selectedId === exam.id && !isNew;
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        className={`fx-eb-list-item${isActive ? ' active' : ''}`}
                        onClick={() => handleSelect(exam)}
                      >
                        <div className="fx-eb-list-item-title">
                          {exam.title}
                        </div>
                        <div className="fx-eb-list-item-meta">
                          <span>{subject?.code ?? '—'}</span>
                          <span>·</span>
                          <span>{total} questions</span>
                          <span>·</span>
                          <span>{timeLabel(exam.rules.timeLimitMinutes)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* ============ MAIN PANEL ============ */}
            <div className="fx-eb-panel">
              {!showPanel ? (
                <div className="fx-empty">
                  <div className="fx-empty-icon" aria-hidden="true">
                    🧩
                  </div>
                  <h2 className="fx-empty-title">Select an exam to edit</h2>
                  <p className="fx-empty-sub">
                    Pick an exam from the list on the left, or create a new
                    one.
                  </p>
                  <button
                    type="button"
                    className="fx-btn primary"
                    onClick={handleNew}
                    disabled={subjects.length === 0}
                  >
                    + New exam
                  </button>
                </div>
              ) : (
                <>
                  <div className="fx-eb-panel-head">
                    <div>
                      <h2 className="fx-eb-panel-title">
                        {isNew ? 'New exam' : 'Edit exam'}
                      </h2>
                      <p className="fx-eb-panel-sub">
                        {isNew
                          ? 'Configure the exam details, rules, and blueprint below.'
                          : 'Update the exam settings. Saving will bump the version number.'}
                      </p>
                    </div>
                  </div>

                  {/* ================= BASIC INFO ================= */}
                  <div className="fx-eb-section">
                    <h3 className="fx-eb-section-title">Basic information</h3>

                    <div className="fx-field-row">
                      <div className="fx-field">
                        <label>Subject</label>
                        <select
                          value={form.subjectId}
                          onChange={(e) =>
                            handleSubjectChange(e.target.value)
                          }
                          disabled={saving}
                        >
                          <option value="">Select subject…</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fx-field">
                        <label>Status</label>
                        <select
                          value={form.active ? 'active' : 'inactive'}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              active: e.target.value === 'active',
                            }))
                          }
                          disabled={saving}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="fx-field">
                      <label>Exam title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder="e.g. Dangerous Goods — Initial Certification"
                        disabled={saving}
                      />
                    </div>

                    <div className="fx-field">
                      <label>Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="A short description shown on the dashboard."
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* ================= TIMING + SCORING ================= */}
                  <div className="fx-eb-section">
                    <h3 className="fx-eb-section-title">
                      Timing & scoring
                    </h3>

                    <div className="fx-field-row">
                      <div className="fx-field">
                        <label>Time limit (minutes)</label>
                        <input
                          type="number"
                          min={0}
                          value={form.rules.timeLimitMinutes}
                          onChange={(e) =>
                            updateRule(
                              'timeLimitMinutes',
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          disabled={saving}
                        />
                        <div className="fx-field-hint">
                          Set to 0 for no time limit (practice exams).
                        </div>
                      </div>

                      <div className="fx-field">
                        <label>Pass mark (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.rules.passMarkPercent}
                          onChange={(e) =>
                            updateRule(
                              'passMarkPercent',
                              Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value) || 0),
                              ),
                            )
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ================= DELIVERY RULES ================= */}
                  <div className="fx-eb-section">
                    <h3 className="fx-eb-section-title">Delivery rules</h3>

                    <ToggleRow
                      label="Allow backward navigation"
                      desc="Candidates can go back to previous questions."
                      value={form.rules.allowBackwardNavigation}
                      onChange={(v) => updateRule('allowBackwardNavigation', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Allow flagging"
                      desc="Candidates can flag questions for review."
                      value={form.rules.allowFlagging}
                      onChange={(v) => updateRule('allowFlagging', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Allow review before submit"
                      desc="Candidates see a summary screen before submitting."
                      value={form.rules.allowReviewBeforeSubmit}
                      onChange={(v) =>
                        updateRule('allowReviewBeforeSubmit', v)
                      }
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Randomise question order"
                      desc="Each candidate gets a different order of questions."
                      value={form.rules.randomiseQuestionOrder}
                      onChange={(v) =>
                        updateRule('randomiseQuestionOrder', v)
                      }
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Randomise answer order"
                      desc="Options A/B/C/D are shuffled per candidate."
                      value={form.rules.randomiseAnswerOrder}
                      onChange={(v) =>
                        updateRule('randomiseAnswerOrder', v)
                      }
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Require rules acknowledgment"
                      desc="Candidate must tick a checkbox confirming they read the rules."
                      value={form.rules.requireRulesAcknowledgment}
                      onChange={(v) =>
                        updateRule('requireRulesAcknowledgment', v)
                      }
                      disabled={saving}
                    />
                  </div>

                  {/* ================= INTEGRITY ================= */}
                  <div className="fx-eb-section">
                    <h3 className="fx-eb-section-title">
                      Integrity & proctoring
                    </h3>

                    <ToggleRow
                      label="Enforce fullscreen"
                      desc="Request fullscreen when the exam starts and log exits."
                      value={form.rules.integrity.enforceFullscreen}
                      onChange={(v) => updateIntegrity('enforceFullscreen', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Detect tab switches"
                      desc="Log when the candidate leaves the exam tab."
                      value={form.rules.integrity.detectTabSwitch}
                      onChange={(v) => updateIntegrity('detectTabSwitch', v)}
                      disabled={saving}
                    />

                    {form.rules.integrity.detectTabSwitch && (
                      <div className="fx-field" style={{ marginTop: 8 }}>
                        <label>Max tab switches allowed</label>
                        <input
                          type="number"
                          min={0}
                          value={form.rules.integrity.maxTabSwitches}
                          onChange={(e) =>
                            updateIntegrity(
                              'maxTabSwitches',
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          disabled={saving}
                        />
                        <div className="fx-field-hint">
                          Attempts are flagged when this is exceeded. Set to
                          0 to allow unlimited.
                        </div>
                      </div>
                    )}

                    <ToggleRow
                      label="Block copy / paste"
                      desc="Prevent copy, paste, and cut. Attempts are logged."
                      value={form.rules.integrity.blockCopyPaste}
                      onChange={(v) => updateIntegrity('blockCopyPaste', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Block right-click"
                      desc="Disable the context menu."
                      value={form.rules.integrity.blockRightClick}
                      onChange={(v) => updateIntegrity('blockRightClick', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Block dev tools"
                      desc="Best-effort keyboard shortcut blocking (F12, Ctrl+Shift+I)."
                      value={form.rules.integrity.blockDevTools}
                      onChange={(v) => updateIntegrity('blockDevTools', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Require webcam"
                      desc="Enable webcam monitoring during the exam."
                      value={form.rules.integrity.requireWebcam}
                      onChange={(v) => updateIntegrity('requireWebcam', v)}
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Require ID verification"
                      desc="Candidate must verify their identity before starting."
                      value={form.rules.integrity.requireIdVerification}
                      onChange={(v) =>
                        updateIntegrity('requireIdVerification', v)
                      }
                      disabled={saving}
                    />
                    <ToggleRow
                      label="Require system check"
                      desc="Run a preflight check (webcam, mic, fullscreen) before starting."
                      value={form.rules.integrity.requireSystemCheck}
                      onChange={(v) =>
                        updateIntegrity('requireSystemCheck', v)
                      }
                      disabled={saving}
                    />
                  </div>

                  {/* ================= BLUEPRINT ================= */}
                  <div className="fx-eb-section">
                    <h3 className="fx-eb-section-title">
                      Question blueprint
                    </h3>

                    {currentModules.length === 0 ? (
                      <div className="fx-inline-error">
                        ⚠ No modules found for this subject. Add modules to
                        the subject first.
                      </div>
                    ) : (
                      <>
                        <div className="fx-bp">
                          {currentModules.map((mod) => {
                            const counts =
                              form.blueprint.perModule[mod.id] ?? {
                                easy: 0,
                                medium: 0,
                                hard: 0,
                              };
                            const available =
                              questionCounts[mod.id] ?? {
                                easy: 0,
                                medium: 0,
                                hard: 0,
                              };
                            const overEasy =
                              counts.easy > available.easy;
                            const overMedium =
                              counts.medium > available.medium;
                            const overHard =
                              counts.hard > available.hard;
                            const insufficient =
                              overEasy || overMedium || overHard;

                            return (
                              <div
                                key={mod.id}
                                className="fx-bp-module"
                              >
                                <div className="fx-bp-module-head">
                                  <div className="fx-bp-module-name">
                                    {mod.name}
                                  </div>
                                  <div
                                    className={`fx-bp-module-avail${insufficient ? ' warn' : ''}`}
                                  >
                                    Available: {available.easy}e /{' '}
                                    {available.medium}m / {available.hard}h
                                  </div>
                                </div>

                                <div className="fx-bp-counts">
                                  <div
                                    className={`fx-bp-count easy${overEasy ? ' over' : ''}`}
                                  >
                                    <span className="fx-bp-count-label">
                                      Easy
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={counts.easy}
                                      onChange={(e) =>
                                        updateBlueprintCount(
                                          mod.id,
                                          'easy',
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      disabled={saving}
                                    />
                                  </div>
                                  <div
                                    className={`fx-bp-count medium${overMedium ? ' over' : ''}`}
                                  >
                                    <span className="fx-bp-count-label">
                                      Medium
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={counts.medium}
                                      onChange={(e) =>
                                        updateBlueprintCount(
                                          mod.id,
                                          'medium',
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      disabled={saving}
                                    />
                                  </div>
                                  <div
                                    className={`fx-bp-count hard${overHard ? ' over' : ''}`}
                                  >
                                    <span className="fx-bp-count-label">
                                      Hard
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={counts.hard}
                                      onChange={(e) =>
                                        updateBlueprintCount(
                                          mod.id,
                                          'hard',
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      disabled={saving}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Total */}
                        <div
                          className={`fx-bp-summary${blueprintTotal > 0 ? ' total' : ''}`}
                          style={{ marginTop: 16 }}
                        >
                          <span>
                            Total questions on this exam:{' '}
                            <strong>{blueprintTotal}</strong>
                          </span>
                          {blueprintTotal === 0 && (
                            <span style={{ color: '#dc2626' }}>
                              Add at least one question.
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ================= ACTIONS ================= */}
                  <div className="fx-eb-actions">
                    {!isNew && selectedId && (
                      <button
                        type="button"
                        className="fx-btn danger"
                        onClick={() => setConfirmDelete(true)}
                        disabled={saving}
                        style={{ marginRight: 'auto' }}
                      >
                        Deactivate exam
                      </button>
                    )}
                    <button
                      type="button"
                      className="fx-btn secondary"
                      onClick={() => {
                        setSelectedId(null);
                        setIsNew(false);
                        setForm(EMPTY_FORM);
                        setError(null);
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="fx-btn primary"
                      onClick={handleSave}
                      disabled={saving || !blueprintValid}
                    >
                      {saving
                        ? 'Saving…'
                        : isNew
                          ? 'Create exam'
                          : 'Save changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setConfirmDelete(false)}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              fontFamily: 'sans-serif',
            }}
          >
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 10px',
              }}
            >
              Deactivate this exam?
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#475569',
                lineHeight: 1.6,
                margin: '0 0 22px',
              }}
            >
              The exam will be hidden from the catalogue. Existing attempts
              and audit logs that reference it remain intact. You can
              reactivate it at any time.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="fx-btn secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fx-btn danger"
                onClick={handleDelete}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SMALL HELPER COMPONENT
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  desc,
  value,
  onChange,
  disabled,
}) => (
  <div className="fx-toggle-row">
    <div className="fx-toggle-info">
      <div className="fx-toggle-label">{label}</div>
      <p className="fx-toggle-desc">{desc}</p>
    </div>
    <button
      type="button"
      className={`fx-toggle${value ? ' on' : ''}`}
      onClick={() => onChange(!value)}
      disabled={disabled}
      aria-pressed={value}
      aria-label={label}
    />
  </div>
);