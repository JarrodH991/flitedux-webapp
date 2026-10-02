// ============================================================================
// src/pages/exam/admin/SubjectManager.tsx
//
// Admin tool for managing subjects. A subject is the top-level category
// of training content: "Dangerous Goods", "Aviation Security", "Cabin Crew
// Safety", etc.
//
// Everything downstream (modules, competencies, questions, exams) hangs
// off subjects. So this is the first thing an admin needs.
//
// This page does NOT yet persist changes to a backend — it maintains a
// local working copy in React state. Real create/update/delete will be
// added when the API is wired up. See the 🔌 AWS comments for the exact
// endpoints.
//
// Access: only users with the 'admin' role can view this page. The
// ProtectedRoute wrapper enforces that at the routing level.
//
// 🔌 AWS: Subjects live in a DynamoDB table `subjects` (PK: id).
//         API Gateway exposes:
//           POST   /subjects      → create
//           PUT    /subjects/{id} → update
//           DELETE /subjects/{id} → soft delete (active = false)
//         All backed by Lambda handlers with role enforcement in a
//         Cognito authorizer.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/authHooks';
import { useIsAuthenticated } from '../../../context/authHooks';
import * as api from '../../../services/api';

import type { Subject, Module, Competency } from '../../../types/exam.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-subj-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.fx-subj-inner {
  max-width: 1100px;
  margin: 0 auto;
}

/* Header */
.fx-subj-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.fx-subj-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-subj-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.2;
}
.fx-subj-sub {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Primary button */
.fx-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}
.fx-btn.primary {
  background: #d95300;
  color: #ffffff;
  border-color: #d95300;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
}
.fx-btn.primary:hover {
  background: #b54400;
  border-color: #b54400;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.35);
}
.fx-btn.secondary {
  background: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.fx-btn.secondary:hover {
  border-color: #d95300;
  color: #d95300;
  transform: translateY(-1px);
}
.fx-btn.ghost {
  background: transparent;
  color: #64748b;
  border-color: transparent;
  padding: 8px 12px;
}
.fx-btn.ghost:hover {
  color: #d95300;
}
.fx-btn.danger {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}
.fx-btn.danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
.fx-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Card grid */
.fx-subj-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 720px) {
  .fx-subj-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

/* Subject card */
.fx-subj-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fx-subj-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.08);
  border-color: #fed7aa;
}
.fx-subj-card.inactive {
  opacity: 0.6;
  background: #f8fafc;
}

.fx-subj-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.fx-subj-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 42px;
  padding: 0 10px;
  border-radius: 10px;
  background: #fff7ed;
  color: #d95300;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.fx-subj-card-info {
  flex: 1;
  min-width: 0;
}
.fx-subj-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
  line-height: 1.35;
}
.fx-subj-card-authority {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
}

.fx-subj-card-desc {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Stats row inside card */
.fx-subj-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.8rem;
  color: #64748b;
}
.fx-subj-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.fx-subj-stat strong {
  font-size: 1.05rem;
  color: #0f172a;
  font-weight: 700;
}

/* Card actions */
.fx-subj-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  padding-top: 4px;
}

/* Inactive pill */
.fx-subj-inactive-pill {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
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
  animation: fxModalFadeIn 0.2s ease-out both;
}
@keyframes fxModalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.fx-modal {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  font-family: sans-serif;
  max-height: 90vh;
  overflow-y: auto;
  animation: fxModalIn 0.25s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.fx-modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.fx-modal-sub {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 22px;
}

/* Form fields */
.fx-field {
  margin-bottom: 16px;
}
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
  font-size: 0.92rem;
  color: #0f172a;
  background: #ffffff;
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
.fx-field-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}
@media (max-width: 500px) {
  .fx-field-row { grid-template-columns: 1fr; }
}
.fx-field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 5px;
  line-height: 1.45;
}

