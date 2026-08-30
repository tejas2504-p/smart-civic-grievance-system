import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import {
  Bell, Search, ChevronDown, Globe, HelpCircle,
  LogOut, User, Menu, X, Settings
} from 'lucide-react';
import { notifications as mockNotifs } from '../../data/mockData';

export default function Header({ onMenuToggle, sidebarOpen }) {
  const { t, i18n } = useTranslation();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [showLang, setShowLang] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const unread = mockNotifs.filter(n => !n.read).length;

  const langOptions = [
    { code: 'en', label: 'English' },
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'officer') return '/officer';
    if (role === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--color-border)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 12,
      }}
      role="banner"
    >
      {/* Mobile menu toggle */}
      {user && (
        <button
          className="btn btn-ghost btn-sm hide-desktop"
          onClick={onMenuToggle}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          style={{ padding: '6px' }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Logo + Portal name */}
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
        aria-label="Bharat Civic Connect home"
      >
        {/* Government Emblem */}
        <img
          src="/logo.jpg"
          alt="Bharat Civic Connect Logo"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
        <div className="hide-mobile">
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2 }}>
            Bharat Civic Connect
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
            भारत नागरिक सेवा
          </div>
        </div>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Search — desktop only */}
      <div className="search-box hide-mobile" style={{ width: 240 }}>
        <Search size={15} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="search"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search complaints..."
          aria-label="Search complaints"
        />
      </div>

      {/* Language selector */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setShowLang(v => !v); setShowUser(false); setShowNotif(false); }}
          aria-label="Select language"
          aria-haspopup="listbox"
          aria-expanded={showLang}
          style={{ gap: 4, padding: '6px 8px' }}
        >
          <Globe size={16} />
          <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>
            {langOptions.find(l => l.code === i18n.language)?.label || 'English'}
          </span>
          <ChevronDown size={14} />
        </button>
        {showLang && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: 6, boxShadow: 'var(--shadow-md)', minWidth: 130, zIndex: 200,
          }} role="listbox" aria-label="Language options">
            {langOptions.map(lang => (
              <button
                key={lang.code}
                role="option"
                aria-selected={i18n.language === lang.code}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 14px', fontSize: '0.8125rem', fontWeight: i18n.language === lang.code ? 600 : 400 }}
                onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false); }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      <Link to="/help" className="btn btn-ghost btn-sm" aria-label="Help" style={{ padding: '6px 8px' }}>
        <HelpCircle size={18} />
      </Link>

      {/* Notifications */}
      {user && (
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setShowNotif(v => !v); setShowUser(false); setShowLang(false); }}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            style={{ position: 'relative', padding: '6px 8px' }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                background: 'var(--color-danger)', color: '#fff', borderRadius: '50%',
                fontSize: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} aria-hidden="true">{unread}</span>
            )}
          </button>
          {showNotif && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 8, boxShadow: 'var(--shadow-md)', width: 340, zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                <Link to="/notifications" style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }} onClick={() => setShowNotif(false)}>View all</Link>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {mockNotifs.slice(0, 4).map(n => (
                  <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: n.read ? 'transparent' : '#f0f7ff' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{n.message}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{n.date} · {n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User menu */}
      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setShowUser(v => !v); setShowNotif(false); setShowLang(false); }}
            aria-label="User menu"
            aria-haspopup="menu"
            aria-expanded={showUser}
            style={{ gap: 6, padding: '6px 8px' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 600 }}>
              {user.name?.[0] || 'U'}
            </div>
            <span className="hide-mobile" style={{ fontSize: '0.8125rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} />
          </button>
          {showUser && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 8, boxShadow: 'var(--shadow-md)', minWidth: 200, zIndex: 200,
            }} role="menu">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{user.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{user.email}</p>
                <span className="badge status-submitted" style={{ marginTop: 4, textTransform: 'capitalize' }}>{role}</span>
              </div>
              <Link to={getDashboardPath()} role="menuitem" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', fontSize: '0.8125rem' }} onClick={() => setShowUser(false)}>
                <User size={15} /> Dashboard
              </Link>
              <Link to="/profile" role="menuitem" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', fontSize: '0.8125rem' }} onClick={() => setShowUser(false)}>
                <Settings size={15} /> Profile & Settings
              </Link>
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
              <button role="menuitem" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', fontSize: '0.8125rem', color: 'var(--color-danger)' }} onClick={handleLogout}>
                <LogOut size={15} /> {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
      )}
    </header>
  );
}
