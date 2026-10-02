import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navCss = `
.fx-link {
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
}
.fx-link:hover,
.fx-link:focus-visible,
.fx-link.active {
  color: #d95300;
  background-color: rgba(217, 83, 0, 0.06);
}
.fx-link:hover,
.fx-link:focus-visible {
  transform: translateY(-2px);
}
.fx-link:active {
  transform: translateY(0) scale(0.97);
}
.fx-link.mobile {
  width: 100%;
  font-size: 16px;
  padding: 10px 14px;
}

.fx-cta {
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
}
.fx-cta:hover,
.fx-cta:focus-visible {
  background-color: #b54400;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 83, 0, 0.4);
}
.fx-cta:active {
  background-color: #a84000;
  transform: translateY(0) scale(0.97);
}
.fx-cta.mobile {
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px;
  font-size: 15px;
}
`;

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false);
        setIsMobileMenuOpen(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isMobile = windowWidth <= 960;

  const SEARCH_OPEN_BREAKPOINT = 1200;
  const isWideScreen = windowWidth >= SEARCH_OPEN_BREAKPOINT;
  const isSearchExpanded = isWideScreen || isSearchOpen;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'myFlitedux', path: '/myflitedux' },
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: isMobile ? '16px 20px' : '16px 40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(234, 234, 234, 0.8)',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
    fontFamily: 'sans-serif',
    transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
    transition: 'transform 0.3s ease-in-out',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
  };

  const logoIconStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #d95300, #b54400)',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(217, 83, 0, 0.3)',
    overflow: 'hidden',
    flexShrink: 0,
    padding: '2px',
    boxSizing: 'border-box',
  };

  // Image fills the tile, scaled up, nudged 5px down and 1px right
  const logoImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    transform: 'translate(1px, 5px) scale(1.15)',
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.5px',
  };

  const linkContainerStyle: React.CSSProperties = {
    display: isMobile ? 'none' : 'flex',
    alignItems: 'center',
    gap: '4px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };

  const mobileDropdownStyle: React.CSSProperties = {
    display: isMobile && isMobileMenuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    padding: '20px',
    gap: '12px',
    boxSizing: 'border-box',
    listStyle: 'none',
    margin: 0,
  };

  const rightActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const searchFormStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '4px 8px',
    transition: 'all 0.3s ease',
    width: isSearchExpanded ? '180px' : '36px',
    overflow: 'hidden',
  };

  const searchInputStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#1e293b',
    width: '100%',
    padding: '4px',
  };

  const searchToggleBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    fontSize: '16px',
  };

  const hamburgerBtnStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'none',
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#1e293b',
    padding: '4px',
  };

  return (
    <nav style={navStyle}>
      <style>{navCss}</style>

      {/* Logo */}
      <Link to="/" style={logoStyle} onClick={() => setIsMobileMenuOpen(false)}>
        <div style={logoIconStyle}>
          <img
            src="/images/flitedux-logo.png"
            alt="Flitedux Logo"
            style={logoImageStyle}
          />
        </div>
        <span style={logoTextStyle}>Flitedux</span>
      </Link>

      {/* Desktop Navigation Links */}
      <ul style={linkContainerStyle}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`fx-link${isActive ? ' active' : ''}`}
              >
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right Actions */}
      <div style={rightActionsStyle}>
        {!isMobile && (
          <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
            <button
              type={isWideScreen ? 'submit' : 'button'}
              onClick={() => {
                if (!isWideScreen) {
                  const opening = !isSearchOpen;
                  setIsSearchOpen(opening);
                  if (opening) setTimeout(() => searchInputRef.current?.focus(), 0);
                }
              }}
              style={searchToggleBtnStyle}
              title="Search"
            >
              🔍
            </button>
          </form>
        )}

        {!isMobile && (
          <Link to="/contact" className="fx-cta">
            Get In Touch
          </Link>
        )}

        <button
          style={hamburgerBtnStyle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <ul style={mobileDropdownStyle}>
        <li style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
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
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              🔍
            </button>
          </form>
        </li>

        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`fx-link mobile${isActive ? ' active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            </li>
          );
        })}

        <li style={{ paddingTop: '10px' }}>
          <Link
            to="/contact"
            className="fx-cta mobile"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get In Touch
          </Link>
        </li>
      </ul>
    </nav>
  );
};