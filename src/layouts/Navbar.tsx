// ============================================================================
// src/layouts/Navbar.tsx
//
// The site navbar. Shows different content depending on whether the user
// is logged in and what roles they have.
//
// 🔌 AWS: Uses useAuth() from AuthContext, which reads from Cognito.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/authHooks';
import { userCanViewAudit, userCanAuthorContent } from '../types/auth.types';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const navCss = `
.fx-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(234, 234, 234, 0.8);
  transition: transform 0.3s ease-in-out;
  box-sizing: border-box;
}
.fx-nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 20px;
  max-width: 1400px;
  margin: 0 auto;
}
@media (min-width: 960px) {
  .fx-nav-inner { padding: 14px 40px; }
}

/* Logo */
.fx-nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  cursor: pointer;
  flex-shrink: 0;
}
.fx-nav-logo-tile {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #d95300, #b54400);
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
  padding: 2px;
  box-sizing: border-box;
}
.fx-nav-logo-tile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transform: translate(1px, 5px) scale(1.15);
}
.fx-nav-logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
}

/* Links */
.fx-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.fx-nav-link {
  display: block;
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: transparent;
  cursor: pointer;
  box-sizing: border-box;
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}
.fx-nav-link:hover,
.fx-nav-link:focus-visible,
.fx-nav-link.active {
  color: #d95300;
  background-color: rgba(217, 83, 0, 0.06);
}
.fx-nav-link:hover,
.fx-nav-link:focus-visible { transform: translateY(-2px); }
.fx-nav-link:active { transform: translateY(0) scale(0.97); }

/* Right actions */
.fx-nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fx-nav-search {
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 4px 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}
.fx-nav-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #1e293b;
  width: 100%;
  padding: 4px;
  font-family: inherit;
}
.fx-nav-search-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 16px;
}

.fx-nav-cta {
  display: inline-block;
  text-decoration: none;
  background-color: #d95300;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(217, 83, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
  font-family: inherit;
}
.fx-nav-cta:hover,
.fx-nav-cta:focus-visible {
  background-color: #b54400;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.4);
}
.fx-nav-cta:active {
  background-color: #a84000;
  transform: translateY(0) scale(0.97);
}

/* User chip */
.fx-nav-user-wrap { position: relative; }
.fx-nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.fx-nav-user:hover {
  border-color: #d95300;
  background: #fffbf7;
}
.fx-nav-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d95300, #b54400);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.fx-nav-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-nav-user-caret {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-right: 4px;
}

.fx-nav-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  padding: 8px;
  z-index: 1001;
  animation: fxNavDropIn 0.15s ease-out both;
}
@keyframes fxNavDropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fx-nav-drop-head {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 6px;
}
.fx-nav-drop-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-nav-drop-email {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-nav-drop-role {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff7ed;
  color: #d95300;
  margin-top: 6px;
}
.fx-nav-drop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #334155;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.fx-nav-drop-item:hover {
  background: #f8fafc;
  color: #d95300;
}
.fx-nav-drop-item.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}
.fx-nav-drop-item-icon {
  width: 18px;
  text-align: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}
.fx-nav-drop-sep {
  height: 1px;
  background: #f1f5f9;
  margin: 6px 0;
}
.fx-nav-drop-header {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 8px 12px 4px;
  margin: 0;
}

/* Mobile */
.fx-nav-hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #1e293b;
  padding: 4px;
  font-family: inherit;
}
@media (max-width: 960px) {
  .fx-nav-links { display: none; }
  .fx-nav-hamburger { display: flex; }
  .fx-nav-cta.desktop-only { display: none; }
  .fx-nav-user-name { display: none; }
  .fx-nav-user-caret { display: none; }
  .fx-nav-logo-tile { width: 48px; height: 48px; border-radius: 12px; }
  .fx-nav-logo-text { font-size: 18px; }
  .fx-nav-inner { padding: 10px 16px; }
}

.fx-nav-mobile {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  padding: 20px;
  box-sizing: border-box;
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}
.fx-nav-mobile-link {
  display: block;
  width: 100%;
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 15px;
  padding: 11px 14px;
  border-radius: 10px;
  transition: all 0.15s ease;
  box-sizing: border-box;
}
.fx-nav-mobile-link:hover,
.fx-nav-mobile-link.active {
  color: #d95300;
  background-color: rgba(217, 83, 0, 0.06);
}
.fx-nav-mobile-sep {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 0;
}
.fx-nav-mobile-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 6px;
}
.fx-nav-mobile-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d95300, #b54400);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}
.fx-nav-mobile-user-info { flex: 1; min-width: 0; }
.fx-nav-mobile-user-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-nav-mobile-user-email {
  font-size: 0.75rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
.fx-nav-mobile-cta {
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px;
  background: #d95300;
  color: #ffffff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  box-sizing: border-box;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.fx-nav-mobile-cta.secondary {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.fx-nav-mobile-cta.danger { background: #dc2626; }
.fx-nav-mobile-cta:hover { filter: brightness(0.95); }
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, state, logout } = useAuth();

  const isAuthenticated = state === 'authenticated' && user !== null;

  // ---- Search ----
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ---- Responsive ----
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 960;

  const SEARCH_OPEN_BREAKPOINT = 1200;
  const isWideScreen = windowWidth >= SEARCH_OPEN_BREAKPOINT;
  const isSearchExpanded = isWideScreen || isSearchOpen;

  // ---- Mobile menu ----
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ---- User dropdown ----
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ---- Scroll direction (hide on scroll down) ----
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  // -------------------------------------------------------------------------
  // Resize listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -------------------------------------------------------------------------
  // Scroll listener — hide navbar when scrolling down
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // -------------------------------------------------------------------------
  // Close user menu on click outside
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isUserMenuOpen]);

  // -------------------------------------------------------------------------
  // Close any open menus. Called from every Link's onClick.
  //
  // We used to do this in a useEffect that watched location.pathname, but
  // that caused a "cascading renders" warning because setState ran
  // synchronously in an effect. Doing it in the click handler means the
  // navigation and the menu-close happen in the same React batch.
  // -------------------------------------------------------------------------
  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // -------------------------------------------------------------------------
  // Search submit
  // -------------------------------------------------------------------------
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------
  const handleLogout = async () => {
    closeMenus();
    await logout();
    navigate('/');
  };

  // -------------------------------------------------------------------------
  // Nav links (public)
  // -------------------------------------------------------------------------
  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const showAdminLink =
    isAuthenticated &&
    user !== null &&
    (userCanAuthorContent(user) || userCanViewAudit(user));

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <nav
      className="fx-nav"
      style={{
        transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <style>{navCss}</style>

      <div className="fx-nav-inner">
        {/* ==================== LOGO ==================== */}
        <Link to="/" className="fx-nav-logo" onClick={closeMenus}>
          <div className="fx-nav-logo-tile">
            <img src="/images/flitedux-logo.png" alt="Flitedux" />
          </div>
          <span className="fx-nav-logo-text">Flitedux</span>
        </Link>

        {/* ==================== DESKTOP LINKS ==================== */}
        <ul className="fx-nav-links">
          {publicLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`fx-nav-link${isActivePath(link.path) ? ' active' : ''}`}
                onClick={closeMenus}
              >
                {link.name}
              </Link>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <Link
                to="/dashboard"
                className={`fx-nav-link${isActivePath('/dashboard') ? ' active' : ''}`}
                onClick={closeMenus}
              >
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* ==================== RIGHT ACTIONS ==================== */}
        <div className="fx-nav-right">
          {!isMobile && (
            <form
              onSubmit={handleSearchSubmit}
              className="fx-nav-search"
              style={{ width: isSearchExpanded ? 180 : 36 }}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fx-nav-search-input"
              />
              <button
                type={isWideScreen ? 'submit' : 'button'}
                onClick={() => {
                  if (!isWideScreen) {
                    const opening = !isSearchOpen;
                    setIsSearchOpen(opening);
                    if (opening)
                      setTimeout(() => searchInputRef.current?.focus(), 0);
                  }
                }}
                className="fx-nav-search-btn"
                title="Search"
              >
                🔍
              </button>
            </form>
          )}

          {!isMobile && !isAuthenticated && (
            <Link
              to="/contact"
              className="fx-nav-cta desktop-only"
              onClick={closeMenus}
            >
              Get In Touch
            </Link>
          )}

          {!isMobile && isAuthenticated && user && (
            <div className="fx-nav-user-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="fx-nav-user"
                onClick={() => setIsUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="fx-nav-user-avatar">{initials}</div>
                <span className="fx-nav-user-name">
                  {user.displayName.split(' ')[0]}
                </span>
                <span className="fx-nav-user-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="fx-nav-dropdown" role="menu">
                  <div className="fx-nav-drop-head">
                    <p className="fx-nav-drop-name">{user.displayName}</p>
                    <p className="fx-nav-drop-email">{user.email}</p>
                    {user.roles.length > 0 && (
                      <span className="fx-nav-drop-role">
                        {user.roles[0]}
                      </span>
                    )}
                  </div>

                  <Link
                    to="/dashboard"
                    className="fx-nav-drop-item"
                    role="menuitem"
                    onClick={closeMenus}
                  >
                    <span className="fx-nav-drop-item-icon" aria-hidden="true">
                      🏠
                    </span>
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/exam/dashboard"
                    className="fx-nav-drop-item"
                    role="menuitem"
                    onClick={closeMenus}
                  >
                    <span className="fx-nav-drop-item-icon" aria-hidden="true">
                      📝
                    </span>
                    <span>My Exams</span>
                  </Link>

                  {showAdminLink && (
                    <>
                      <div className="fx-nav-drop-sep" />
                      <p className="fx-nav-drop-header">Admin</p>
                      {user.roles.includes('admin') && (
                        <Link
                          to="/exam/admin/subjects"
                          className="fx-nav-drop-item"
                          role="menuitem"
                          onClick={closeMenus}
                        >
                          <span
                            className="fx-nav-drop-item-icon"
                            aria-hidden="true"
                          >
                            📚
                          </span>
                          <span>Subjects</span>
                        </Link>
                      )}
                      {userCanAuthorContent(user) && (
                        <Link
                          to="/exam/admin/questions"
                          className="fx-nav-drop-item"
                          role="menuitem"
                          onClick={closeMenus}
                        >
                          <span
                            className="fx-nav-drop-item-icon"
                            aria-hidden="true"
                          >
                            ❓
                          </span>
                          <span>Question Bank</span>
                        </Link>
                      )}
                      {user.roles.includes('admin') && (
                        <Link
                          to="/exam/admin/exams"
                          className="fx-nav-drop-item"
                          role="menuitem"
                          onClick={closeMenus}
                        >
                          <span
                            className="fx-nav-drop-item-icon"
                            aria-hidden="true"
                          >
                            🧩
                          </span>
                          <span>Exam Builder</span>
                        </Link>
                      )}
                      {userCanViewAudit(user) && (
                        <Link
                          to="/exam/admin/analytics"
                          className="fx-nav-drop-item"
                          role="menuitem"
                          onClick={closeMenus}
                        >
                          <span
                            className="fx-nav-drop-item-icon"
                            aria-hidden="true"
                          >
                            📊
                          </span>
                          <span>Analytics</span>
                        </Link>
                      )}
                      {userCanViewAudit(user) && (
                        <Link
                          to="/exam/admin/audit"
                          className="fx-nav-drop-item"
                          role="menuitem"
                          onClick={closeMenus}
                        >
                          <span
                            className="fx-nav-drop-item-icon"
                            aria-hidden="true"
                          >
                            🔒
                          </span>
                          <span>Audit Log</span>
                        </Link>
                      )}
                    </>
                  )}

                  <div className="fx-nav-drop-sep" />
                  <button
                    type="button"
                    className="fx-nav-drop-item danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <span className="fx-nav-drop-item-icon" aria-hidden="true">
                      🚪
                    </span>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMobile && !isAuthenticated && (
            <Link
              to="/login"
              className="fx-nav-cta"
              onClick={closeMenus}
            >
              Sign in
            </Link>
          )}

          {isMobile && (
            <button
              type="button"
              className="fx-nav-hamburger"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* ==================== MOBILE MENU ==================== */}
      {isMobile && isMobileMenuOpen && (
        <ul className="fx-nav-mobile">
          <li style={{ paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                padding: '6px 10px',
              }}
            >
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                🔍
              </button>
            </form>
          </li>

          {isAuthenticated && user && (
            <li>
              <div className="fx-nav-mobile-user">
                <div className="fx-nav-mobile-user-avatar">{initials}</div>
                <div className="fx-nav-mobile-user-info">
                  <p className="fx-nav-mobile-user-name">
                    {user.displayName}
                  </p>
                  <p className="fx-nav-mobile-user-email">{user.email}</p>
                </div>
              </div>
            </li>
          )}

          {publicLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`fx-nav-mobile-link${isActivePath(link.path) ? ' active' : ''}`}
                onClick={closeMenus}
              >
                {link.name}
              </Link>
            </li>
          ))}

          {isAuthenticated && (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="fx-nav-mobile-link"
                  onClick={closeMenus}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/exam/dashboard"
                  className="fx-nav-mobile-link"
                  onClick={closeMenus}
                >
                  My Exams
                </Link>
              </li>
            </>
          )}

          {showAdminLink && user && (
            <>
              <li className="fx-nav-mobile-sep" aria-hidden="true" />
              <li
                style={{
                  padding: '0 14px 4px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                }}
              >
                Admin
              </li>
              {user.roles.includes('admin') && (
                <li>
                  <Link
                    to="/exam/admin/subjects"
                    className="fx-nav-mobile-link"
                    onClick={closeMenus}
                  >
                    Subjects
                  </Link>
                </li>
              )}
              {userCanAuthorContent(user) && (
                <li>
                  <Link
                    to="/exam/admin/questions"
                    className="fx-nav-mobile-link"
                    onClick={closeMenus}
                  >
                    Question Bank
                  </Link>
                </li>
              )}
              {user.roles.includes('admin') && (
                <li>
                  <Link
                    to="/exam/admin/exams"
                    className="fx-nav-mobile-link"
                    onClick={closeMenus}
                  >
                    Exam Builder
                  </Link>
                </li>
              )}
              {userCanViewAudit(user) && (
                <li>
                  <Link
                    to="/exam/admin/analytics"
                    className="fx-nav-mobile-link"
                    onClick={closeMenus}
                  >
                    Analytics
                  </Link>
                </li>
              )}
              {userCanViewAudit(user) && (
                <li>
                  <Link
                    to="/exam/admin/audit"
                    className="fx-nav-mobile-link"
                    onClick={closeMenus}
                  >
                    Audit Log
                  </Link>
                </li>
              )}
            </>
          )}

          <li style={{ paddingTop: 10 }}>
            {isAuthenticated ? (
              <button
                type="button"
                className="fx-nav-mobile-cta danger"
                onClick={handleLogout}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="fx-nav-mobile-cta"
                  style={{ marginBottom: 8 }}
                  onClick={closeMenus}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="fx-nav-mobile-cta secondary"
                  style={{ marginTop: 8 }}
                  onClick={closeMenus}
                >
                  Create account
                </Link>
              </>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
};