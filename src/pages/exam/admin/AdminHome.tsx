// ============================================================================
// src/pages/exam/admin/AdminHome.tsx
//
// The admin landing page. A hub that links to all five admin tools.
//
// Role-aware: each card is only shown if the user has the required role
// for that tool. An instructor sees Questions only; an auditor sees
// Analytics and Audit only; an admin sees everything.
//
// 🔌 AWS: No backend interaction. Pure navigation hub.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../context/authHooks';
import {
  userCanAuthorContent,
  userCanViewAudit,
} from '../../../types/auth.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-ah-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-ah-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.fx-ah-header {
  margin-bottom: 36px;
}
.fx-ah-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 6px;
}
.fx-ah-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.15;
}
.fx-ah-sub {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
  max-width: 720px;
}

.fx-ah-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.fx-ah-card {
  display: block;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  position: relative;
}
.fx-ah-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(217, 83, 0, 0.10);
  border-color: #fed7aa;
}

.fx-ah-card-icon {
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

.fx-ah-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.3;
}
.fx-ah-card-desc {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 16px;
}
.fx-ah-card-cta {
  color: #d95300;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.fx-ah-card:hover .fx-ah-card-cta {
  gap: 10px;
}

.fx-ah-card-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
}

.fx-ah-empty {
  padding: 60px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 14px;
  color: #64748b;
}
.fx-ah-empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.fx-ah-empty-sub {
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Section heading for role groupings */
.fx-ah-section {
  margin-bottom: 32px;
}
.fx-ah-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 12px;
  padding-left: 4px;
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface AdminTool {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  /** Which role check grants access. */
  requires: 'admin' | 'authoring' | 'audit';
}

const TOOLS: AdminTool[] = [
  {
    key: 'subjects',
    title: 'Subjects',
    description:
      'The top-level categories — Dangerous Goods, Aviation Security, and any future subjects.',
    href: '/exam/admin/subjects',
    icon: '📚',
    badge: 'Admin',
    requires: 'admin',
  },
  {
    key: 'questions',
    title: 'Question Bank',
    description:
      'Create, edit, and organise questions. Tag by module, difficulty, and competency.',
    href: '/exam/admin/questions',
    icon: '❓',
    badge: 'Instructor',
    requires: 'authoring',
  },
  {
    key: 'exams',
    title: 'Exam Builder',
    description:
      'Assemble exam blueprints. Choose how many questions per module at each difficulty.',
    href: '/exam/admin/exams',
    icon: '🧩',
    badge: 'Admin',
    requires: 'admin',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    description:
      'Pass rates, question performance, and the trends that show where candidates struggle.',
    href: '/exam/admin/analytics',
    icon: '📊',
    badge: 'Read-only',
    requires: 'audit',
  },
  {
    key: 'audit',
    title: 'Audit Log',
    description:
      'Regulatory trail of every sensitive action. Required for aviation-authority reviews.',
    href: '/exam/admin/audit',
    icon: '🔒',
    badge: 'Read-only',
    requires: 'audit',
  },
];

export const AdminHome: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="fx-ah-page">
        <style>{pageCss}</style>
        <div className="fx-ah-inner">
          <div className="fx-ah-empty">
            <div className="fx-ah-empty-title">Please sign in</div>
          </div>
        </div>
      </div>
    );
  }

  // Filter tools by what this user can access
  const visibleTools = TOOLS.filter((tool) => {
    switch (tool.requires) {
      case 'admin':
        return user.roles.includes('admin');
      case 'authoring':
        return userCanAuthorContent(user);
      case 'audit':
        return userCanViewAudit(user);
      default:
        return false;
    }
  });

  const isAdmin = user.roles.includes('admin');
  const roleLabel = isAdmin
    ? 'Administrator'
    : user.roles.includes('instructor')
      ? 'Instructor'
      : user.roles.includes('auditor')
        ? 'Auditor'
        : 'User';

  return (
    <div className="fx-ah-page">
      <style>{pageCss}</style>

      <div className="fx-ah-inner">
        {/* Header */}
        <div className="fx-ah-header">
          <div className="fx-ah-eyebrow">Exam System · Admin</div>
          <h1 className="fx-ah-title">Admin tools</h1>
          <p className="fx-ah-sub">
            Signed in as <strong>{roleLabel}</strong>. Every change you make
            here is logged in the audit trail. Question and exam edits bump
            a version number so historical attempts remain reproducible.
          </p>
        </div>

        {/* Tools grid */}
        {visibleTools.length === 0 ? (
          <div className="fx-ah-empty">
            <div className="fx-ah-empty-title">No admin tools available</div>
            <p className="fx-ah-empty-sub">
              Your account doesn't have permission to access any of the admin
              tools. If you believe this is a mistake, contact your training
              coordinator.
            </p>
          </div>
        ) : (
          <div className="fx-ah-section">
            <h2 className="fx-ah-section-title">
              Available to you ({visibleTools.length})
            </h2>
            <div className="fx-ah-grid">
              {visibleTools.map((tool) => (
                <Link
                  key={tool.key}
                  to={tool.href}
                  className="fx-ah-card"
                >
                  {tool.badge && (
                    <span className="fx-ah-card-badge">{tool.badge}</span>
                  )}
                  <div className="fx-ah-card-icon" aria-hidden="true">
                    {tool.icon}
                  </div>
                  <h3 className="fx-ah-card-title">{tool.title}</h3>
                  <p className="fx-ah-card-desc">{tool.description}</p>
                  <span className="fx-ah-card-cta">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};