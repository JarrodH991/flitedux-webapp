// ============================================================================
// src/pages/exam/admin/QuestionBank.tsx
//
// Admin tool for managing the question bank.
//
// Features:
//   - Filter panel: subject, module, difficulty, type
//   - Search box: filters on question stem text
//   - Paginated list of question previews
//   - Create / edit modal with a full question editor
//   - Delete with confirmation (soft delete — flagged as restricted)
//   - Answer key visible only to admins (instructors see a redacted view)
//
// Access: admin + instructor. Instructors cannot delete (handled by button
// disabling + would be enforced server-side via a Lambda authorizer).
//
// 🔌 AWS: Questions live in DynamoDB `questions` (PK: subjectId, SK: id).
//         API Gateway:
//           GET    /questions              → list with filters
//           GET    /questions/{id}         → single (admin view)
//           POST   /questions              → create
//           PUT    /questions/{id}         → update (bumps version)
//           DELETE /questions/{id}         → soft delete
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/authHooks';
import { useIsAuthenticated } from '../../../context/authHooks';
import * as api from '../../../services/api';

import type {
  Question,
  Subject,
  Module,
  Competency,
  QuestionType,
  Difficulty,
  QuestionFlag,
  AnswerOption,
} from '../../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-qb-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-qb-inner { max-width: 1280px; margin: 0 auto; }