.fx-field-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.fx-field-checkbox:hover {
  border-color: #fdba74;
  background: #fffbf7;
}
.fx-field-checkbox input {
  margin-top: 3px;
  flex-shrink: 0;
  cursor: pointer;
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

/* Empty state */
.fx-empty {
  padding: 60px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
}
.fx-empty-icon {
  font-size: 2.5rem;
  opacity: 0.4;
  margin-bottom: 12px;
}
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
`;

// ---------------------------------------------------------------------------
// FORM STATE
// ---------------------------------------------------------------------------

interface SubjectFormState {
  name: string;
  code: string;
  description: string;
  regulatoryAuthority: string;
  active: boolean;
}

const EMPTY_FORM: SubjectFormState = {
  name: '',
  code: '',
  description: '',
  regulatoryAuthority: 'SACAA',
  active: true,
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const SubjectManager: React.FC = () => {
  const { user } = useAuth();
  const isAuth = useIsAuthenticated();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modulesBySubject, setModulesBySubject] = useState<
    Record<string, Module[]>
  >({});
  const [competenciesBySubject, setCompetenciesBySubject] = useState<
    Record<string, Competency[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const subjRes = await api.getSubjects();
      if (cancelled) return;
      if (!subjRes.ok) {
        setError(subjRes.error.message);
        setLoading(false);
        return;
      }

      setSubjects(subjRes.data);

      // Load modules + competencies for each subject in parallel
      const moduleMap: Record<string, Module[]> = {};
      const compMap: Record<string, Competency[]> = {};

      await Promise.all(
        subjRes.data.map(async (s) => {
          const [modRes, compRes] = await Promise.all([
            api.getModules(s.id),
            api.getCompetencies(s.id),
          ]);
          if (modRes.ok) moduleMap[s.id] = modRes.data;
          if (compRes.ok) compMap[s.id] = compRes.data;
        }),
      );

      if (cancelled) return;
      setModulesBySubject(moduleMap);
      setCompetenciesBySubject(compMap);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort((a, b) => {
        // Active first, then alphabetical
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [subjects],
  );

  // -------------------------------------------------------------------------
  // Modal handlers
  // -------------------------------------------------------------------------
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      regulatoryAuthority: subject.regulatoryAuthority,
      active: subject.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    // Validate
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required.');
      return;
    }

    setSaving(true);

    // 🔌 AWS: Replace this with:
    //   if (editingId) {
    //     await api.updateSubject(editingId, form);
    //   } else {
    //     await api.createSubject(form);
    //   }
    //
    // For now, we mutate local state only. When the API is real, this
    // triggers a Lambda that writes to DynamoDB.

    const now = new Date().toISOString();

    if (editingId) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...form } : s,
        ),
      );
    } else {
      const newSubject: Subject = {
        id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: form.name,
        code: form.code.toUpperCase(),
        description: form.description,
        regulatoryAuthority: form.regulatoryAuthority,
        active: form.active,
        createdAt: now,
      };
      setSubjects((prev) => [newSubject, ...prev]);
    }

    setSaving(false);
    closeModal();
  };

  const handleToggleActive = (subject: Subject) => {
    // 🔌 AWS: PUT /subjects/{id} with { active: !subject.active }
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subject.id ? { ...s, active: !s.active } : s,
      ),
    );
  };

  const requestDelete = (id: string) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    // 🔌 AWS: DELETE /subjects/{id} → soft delete (sets active = false)
    //
    // We soft-delete rather than hard-delete because historical attempts
    // and audit logs reference subject IDs. Hard deletion would break them.
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === confirmDeleteId ? { ...s, active: false } : s,
      ),
    );
    setConfirmDeleteId(null);
  };

  // -------------------------------------------------------------------------
  // Guard
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="fx-subj-page">
        <style>{pageCss}</style>
        <div className="fx-subj-inner">
          <div className="fx-loading">Redirecting…</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="fx-subj-page">
      <style>{pageCss}</style>

      <div className="fx-subj-inner">
        {/* Header */}
        <div className="fx-subj-header">
          <div>
            <div className="fx-subj-eyebrow">Admin · Exam System</div>
            <h1 className="fx-subj-title">Subjects</h1>
            <p className="fx-subj-sub">
              The top-level categories of training content. Everything else —
              modules, competencies, questions, exams — hangs off these.
            </p>
          </div>
          <button
            type="button"
            className="fx-btn primary"
            onClick={openCreate}
          >
            + New subject
          </button>
        </div>

        {/* Error */}
        {error && !modalOpen && (
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
        {loading && <div className="fx-loading">Loading subjects…</div>}

        {/* Empty */}
        {!loading && sortedSubjects.length === 0 && (
          <div className="fx-empty">
            <div className="fx-empty-icon" aria-hidden="true">📚</div>
            <h2 className="fx-empty-title">No subjects yet</h2>
            <p className="fx-empty-sub">
              Create your first subject to start adding modules, questions,
              and exams.
            </p>
            <button
              type="button"
              className="fx-btn primary"
              onClick={openCreate}
            >
              + Create first subject
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && sortedSubjects.length > 0 && (
          <div className="fx-subj-grid">
            {sortedSubjects.map((subject) => {
              const mods = modulesBySubject[subject.id] ?? [];
              const comps = competenciesBySubject[subject.id] ?? [];

              return (
                <div
                  key={subject.id}
                  className={`fx-subj-card${subject.active ? '' : ' inactive'}`}
                >
                  <div className="fx-subj-card-top">
                    <div className="fx-subj-badge">{subject.code}</div>
                    <div className="fx-subj-card-info">
                      <h3 className="fx-subj-card-name">{subject.name}</h3>
                      <div className="fx-subj-card-authority">
                        {subject.regulatoryAuthority}
                      </div>
                    </div>
                    {!subject.active && (
                      <span className="fx-subj-inactive-pill">Inactive</span>
                    )}
                  </div>

                  <p className="fx-subj-card-desc">{subject.description}</p>

                  <div className="fx-subj-stats">
                    <div className="fx-subj-stat">
                      <strong>{mods.length}</strong>
                      <span>modules</span>
                    </div>
                    <div className="fx-subj-stat">
                      <strong>{comps.length}</strong>
                      <span>competencies</span>
                    </div>
                  </div>

                  <div className="fx-subj-actions">
                    <button
                      type="button"
                      className="fx-btn ghost"
                      onClick={() => handleToggleActive(subject)}
                      title={subject.active ? 'Deactivate' : 'Activate'}
                    >
                      {subject.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="fx-btn ghost"
                      onClick={() => requestDelete(subject.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="fx-btn secondary"
                      onClick={() => openEdit(subject)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== CREATE / EDIT MODAL ===================== */}
      {modalOpen && (
        <div
          className="fx-modal-backdrop"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-subj-modal-title"
        >
          <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="fx-subj-modal-title" className="fx-modal-title">
              {editingId ? 'Edit subject' : 'New subject'}
            </h2>
            <p className="fx-modal-sub">
              {editingId
                ? 'Update the details of this subject.'
                : 'Create a new category of training content. Once created, you can add modules and questions to it.'}
            </p>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  marginBottom: 16,
                }}
              >
                ⚠ {error}
              </div>
            )}

            <div className="fx-field-row">
              <div className="fx-field">
                <label htmlFor="fx-subj-code">Code</label>
                <input
                  id="fx-subj-code"
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="DG"
                  maxLength={10}
                  disabled={saving}
                />
                <div className="fx-field-hint">
                  Short code shown on question badges.
                </div>
              </div>

              <div className="fx-field">
                <label htmlFor="fx-subj-name">Name</label>
                <input
                  id="fx-subj-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Dangerous Goods"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="fx-field">
              <label htmlFor="fx-subj-desc">Description</label>
              <textarea
                id="fx-subj-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="A short description of what this subject covers."
                disabled={saving}
              />
            </div>

            <div className="fx-field">
              <label htmlFor="fx-subj-authority">Regulatory authority</label>
              <input
                id="fx-subj-authority"
                type="text"
                value={form.regulatoryAuthority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    regulatoryAuthority: e.target.value,
                  }))
                }
                placeholder="SACAA, ICAO, IATA..."
                disabled={saving}
              />
            </div>

            <label className="fx-field-checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
                disabled={saving}
              />
              <span>
                Active — subjects appear in the exam catalogue when active.
                Deactivate to hide without deleting.
              </span>
            </label>

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
                disabled={saving || !form.name.trim() || !form.code.trim()}
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION ===================== */}
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
            <h2 className="fx-modal-title">Deactivate this subject?</h2>
            <p className="fx-modal-sub">
              The subject will be hidden from the exam catalogue but historical
              attempts, questions, and audit logs that reference it will remain
              intact. You can reactivate it at any time.
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
                Deactivate subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};