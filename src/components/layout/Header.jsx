import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import {
  Bell, Search, ChevronDown, Globe,
  LogOut, User, Menu, X, Settings, Headphones
} from 'lucide-react';
import AdMarquee from './AdMarquee';
import ScreenReaderModal from './ScreenReaderModal';


export default function Header({ onMenuToggle, sidebarOpen }) {
  const { t, i18n } = useTranslation();
  const { user, role, logout } = useAuth();
  const { notifications = [] } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLang, setShowLang] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showScreenReader, setShowScreenReader] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: small, 1: normal, 2: large

  const unread = notifications.filter(n => !n.read).length;

  const langOptions = [
    { code: 'en', label: 'English' },
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const handleLogout = () => {
    logout();
    setShowUser(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'officer') return '/officer';
    if (role === 'admin') return '/admin';
    return '/dashboard';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/track?id=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const adjustFontSize = (level) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === 0) root.style.fontSize = '14px';
    else if (level === 1) root.style.fontSize = '16px';
    else if (level === 2) root.style.fontSize = '18px';
  };

  const publicNavLinks = [
    { to: '/', label: 'Home' },
    { to: '/track', label: 'Track Complaint' },
    { to: '/faq', label: 'FAQ' },
    { to: '/help', label: 'Help & Support' },
    { to: '/admin/map', label: 'Issues Map' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Indian Tricolor Accent Line */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%, #138808 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top Government Information Bar */}
      <div
        style={{
          background: '#09223e',
          color: '#cbd5e1',
          padding: '4px clamp(10px, 2.5vw, 20px)',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Government of Maharashtra
          </span>
          <span className="hide-mobile" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
            | महाराष्ट्र शासन
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Skip link */}
          <a
            href="#main-content"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.75rem',
            }}
            className="hide-mobile"
          >
            Skip to main content
          </a>

          {/* Screen Reader Access */}
          <button
            onClick={() => setShowScreenReader(true)}
            className="hide-mobile"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#f1f5f9',
              cursor: 'pointer',
              fontSize: '0.725rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 8px',
              borderRadius: 4,
              transition: 'all 0.15s ease',
              fontWeight: 500,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            aria-label="Screen reader access and live read aloud tool"
            title="Screen Reader Access & Speech Synthesis"
          >
            <Headphones size={12} color="#FF9933" />
            <span>Screen Reader Access</span>
          </button>


          {/* Font Size Adjusters */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 4px' }}>
            <button
              onClick={() => adjustFontSize(0)}
              style={{
                background: fontSizeLevel === 0 ? 'rgba(255,255,255,0.25)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: 2,
              }}
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => adjustFontSize(1)}
              style={{
                background: fontSizeLevel === 1 ? 'rgba(255,255,255,0.25)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: 2,
              }}
              title="Normal Font Size"
            >
              A
            </button>
            <button
              onClick={() => adjustFontSize(2)}
              style={{
                background: fontSizeLevel === 2 ? 'rgba(255,255,255,0.25)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: 2,
              }}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowLang(v => !v);
                setShowUser(false);
                setShowNotif(false);
              }}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                color: '#fff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              aria-label="Select language"
              aria-expanded={showLang}
            >
              <Globe size={12} />
              <span>{langOptions.find(l => l.code === i18n.language)?.label || 'English'}</span>
              <ChevronDown size={11} />
            </button>

            {showLang && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow-md)',
                  minWidth: 120,
                  zIndex: 250,
                  overflow: 'hidden',
                }}
              >
                {langOptions.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setShowLang(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      background: i18n.language === lang.code ? '#e8f4fd' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      color: i18n.language === lang.code ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontWeight: i18n.language === lang.code ? 600 : 400,
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--color-border)',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(10px, 2.5vw, 24px)',
          gap: 'clamp(8px, 2vw, 16px)',
        }}
        role="banner"
      >
        {/* Mobile menu toggle button */}
        <button
          className="btn btn-ghost btn-sm hide-desktop"
          onClick={() => {
            if (user && onMenuToggle) {
              onMenuToggle();
            } else {
              setShowMobileNav(v => !v);
            }
          }}
          aria-label={sidebarOpen || showMobileNav ? 'Close menu' : 'Open menu'}
          style={{ padding: '8px', minWidth: '40px', minHeight: '40px' }}
        >
          {sidebarOpen || showMobileNav ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo & Portal Branding */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 1,
            minWidth: 0,
          }}
          aria-label="Bharat Civic Connect home"
        >
          <img
            src="/logo.jpg"
            alt="Bharat Civic Connect Emblem"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(18,59,99,0.15)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 'clamp(0.925rem, 3.4vw, 1.125rem)',
                fontWeight: 750,
                color: 'var(--color-primary)',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Bharat Civic Connect
            </div>
            <div
              className="hide-mobile"
              style={{
                fontSize: '0.725rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                lineHeight: 1.2,
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              भारत नागरिक सेवा · Government of Maharashtra
            </div>
          </div>
        </Link>

        {/* Navigation links (Desktop) */}
        {!user && (
          <nav
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginLeft: 16,
            }}
            aria-label="Main navigation"
          >
            {publicNavLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive(link.to) ? 650 : 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  background: isActive(link.to) ? '#eef4fa' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div style={{ flex: 1 }} />

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="search-box hide-mobile" style={{ width: 220, position: 'relative' }}>
          <Search size={15} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search complaint ID..."
            aria-label="Search complaint ID"
          />
        </form>

        {/* Logged-In Notifications Bell */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowNotif(v => !v);
                setShowUser(false);
                setShowLang(false);
              }}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              style={{ position: 'relative', padding: '8px' }}
            >
              <Bell size={19} />
              {unread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 17,
                    height: 17,
                    background: 'var(--color-danger)',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  {unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-lg)',
                  width: 340,
                  zIndex: 250,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-bg)',
                  }}
                >
                  <span style={{ fontWeight: 650, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    Notifications
                  </span>
                  <Link
                    to="/notifications"
                    style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 500 }}
                    onClick={() => setShowNotif(false)}
                  >
                    View all
                  </Link>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 4).map((n, i) => (
                      <div
                        key={n._id || n.id || i}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          background: n.read ? 'transparent' : '#f0f7ff',
                        }}
                      >
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                          {n.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Controls */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowUser(v => !v);
                setShowNotif(false);
                setShowLang(false);
              }}
              aria-label="User menu"
              aria-haspopup="menu"
              aria-expanded={showUser}
              style={{
                gap: 8,
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 650,
                }}
              >
                {typeof user?.name === 'string' ? (user.name[0] || 'U') : 'U'}
              </div>
              <div className="hide-mobile" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                  {typeof user?.name === 'string' ? user.name.split(' ')[0] : 'User'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                  {typeof role === 'string' ? role : (role?.role || 'citizen')}
                </div>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            {showUser && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 220,
                  zIndex: 250,
                  overflow: 'hidden',
                }}
                role="menu"
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <p style={{ fontWeight: 650, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{typeof user?.name === 'string' ? user.name : 'User'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{typeof user?.email === 'string' ? user.email : ''}</p>
                  <span className="badge status-submitted" style={{ marginTop: 6, textTransform: 'capitalize', fontSize: '0.7rem' }}>
                    {typeof role === 'string' ? role : (role?.role || 'citizen')}
                  </span>
                </div>
                <Link
                  to={getDashboardPath()}
                  role="menuitem"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 16px', fontSize: '0.8125rem' }}
                  onClick={() => setShowUser(false)}
                >
                  <User size={15} /> Dashboard
                </Link>
                <Link
                  to="/profile"
                  role="menuitem"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 16px', fontSize: '0.8125rem' }}
                  onClick={() => setShowUser(false)}
                >
                  <Settings size={15} /> Profile & Settings
                </Link>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                <button
                  role="menuitem"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-danger)' }}
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link
              to="/login"
              className="btn btn-outline btn-sm hide-mobile"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '7px 16px',
                borderColor: 'var(--color-border-dark)',
              }}
            >
              Login
            </Link>
            <Link
              to="/login"
              className="btn btn-outline btn-sm hide-desktop"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderColor: 'var(--color-border-dark)',
              }}
              aria-label="Login"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-sm hide-mobile"
              style={{
                fontSize: '0.85rem',
                fontWeight: 650,
                padding: '7px 18px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 6px rgba(230,126,34,0.3)',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer for logged-out / public users */}
      {!user && showMobileNav && (
        <div className="hide-desktop" style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(9, 34, 62, 0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowMobileNav(false)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'relative',
              background: '#ffffff',
              borderBottom: '3px solid var(--color-primary)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px 20px 20px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Mobile Search Bar inside Drawer */}
            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setShowMobileNav(false);
              }}
              className="search-box"
              style={{ width: '100%', marginBottom: 14 }}
            >
              <Search size={16} aria-hidden="true" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <input
                type="search"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search complaint ID..."
                aria-label="Search complaint ID"
                style={{ fontSize: '0.9rem' }}
              />
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {publicNavLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMobileNav(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    fontWeight: isActive(link.to) ? 700 : 500,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    background: isActive(link.to) ? '#eef4fa' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{link.label}</span>
                  {isActive(link.to) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '10px 0', paddingTop: 12, display: 'flex', gap: 10 }}>
                <Link
                  to="/login"
                  onClick={() => setShowMobileNav(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem', padding: '10px 14px' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShowMobileNav(false)}
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem', padding: '10px 14px', background: 'var(--color-accent)', color: '#fff' }}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ad Marquee (Continuous moving text ticker with cream background) */}
      <AdMarquee />

      {/* Screen Reader Access & Speech Synthesis Dialog */}
      <ScreenReaderModal
        isOpen={showScreenReader}
        onClose={() => setShowScreenReader(false)}
      />
    </div>
  );
}