/* Header */
.fx-qb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fx-qb-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-qb-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.fx-qb-sub {
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
.fx-btn.ghost {
  border-color: transparent;
  background: transparent;
  color: #64748b;
  padding: 8px 12px;
}
.fx-btn.ghost:hover:not(:disabled) {
  color: #d95300;
  background: rgba(217, 83, 0, 0.05);
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

/* Filter bar */
.fx-qb-filters {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.fx-qb-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-qb-filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}
.fx-qb-filter-field select,
.fx-qb-filter-field input {
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
.fx-qb-filter-field select:focus,
.fx-qb-filter-field input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}

/* Results header */
.fx-qb-results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 0 4px;
}
.fx-qb-results-count {
  font-size: 0.88rem;
  color: #64748b;
}
.fx-qb-results-count strong { color: #0f172a; }
.fx-qb-clear-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: #d95300;
  cursor: pointer;
  padding: 4px 8px;
}
.fx-qb-clear-btn:hover { text-decoration: underline; }

/* Question list */
.fx-qb-list { display: grid; gap: 12px; }
.fx-qb-row {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.fx-qb-row:hover {
  border-color: #fed7aa;
  box-shadow: 0 4px 14px rgba(217, 83, 0, 0.06);
}

.fx-qb-row-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.fx-qb-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.fx-qb-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
}
.fx-qb-badge.subject { background: #fff7ed; color: #d95300; }
.fx-qb-badge.type { background: #f1f5f9; color: #475569; }
.fx-qb-badge.easy { background: #dcfce7; color: #166534; }
.fx-qb-badge.medium { background: #fef3c7; color: #92400e; }
.fx-qb-badge.hard { background: #fee2e2; color: #991b1b; }
.fx-qb-badge.flag-critical { background: #fee2e2; color: #991b1b; }
.fx-qb-badge.flag-warn { background: #fef3c7; color: #92400e; }
.fx-qb-badge.flag-info { background: #dbeafe; color: #1e40af; }

.fx-qb-version {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
}

.fx-qb-stem {
  font-size: 0.98rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.55;
  margin: 0 0 12px;
}
.fx-qb-scenario-preview {
  font-size: 0.82rem;
  color: #64748b;
  background: #f8fafc;
  border-left: 2px solid #cbd5e1;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 12px;
  line-height: 1.55;
  font-style: italic;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fx-qb-options { display: grid; gap: 6px; margin-bottom: 12px; }
.fx-qb-option-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
}
.fx-qb-option-marker {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
}
.fx-qb-option-preview.correct .fx-qb-option-marker {
  background: #dcfce7;
  color: #166534;
}
.fx-qb-option-preview.correct {
  color: #166534;
  font-weight: 600;
}

.fx-qb-row-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.fx-qb-row-meta { font-size: 0.78rem; color: #94a3b8; }
.fx-qb-row-actions { display: flex; gap: 4px; }

/* Pagination */
.fx-qb-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.fx-qb-page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-qb-page-btn:hover:not(:disabled) {
  border-color: #d95300;
  color: #d95300;
}
.fx-qb-page-btn.active {
  background: #d95300;
  border-color: #d95300;
  color: #ffffff;
}
.fx-qb-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Empty */
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

/* Loading */
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
  animation: fxQBFadeIn 0.2s ease-out both;
}
@keyframes fxQBFadeIn { from { opacity: 0; } to { opacity: 1; } }

.fx-modal {
  width: 100%;
  max-width: 680px;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-height: 92vh;
  overflow-y: auto;
  box-sizing: border-box;
  animation: fxQBModalIn 0.25s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxQBModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.fx-modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}
.fx-modal-sub {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 22px;
}

/* Form */
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
.fx-field-row.three { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 640px) {
  .fx-field-row,
  .fx-field-row.three { grid-template-columns: 1fr; }
}

/* Flags */
.fx-flags { display: flex; flex-wrap: wrap; gap: 8px; }
.fx-flag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fx-flag-chip:hover { border-color: #fdba74; }
.fx-flag-chip.selected {
  background: #fff7ed;
  border-color: #d95300;
  color: #d95300;
}

/* Answer options editor */
.fx-options-editor { display: grid; gap: 10px; margin-top: 8px; }
.fx-option-edit-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}
.fx-option-correct-toggle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  color: #94a3b8;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.fx-option-correct-toggle.on {
  background: #dcfce7;
  border-color: #16a34a;
  color: #16a34a;
}
.fx-option-correct-toggle:hover { border-color: #d95300; }
.fx-option-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #0f172a;
  outline: none;
}
.fx-option-input:focus {
  border-color: #d95300;
  box-shadow: 0 0 0 3px rgba(217, 83, 0, 0.12);
}
.fx-option-remove {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.fx-option-remove:hover:not(:disabled) {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}
.fx-option-remove:disabled { opacity: 0.3; cursor: not-allowed; }

.fx-add-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px dashed #cbd5e1;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 6px;
}
.fx-add-option:hover {
  border-color: #d95300;
  color: #d95300;
}

/* Modal actions */
.fx-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

/* Inline error */
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
// CONSTANTS
// ---------------------------------------------------------------------------

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple choice' },
  { value: 'multi-select', label: 'Multi-select' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'true-false', label: 'True / false' },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const ALL_FLAGS: QuestionFlag[] = [
  'high-stakes',
  'proctored',
  'regulatory',
  'safety-critical',
  'restricted',
];

const PAGE_SIZE = 10;

interface QuestionFormState {
  subjectId: string;
  moduleId: string;
  competencyId: string;
  type: QuestionType;
  difficulty: Difficulty;
  flags: QuestionFlag[];
  stem: string;
  scenario: string;
  explanation: string;
  reference: string;
  options: AnswerOption[];
}

const EMPTY_FORM: QuestionFormState = {
  subjectId: '',
  moduleId: '',
  competencyId: '',
  type: 'mcq',
  difficulty: 'medium',
  flags: [],
  stem: '',
  scenario: '',
  explanation: '',
  reference: '',
  options: [
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function typeLabel(t: QuestionType): string {
  return QUESTION_TYPES.find((x) => x.value === t)?.label ?? t;
}

function flagBadgeClass(flag: QuestionFlag): string {
  if (flag === 'high-stakes' || flag === 'safety-critical') return 'flag-critical';
  if (flag === 'restricted' || flag === 'proctored') return 'flag-warn';
  return 'flag-info';
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const QuestionBank: React.FC = () => {
  const { user } = useAuth();
  const isAuth = useIsAuthenticated();

  // Reference data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modulesBySubject, setModulesBySubject] = useState<Record<string, Module[]>>({});
  const [competenciesBySubject, setCompetenciesBySubject] = useState<Record<string, Competency[]>>({});

  // Filters
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load subjects on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function loadRefs() {
      const subjRes = await api.getSubjects();
      if (cancelled || !subjRes.ok) return;
      setSubjects(subjRes.data);

      const moduleMap: Record<string, Module[]> = {};
      const compMap: Record<string, Competency[]> = {};
      await Promise.all(
        subjRes.data.map(async (s) => {
          const [m, c] = await Promise.all([
            api.getModules(s.id),
            api.getCompetencies(s.id),
          ]);
          if (m.ok) moduleMap[s.id] = m.data;
          if (c.ok) compMap[s.id] = c.data;
        }),
      );
      if (cancelled) return;
      setModulesBySubject(moduleMap);
      setCompetenciesBySubject(compMap);
    }

    loadRefs();
    return () => { cancelled = true; };
  }, [isAuth]);

  // -------------------------------------------------------------------------
  // Load questions (whenever filters change)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setError(null);

      const res = await api.listQuestions({
        subjectId: filterSubject || undefined,
        moduleId: filterModule || undefined,
        difficulty: (filterDifficulty || undefined) as Difficulty | undefined,
        type: (filterType || undefined) as QuestionType | undefined,
        page: 1,
        pageSize: 500,
      });

      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      setQuestions(res.data.items);
      setPage(1);
      setLoading(false);
    }

    loadQuestions();
    return () => { cancelled = true; };
  }, [isAuth, filterSubject, filterModule, filterDifficulty, filterType]);

  // -------------------------------------------------------------------------
  // Client-side search + pagination
  // -------------------------------------------------------------------------
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.stem.toLowerCase().includes(q) ||
        (item.scenario ?? '').toLowerCase().includes(q),
    );
  }, [questions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, page]);

  // Subject lookup for badges
  const subjectCodeById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of subjects) m[s.id] = s.code;
    return m;
  }, [subjects]);

  // Currently available modules for the selected filter subject
  const filterModules = filterSubject
    ? modulesBySubject[filterSubject] ?? []
    : Object.values(modulesBySubject).flat();

  // Modules and competencies in the create/edit modal
  const modalModules = form.subjectId
    ? modulesBySubject[form.subjectId] ?? []
    : [];
  const modalCompetencies = form.subjectId
    ? competenciesBySubject[form.subjectId] ?? []
    : [];

  // -------------------------------------------------------------------------
  // Filter handlers
  // -------------------------------------------------------------------------
  const clearFilters = () => {
    setFilterSubject('');
    setFilterModule('');
    setFilterDifficulty('');
    setFilterType('');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters =
    filterSubject || filterModule || filterDifficulty || filterType || searchQuery;

  // -------------------------------------------------------------------------
  // Modal handlers
  // -------------------------------------------------------------------------
  const openCreate = () => {
    const defaultSubject = filterSubject || subjects[0]?.id || '';
    const defaultModule =
      defaultSubject && (modulesBySubject[defaultSubject]?.length ?? 0) > 0
        ? modulesBySubject[defaultSubject][0].id
        : '';

    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      subjectId: defaultSubject,
      moduleId: defaultModule,
      competencyId: '',
    });
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      subjectId: q.subjectId,
      moduleId: q.moduleId,
      competencyId: q.competencyId,
      type: q.type,
      difficulty: q.difficulty,
      flags: [...q.flags],
      stem: q.stem,
      scenario: q.scenario ?? '',
      explanation: q.explanation ?? '',
      reference: q.reference ?? '',
      options: q.options.map((o) => ({ ...o })),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // -------------------------------------------------------------------------
  // Option editing
  // -------------------------------------------------------------------------
  const updateOption = (index: number, patch: Partial<AnswerOption>) => {
    setForm((f) => {
      const next = [...f.options];
      next[index] = { ...next[index], ...patch };
      return { ...f, options: next };
    });
  };

  const addOption = () => {
    setForm((f) => {
      if (f.options.length >= 6) return f;
      const nextId = optionLetter(f.options.length).toLowerCase();
      return {
        ...f,
        options: [...f.options, { id: nextId, text: '', isCorrect: false }],
      };
    });
  };

  const removeOption = (index: number) => {
    setForm((f) => {
      if (f.options.length <= 2) return f;
      const next = f.options.filter((_, i) => i !== index);
      const reassigned = next.map((o, i) => ({
        ...o,
        id: optionLetter(i).toLowerCase(),
      }));
      return { ...f, options: reassigned };
    });
  };

  const toggleOptionCorrect = (index: number) => {
    setForm((f) => {
      const next = [...f.options];
      const multi = f.type === 'multi-select';
      if (multi) {
        next[index] = { ...next[index], isCorrect: !next[index].isCorrect };
      } else {
        next.forEach((o, i) => {
          next[i] = { ...o, isCorrect: i === index };
        });
      }
      return { ...f, options: next };
    });
  };

  // -------------------------------------------------------------------------
  // Validation + save
  // -------------------------------------------------------------------------
  const validateForm = (): string | null => {
    if (!form.subjectId) return 'Please select a subject.';
    if (!form.moduleId) return 'Please select a module.';
    if (!form.stem.trim()) return 'Question stem is required.';
    if (form.options.length < 2) return 'At least two answer options are required.';
    if (form.options.some((o) => !o.text.trim()))
      return 'Every option must have text.';
    const hasCorrect = form.options.some((o) => o.isCorrect);
    if (!hasCorrect) return 'At least one correct answer must be marked.';
    if (form.type !== 'multi-select') {
      const correctCount = form.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1)
        return 'Single-select questions must have exactly one correct answer.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    // 🔌 AWS: Replace this block with:
    //   if (editingId) {
    //     await api.updateQuestion(editingId, { ... });
    //   } else {
    //     await api.createQuestion({ ... });
    //   }

    const now = new Date().toISOString();

    if (editingId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingId
            ? {
                ...q,
                subjectId: form.subjectId,
                moduleId: form.moduleId,
                competencyId: form.competencyId,
                type: form.type,
                difficulty: form.difficulty,
                flags: form.flags,
                stem: form.stem,
                scenario: form.scenario || undefined,
                explanation: form.explanation || undefined,
                reference: form.reference || undefined,
                options: form.options,
                updatedAt: now,
                version: q.version + 1,
              }
            : q,
        ),
      );
    } else {
      const newQuestion: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subjectId: form.subjectId,
        moduleId: form.moduleId,
        competencyId: form.competencyId,
        type: form.type,
        difficulty: form.difficulty,
        flags: form.flags,
        stem: form.stem,
        scenario: form.scenario || undefined,
        explanation: form.explanation || undefined,
        reference: form.reference || undefined,
        options: form.options,
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id ?? 'unknown',
      };
      setQuestions((prev) => [newQuestion, ...prev]);
    }

    setSaving(false);
    closeModal();
  };

  const requestDelete = (id: string) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);
  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    // 🔌 AWS: DELETE /questions/{id} → soft delete
    setQuestions((prev) => prev.filter((q) => q.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  // -------------------------------------------------------------------------
  // Guard
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-qb-page">
        <style>{pageCss}</style>
        <div className="fx-qb-inner">
          <div className="fx-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-qb-page">
      <style>{pageCss}</style>

      <div className="fx-qb-inner">
        {/* Header */}
        <div className="fx-qb-header">
          <div>
            <div className="fx-qb-eyebrow">Admin · Exam System</div>
            <h1 className="fx-qb-title">Question Bank</h1>
            <p className="fx-qb-sub">
              Create, edit, and organise every question in the bank. Each
              question is tagged by subject, module, competency, difficulty,
              and type.
            </p>
          </div>
          <button
            type="button"
            className="fx-btn primary"
            onClick={openCreate}
            disabled={subjects.length === 0}
          >
            + New question
          </button>
        </div>

        {/* Filters */}
        <div className="fx-qb-filters">
          <div className="fx-qb-filter-field">
            <label className="fx-qb-filter-label">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterModule('');
              }}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fx-qb-filter-field">
            <label className="fx-qb-filter-label">Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="">All modules</option>
              {filterModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fx-qb-filter-field">
            <label className="fx-qb-filter-label">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="fx-qb-filter-field">
            <label className="fx-qb-filter-label">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="fx-qb-filter-field">
            <label className="fx-qb-filter-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search stem or scenario…"
            />
          </div>
        </div>

        {/* Results header */}
        <div className="fx-qb-results-head">
          <div className="fx-qb-results-count">
            {loading ? (
              'Loading…'
            ) : (
              <>
                <strong>{filteredQuestions.length}</strong>{' '}
                {filteredQuestions.length === 1 ? 'question' : 'questions'}
              </>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="fx-qb-clear-btn"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && !modalOpen && (
          <div className="fx-inline-error" role="alert">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="fx-loading">Loading questions…</div>}

        {/* Empty */}
        {!loading && filteredQuestions.length === 0 && (
          <div className="fx-empty">
            <div className="fx-empty-icon" aria-hidden="true">📝</div>
            <h2 className="fx-empty-title">
              {hasActiveFilters ? 'No questions match' : 'No questions yet'}
            </h2>
            <p className="fx-empty-sub">
              {hasActiveFilters
                ? 'Try adjusting or clearing the filters.'
                : 'Create your first question to start building the bank.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="fx-btn secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                className="fx-btn primary"
                onClick={openCreate}
                disabled={subjects.length === 0}
              >
                + Create first question
              </button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && paginatedQuestions.length > 0 && (
          <div className="fx-qb-list">
            {paginatedQuestions.map((q) => {
              const subjectCode = subjectCodeById[q.subjectId] ?? '—';
              return (
                <div key={q.id} className="fx-qb-row">
                  <div className="fx-qb-row-top">
                    <div className="fx-qb-badges">
                      <span className="fx-qb-badge subject">{subjectCode}</span>
                      <span className="fx-qb-badge type">{typeLabel(q.type)}</span>
                      <span className={`fx-qb-badge ${q.difficulty}`}>
                        {q.difficulty}
                      </span>
                      {q.flags.map((f) => (
                        <span
                          key={f}
                          className={`fx-qb-badge ${flagBadgeClass(f)}`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="fx-qb-version">v{q.version}</div>
                  </div>

                  {q.scenario && (
                    <div className="fx-qb-scenario-preview">
                      <strong>Scenario:</strong> {q.scenario}
                    </div>
                  )}

                  <h3 className="fx-qb-stem">{q.stem}</h3>

                  <div className="fx-qb-options">
                    {q.options.map((o, i) => (
                      <div
                        key={o.id}
                        className={`fx-qb-option-preview${o.isCorrect ? ' correct' : ''}`}
                      >
                        <span className="fx-qb-option-marker">
                          {q.type === 'true-false'
                            ? o.id === 'true'
                              ? '✓'
                              : '✗'
                            : optionLetter(i)}
                        </span>
                        <span>{o.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="fx-qb-row-footer">
                    <div className="fx-qb-row-meta">
                      Updated {new Date(q.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="fx-qb-row-actions">
                      <button
                        type="button"
                        className="fx-btn ghost"
                        onClick={() => requestDelete(q.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="fx-btn secondary"
                        onClick={() => openEdit(q)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="fx-qb-pagination">
            <button
              type="button"
              className="fx-qb-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`fx-qb-page-btn${p === page ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="fx-qb-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ======================= CREATE / EDIT MODAL ======================= */}
      {modalOpen && (
        <div
          className="fx-modal-backdrop"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-qb-modal-title"
        >
          <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="fx-qb-modal-title" className="fx-modal-title">
              {editingId ? 'Edit question' : 'New question'}
            </h2>
            <p className="fx-modal-sub">
              {editingId
                ? 'Update this question. Saving will bump the version number and write an audit entry.'
                : 'Add a new question to the bank. All fields except scenario, explanation, and reference are required.'}
            </p>

            {error && <div className="fx-inline-error">⚠ {error}</div>}

            {/* Subject / Module / Competency */}
            <div className="fx-field-row three">
              <div className="fx-field">
                <label>Subject</label>
                <select
                  value={form.subjectId}
                  onChange={(e) => {
                    const newSubject = e.target.value;
                    const firstModule = modulesBySubject[newSubject]?.[0]?.id ?? '';
                    setForm((f) => ({
                      ...f,
                      subjectId: newSubject,
                      moduleId: firstModule,
                      competencyId: '',
                    }));
                  }}
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
                <label>Module</label>
                <select
                  value={form.moduleId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, moduleId: e.target.value }))
                  }
                  disabled={saving || !form.subjectId}
                >
                  <option value="">Select module…</option>
                  {modalModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-field">
                <label>Competency</label>
                <select
                  value={form.competencyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, competencyId: e.target.value }))
                  }
                  disabled={saving || !form.subjectId}
                >
                  <option value="">Optional</option>
                  {modalCompetencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type / Difficulty */}
            <div className="fx-field-row">
              <div className="fx-field">
                <label>Question type</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType;
                    setForm((f) => {
                      // Moving to a single-answer type: keep only the first
                      // correct option so the form stays valid.
                      if (newType === 'multi-select') {
                        return { ...f, type: newType };
                      }
                      let foundCorrect = false;
                      const options = f.options.map((o) => {
                        if (!o.isCorrect) return o;
                        if (foundCorrect) return { ...o, isCorrect: false };
                        foundCorrect = true;
                        return o;
                      });
                      return { ...f, type: newType, options };
                    });
                  }}
                  disabled={saving}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fx-field">
                <label>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      difficulty: e.target.value as Difficulty,
                    }))
                  }
                  disabled={saving}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Flags */}
            <div className="fx-field">
              <label>Flags</label>
              <div className="fx-flags">
                {ALL_FLAGS.map((flag) => {
                  const selected = form.flags.includes(flag);
                  return (
                    <label
                      key={flag}
                      className={`fx-flag-chip${selected ? ' selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setForm((f) => ({
                            ...f,
                            flags: selected
                              ? f.flags.filter((x) => x !== flag)
                              : [...f.flags, flag],
                          }));
                        }}
                        disabled={saving}
                      />
                      {flag}
                    </label>
                  );
                })}
              </div>
              <div className="fx-field-hint">
                Flags affect how the question is treated during delivery.
                High-stakes and safety-critical questions require extra
                integrity controls.
              </div>
            </div>

            {/* Scenario */}
            <div className="fx-field">
              <label>Scenario (optional)</label>
              <textarea
                value={form.scenario}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scenario: e.target.value }))
                }
                rows={3}
                placeholder="Context or situation that the question refers to."
                disabled={saving}
              />
              <div className="fx-field-hint">
                Shown above the question stem in a highlighted block. Use for
                scenario-based questions only.
              </div>
            </div>

            {/* Stem */}
            <div className="fx-field">
              <label>Question stem *</label>
              <textarea
                value={form.stem}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stem: e.target.value }))
                }
                rows={3}
                placeholder="The question itself."
                disabled={saving}
              />
            </div>

            {/* Answer options */}
            <div className="fx-field">
              <label>
                Answer options *{' '}
                {form.type === 'multi-select'
                  ? '(select all correct)'
                  : '(select the correct one)'}
              </label>
              <div className="fx-options-editor">
                {form.options.map((option, i) => (
                  <div key={option.id} className="fx-option-edit-row">
                    <button
                      type="button"
                      className={`fx-option-correct-toggle${
                        option.isCorrect ? ' on' : ''
                      }`}
                      onClick={() => toggleOptionCorrect(i)}
                      title={
                        option.isCorrect
                          ? 'Marked correct'
                          : 'Mark as correct'
                      }
                      disabled={saving}
                    >
                      {option.isCorrect ? '✓' : optionLetter(i)}
                    </button>
                    <input
                      type="text"
                      className="fx-option-input"
                      value={option.text}
                      onChange={(e) =>
                        updateOption(i, { text: e.target.value })
                      }
                      placeholder={`Option ${optionLetter(i)}`}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="fx-option-remove"
                      onClick={() => removeOption(i)}
                      disabled={saving || form.options.length <= 2}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {form.options.length < 6 && (
                <button
                  type="button"
                  className="fx-add-option"
                  onClick={addOption}
                  disabled={saving}
                >
                  + Add option
                </button>
              )}
            </div>

            {/* Explanation */}
            <div className="fx-field">
              <label>Explanation (optional)</label>
              <textarea
                value={form.explanation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, explanation: e.target.value }))
                }
                rows={2}
                placeholder="Shown to candidates after the exam, when answers are revealed."
                disabled={saving}
              />
            </div>

            {/* Reference */}
            <div className="fx-field">
              <label>Regulatory reference (optional)</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reference: e.target.value }))
                }
                placeholder="e.g. ICAO TI Part 4; IATA DGR 6"
                disabled={saving}
              />
              <div className="fx-field-hint">
                Used for audits. Cite the exact regulation or source document.
              </div>
            </div>

            <div className="fx-modal-actions">
              <button
                type="button"
                className="fx-btn secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fx-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : editingId
                    ? 'Save changes'
                    : 'Create question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= DELETE CONFIRMATION ======================= */}
      {confirmDeleteId && (
        <div
          className="fx-modal-backdrop"
          onClick={cancelDelete}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            className="fx-modal"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="fx-modal-title">Delete this question?</h2>
            <p className="fx-modal-sub">
              The question will be removed from the bank. Historical attempts
              that used it will still reference it for audit purposes, but it
              will no longer be drawn into new exams.
            </p>
            <div className="fx-modal-actions">
              <button
                type="button"
                className="fx-btn secondary"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fx-btn danger"
                onClick={confirmDelete}
              >
                Delete question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};