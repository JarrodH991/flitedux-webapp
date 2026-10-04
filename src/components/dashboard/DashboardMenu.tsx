// ============================================================================
// src/components/dashboard/DashboardMenu.tsx
//
// A Canvas-style slide-out menu drawer. Opens from the left with a dimmed
// backdrop. Shows navigation options for the signed-in user, adapted to
// their role.
//
// Used by the Navbar (menu button) and the Dashboard (own menu button).
// Controlled by props — the parent decides when it's open.
// ============================================================================

import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import {
  userCanAuthorContent,
  userCanViewAudit,
} from '../../types/auth.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const menuCss = `
/* ---------- Backdrop ---------- */
.fx-dmenu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.fx-dmenu-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

/* ---------- Drawer ---------- */
.fx-dmenu {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 320px;
  max-width: 88vw;
  background: #ffffff;
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.12);
  z-index: 1101;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
}
.fx-dmenu.open {
  transform: translateX(0);
}

/* ---------- Header ---------- */
.fx-dmenu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.fx-dmenu-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  min-width: 0;
}
.fx-dmenu-logo-tile {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #d95300, #b54400);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
  padding: 4px;
  box-sizing: border-box;
}
.fx-dmenu-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transform: translate(0.5px, 2px) scale(1.1);
}
.fx-dmenu-brand-text {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.fx-dmenu-close {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.fx-dmenu-close:hover {
  border-color: #d95300;
  color: #d95300;
  background: #fff7ed;
}

/* ---------- User card ---------- */
.fx-dmenu-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.fx-dmenu-user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d95300, #b54400);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.fx-dmenu-user-info {
  flex: 1;
  min-width: 0;
}
.fx-dmenu-user-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-dmenu-user-email {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-dmenu-user-role {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff7ed;
  color: #d95300;
  margin-top: 4px;
}

/* ---------- Sections ---------- */
.fx-dmenu-body {
  flex: 1;
  padding: 12px 12px 20px;
  overflow-y: auto;
}

.fx-dmenu-section {
  margin-bottom: 8px;
}
.fx-dmenu-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 12px 12px 6px;
  margin: 0;
}

/* ---------- Row ---------- */
.fx-dmenu-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: none;
  border-radius: 10px;
  color: #334155;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  box-sizing: border-box;
}
.fx-dmenu-row:hover {
  background: #f8fafc;
  color: #d95300;
}
.fx-dmenu-row.active {
  background: #fff7ed;
  color: #d95300;
}
.fx-dmenu-row.active .fx-dmenu-row-icon {
  color: #d95300;
}

.fx-dmenu-row-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #64748b;
  transition: color 0.12s ease;
}
.fx-dmenu-row:hover .fx-dmenu-row-icon {
  color: #d95300;
}

.fx-dmenu-row-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fx-dmenu-row-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #d95300;
  color: #ffffff;
  flex-shrink: 0;
}
.fx-dmenu-row-badge.muted {
  background: #f1f5f9;
  color: #94a3b8;
}

.fx-dmenu-row-caret {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: #cbd5e1;
}

/* ---------- Divider ---------- */
.fx-dmenu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 12px;
}

/* ---------- Sign out ---------- */
.fx-dmenu-signout {
  color: #dc2626;
}
.fx-dmenu-signout:hover {
  background: #fef2f2;
  color: #b91c1c;
}
.fx-dmenu-signout .fx-dmenu-row-icon {
  color: #dc2626;
}
.fx-dmenu-signout:hover .fx-dmenu-row-icon {
  color: #b91c1c;
}

