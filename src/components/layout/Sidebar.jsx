import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { useTheme } from '../../store/ThemeContext';
import {
  LayoutDashboard, FileText, PlusCircle, Bell, User,
  BarChart2, Building2, Users, Tag, Clock, Settings,
  HelpCircle, MessageSquare, ChevronLeft, ChevronRight,
  MapPin, FileBarChart, LogOut, Moon, Sun
} from 'lucide-react';

const citizenNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'My Complaints', icon: FileText, to: '/complaints' },
  { label: 'Register Complaint', icon: PlusCircle, to: '/complaints/new', accent: true },
  { label: 'Notifications', icon: Bell, to: '/notifications', badge: true },
  { label: 'Profile', icon: User, to: '/profile' },
];

const officerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/officer' },
  { label: 'Complaints', icon: FileText, to: '/officer/complaints' },
  { label: 'Notifications', icon: Bell, to: '/notifications', badge: true },
  { label: 'Profile', icon: User, to: '/officer/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Complaints', icon: FileText, to: '/admin/complaints' },
  { label: 'Analytics', icon: BarChart2, to: '/admin/analytics' },
  { label: 'Map Dashboard', icon: MapPin, to: '/admin/map' },
  { label: 'Departments', icon: Building2, to: '/admin/departments' },
  { label: 'Officers', icon: Users, to: '/admin/officers' },
  { label: 'Categories', icon: Tag, to: '/admin/categories' },
  { label: 'SLA Management', icon: Clock, to: '/admin/sla' },
  { label: 'Reports', icon: FileBarChart, to: '/admin/reports' },
  { label: 'Notifications', icon: Bell, to: '/notifications', badge: true },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
];

function NavItem({ item, collapsed, unread }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      style={item.accent ? { background: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5', fontWeight: 600 } : undefined}
    >
      <span style={{ position: 'relative', flexShrink: 0 }}>
        <Icon size={18} className="icon" />
        {item.badge && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 14, height: 14, background: 'var(--color-danger)',
            borderRadius: '50%', fontSize: '0.5625rem', fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-hidden="true">{unread > 9 ? '9+' : unread}</span>
        )}
      </span>
      {!collapsed && <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { role, user, logout } = useAuth();
  const { notifications = [] } = useData();
  const navigate = useNavigate();
  const unread = notifications.filter(n => !n.read).length;

  const navItems = role === 'admin' ? adminNav : role === 'officer' ? officerNav : citizenNav;

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  if (!user) return null;

  // Desktop sidebar
  const desktopSidebar = (
    <aside
      className={`sidebar hide-mobile${collapsed ? ' collapsed' : ''}`}
      aria-label="Main navigation"
    >
      {/* Portal info */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px 16px', borderBottom: '1px solid #E5EAF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <div>
            <p style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 650, marginBottom: 2 }}>
              {role === 'admin' ? 'Admin Panel' : role === 'officer' ? 'Officer Panel' : 'Citizen Portal'}
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: 750, color: '#172033', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {typeof user?.name === 'string' ? user.name.split(' ')[0] : 'User'}
            </p>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ color: '#64748B', padding: '4px', marginLeft: 'auto', borderRadius: 6 }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(item => (
          <NavItem key={item.to} item={item} collapsed={collapsed} unread={unread} />
        ))}
      </nav>

      {/* Bottom links */}
      <div style={{ padding: '8px 0', borderTop: '1px solid #E5EAF2' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="sidebar-nav-item"
          style={{ width: 'calc(100% - 20px)', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: isDark ? '#D97706' : '#2563EB' }}
          title={collapsed ? (isDark ? 'Light Theme' : 'Dark Mode') : undefined}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} className="icon" color="#D97706" /> : <Moon size={18} className="icon" color="#2563EB" />}
          {!collapsed && <span>{isDark ? 'Light Theme' : 'Theme Settings'}</span>}
        </button>

        <NavLink to="/help" className="sidebar-nav-item" title={collapsed ? 'Help' : undefined}>
          <HelpCircle size={18} className="icon" />
          {!collapsed && <span>Help</span>}
        </NavLink>
        <NavLink to="/faq" className="sidebar-nav-item" title={collapsed ? 'FAQ' : undefined}>
          <MessageSquare size={18} className="icon" />
          {!collapsed && <span>FAQ</span>}
        </NavLink>
        <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: 'calc(100% - 20px)', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: '#DC2626' }} title={collapsed ? 'Logout' : undefined} aria-label="Logout">
          <LogOut size={18} className="icon" color="#DC2626" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  // Mobile drawer overlay
  const mobileDrawer = mobileOpen ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} className="hide-desktop">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)' }} onClick={onClose} aria-hidden="true" />
      <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 'min(280px, 82vw)', background: '#FFFFFF', borderRight: '1px solid #E5EAF2', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} aria-label="Mobile navigation">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #E5EAF2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 650 }}>
              {role === 'admin' ? 'Admin Panel' : role === 'officer' ? 'Officer Panel' : 'Citizen Portal'}
            </p>
            <p style={{ fontWeight: 750, color: '#172033', fontSize: '0.925rem', marginTop: 2 }}>{typeof user?.name === 'string' ? user.name : 'User'}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close menu" style={{ color: '#64748B', minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`} style={{ ...(item.accent ? { background: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5', fontWeight: 600 } : {}), padding: '12px 18px', fontSize: '0.925rem' }}>
              <item.icon size={19} className="icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '10px 0', borderTop: '1px solid #E5EAF2', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => {
              toggleTheme();
              onClose();
            }}
            className="sidebar-nav-item"
            style={{ width: 'calc(100% - 20px)', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: isDark ? '#D97706' : '#2563EB', padding: '12px 18px', fontSize: '0.925rem' }}
          >
            {isDark ? <Sun size={19} className="icon" color="#D97706" /> : <Moon size={19} className="icon" color="#2563EB" />}
            <span>{isDark ? 'Switch to Light Theme' : 'Theme Settings'}</span>
          </button>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: 'calc(100% - 20px)', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: '#DC2626', padding: '12px 18px', fontSize: '0.925rem' }}>
            <LogOut size={19} className="icon" color="#DC2626" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  ) : null;

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}