/* ---------- Signed-out state ---------- */
.fx-dmenu-signedout {
  padding: 32px 20px;
  text-align: center;
}
.fx-dmenu-signedout-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.4;
}
.fx-dmenu-signedout-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.fx-dmenu-signedout-text {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 20px;
}
.fx-dmenu-signedout-btn {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: #d95300;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  box-sizing: border-box;
}
.fx-dmenu-signedout-btn:hover {
  background: #b54400;
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .fx-dmenu,
  .fx-dmenu-backdrop {
    transition: none;
  }
}
`;

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface DashboardMenuProps {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Called when the user wants to close the drawer. */
  onClose: () => void;
  /**
   * Optional: how many items are "due soon" (for a badge next to the
   * "To Do" link). Pass 0 to hide the badge.
   */
  todoBadgeCount?: number;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const DashboardMenu: React.FC<DashboardMenuProps> = ({
  open,
  onClose,
  todoBadgeCount = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, state, logout } = useAuth();

  const isAuthenticated = state === 'authenticated' && user !== null;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleSignOut = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  // Active link detection
  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + '/')
    );
  };

  // My Courses is a scroll shortcut, not a route. This handler navigates
  // to /dashboard (if needed) and then smooth-scrolls to the section.
  const handleMyCoursesClick = () => {
    onClose();

    const scrollToSection = () => {
      const el = document.getElementById('my-courses');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (location.pathname === '/dashboard') {
      // Already on the dashboard — just scroll.
      setTimeout(scrollToSection, 150);
    } else {
      // Navigate first, then wait for the dashboard to mount and data
      // to load before scrolling.
      navigate('/dashboard');
      setTimeout(scrollToSection, 500);
    }
  };

  // Initials for the user avatar
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const roleLabel = user?.roles?.[0] ?? 'User';

  return (
    <>
      <style>{menuCss}</style>

      {/* Backdrop */}
      <div
        className={`fx-dmenu-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fx-dmenu${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="fx-dmenu-header">
          <Link to="/" className="fx-dmenu-brand" onClick={onClose}>
            <div className="fx-dmenu-logo-tile">
              <img src="/images/flitedux-logo.png" alt="Flitedux" />
            </div>
            <span className="fx-dmenu-brand-text">Flitedux</span>
          </Link>
          <button
            type="button"
            className="fx-dmenu-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Signed in: user card + links */}
        {isAuthenticated && user ? (
          <>
            <div className="fx-dmenu-user">
              <div className="fx-dmenu-user-avatar">{initials}</div>
              <div className="fx-dmenu-user-info">
                <p className="fx-dmenu-user-name">{user.displayName}</p>
                <p className="fx-dmenu-user-email">{user.email}</p>
                <span className="fx-dmenu-user-role">{roleLabel}</span>
              </div>
            </div>

            <div className="fx-dmenu-body">
              {/* Main section */}
              <div className="fx-dmenu-section">
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/dashboard', true) ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    🏠
                  </span>
                  <span className="fx-dmenu-row-label">Dashboard</span>
                </Link>

                <Link
                  to="/dashboard/calendar"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/dashboard/calendar') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    📅
                  </span>
                  <span className="fx-dmenu-row-label">Calendar</span>
                </Link>

                <Link
                  to="/dashboard/todo"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/dashboard/todo') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    ✅
                  </span>
                  <span className="fx-dmenu-row-label">To Do</span>
                  {todoBadgeCount > 0 && (
                    <span className="fx-dmenu-row-badge">
                      {todoBadgeCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="fx-dmenu-divider" />

              {/* My stuff */}
              <div className="fx-dmenu-section">
                <p className="fx-dmenu-section-label">My learning</p>

                {/* My Courses is a scroll shortcut — never highlighted. */}
                <button
                  type="button"
                  onClick={handleMyCoursesClick}
                  className="fx-dmenu-row"
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    📚
                  </span>
                  <span className="fx-dmenu-row-label">My Courses</span>
                </button>
                                <Link
                  to="/exam/dashboard"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/exam/dashboard') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    📝
                  </span>
                  <span className="fx-dmenu-row-label">My Exams</span>
                </Link>

                <Link
                  to="/dashboard/certificates"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/dashboard/certificates') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    🏆
                  </span>
                  <span className="fx-dmenu-row-label">Certificates</span>
                </Link>

                <Link
                  to="/gallery"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/gallery') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    📷
                  </span>
                  <span className="fx-dmenu-row-label">Gallery</span>
                </Link>
              </div>

              {/* Admin section */}
              {(userCanAuthorContent(user) || userCanViewAudit(user)) && (
                <>
                  <div className="fx-dmenu-divider" />
                  <div className="fx-dmenu-section">
                    <p className="fx-dmenu-section-label">Admin</p>

                    <Link
                      to="/exam/admin"
                      onClick={onClose}
                      className={`fx-dmenu-row${
                        isActive('/exam/admin', true) ? ' active' : ''
                      }`}
                    >
                      <span className="fx-dmenu-row-icon" aria-hidden="true">
                        ⚙
                      </span>
                      <span className="fx-dmenu-row-label">Admin Panel</span>
                    </Link>

                    {userCanAuthorContent(user) && (
                      <Link
                        to="/exam/admin/questions"
                        onClick={onClose}
                        className={`fx-dmenu-row${
                          isActive('/exam/admin/questions') ? ' active' : ''
                        }`}
                      >
                        <span className="fx-dmenu-row-icon" aria-hidden="true">
                          ❓
                        </span>
                        <span className="fx-dmenu-row-label">
                          Question Bank
                        </span>
                      </Link>
                    )}

                    {user.roles.includes('admin') && (
                      <Link
                        to="/exam/admin/exams"
                        onClick={onClose}
                        className={`fx-dmenu-row${
                          isActive('/exam/admin/exams') ? ' active' : ''
                        }`}
                      >
                        <span className="fx-dmenu-row-icon" aria-hidden="true">
                          🧩
                        </span>
                        <span className="fx-dmenu-row-label">
                          Exam Builder
                        </span>
                      </Link>
                    )}

                    {userCanViewAudit(user) && (
                      <Link
                        to="/exam/admin/analytics"
                        onClick={onClose}
                        className={`fx-dmenu-row${
                          isActive('/exam/admin/analytics') ? ' active' : ''
                        }`}
                      >
                        <span className="fx-dmenu-row-icon" aria-hidden="true">
                          📊
                        </span>
                        <span className="fx-dmenu-row-label">Analytics</span>
                      </Link>
                    )}

                    {userCanViewAudit(user) && (
                      <Link
                        to="/exam/admin/audit"
                        onClick={onClose}
                        className={`fx-dmenu-row${
                          isActive('/exam/admin/audit') ? ' active' : ''
                        }`}
                      >
                        <span className="fx-dmenu-row-icon" aria-hidden="true">
                          🔒
                        </span>
                        <span className="fx-dmenu-row-label">Audit Log</span>
                      </Link>
                    )}
                  </div>
                </>
              )}

              <div className="fx-dmenu-divider" />

              {/* Support */}
              <div className="fx-dmenu-section">
                <Link
                  to="/faq"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/faq') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    ❔
                  </span>
                  <span className="fx-dmenu-row-label">Help & FAQ</span>
                </Link>

                <Link
                  to="/contact"
                  onClick={onClose}
                  className={`fx-dmenu-row${
                    isActive('/contact') ? ' active' : ''
                  }`}
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    ✉
                  </span>
                  <span className="fx-dmenu-row-label">Contact us</span>
                </Link>
              </div>

              <div className="fx-dmenu-divider" />

              <div className="fx-dmenu-section">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="fx-dmenu-row fx-dmenu-signout"
                >
                  <span className="fx-dmenu-row-icon" aria-hidden="true">
                    🚪
                  </span>
                  <span className="fx-dmenu-row-label">Sign out</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Signed out state */
          <div className="fx-dmenu-signedout">
            <div className="fx-dmenu-signedout-icon" aria-hidden="true">
              🔒
            </div>
            <h3 className="fx-dmenu-signedout-title">Please sign in</h3>
            <p className="fx-dmenu-signedout-text">
              Sign in to access your dashboard, courses, and calendar.
            </p>
            <Link
              to="/login"
              onClick={onClose}
              className="fx-dmenu-signedout-btn"
            >
              Sign in →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};