import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import {
  LayoutDashboard, FileText, PlusCircle, Bell, User,
  BarChart2, Building2, Users, Tag, Clock, Settings,
  HelpCircle, MessageSquare, ChevronLeft, ChevronRight,
  MapPin, FileBarChart, LogOut
} from 'lucide-react';
import { notifications as mockNotifs } from '../../data/mockData';

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
      style={item.accent ? { background: 'rgba(230,126,34,0.18)', color: '#f5a623' } : undefined}
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
  const { t } = useTranslation();
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = mockNotifs.filter(n => !n.read).length;

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
      <div style={{ padding: collapsed ? '16px 8px' : '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {role === 'admin' ? 'Admin Panel' : role === 'officer' ? 'Officer Panel' : 'Citizen Portal'}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {user.name?.split(' ')[0]}
            </p>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ color: 'rgba(255,255,255,0.7)', padding: '4px', marginLeft: 'auto' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(item => (
          <NavItem key={item.to} item={item} collapsed={collapsed} unread={unread} />
        ))}
      </nav>

      {/* Bottom links */}
      <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <NavLink to="/help" className="sidebar-nav-item" title={collapsed ? 'Help' : undefined}>
          <HelpCircle size={18} className="icon" />
          {!collapsed && <span>Help</span>}
        </NavLink>
        <NavLink to="/faq" className="sidebar-nav-item" title={collapsed ? 'FAQ' : undefined}>
          <MessageSquare size={18} className="icon" />
          {!collapsed && <span>FAQ</span>}
        </NavLink>
        <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: 'rgba(255,100,100,0.9)' }} title={collapsed ? 'Logout' : undefined} aria-label="Logout">
          <LogOut size={18} className="icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  // Mobile drawer overlay
  const mobileDrawer = mobileOpen ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} className="hide-desktop">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} aria-hidden="true" />
      <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: 'var(--color-sidebar-bg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }} aria-label="Mobile navigation">
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
              {role === 'admin' ? 'Admin Panel' : role === 'officer' ? 'Officer Panel' : 'Citizen Portal'}
            </p>
            <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>{user.name}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close menu" style={{ color: 'rgba(255,255,255,0.7)' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`} style={item.accent ? { color: '#f5a623' } : undefined}>
              <item.icon size={18} className="icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', color: 'rgba(255,100,100,0.9)' }}>
            <LogOut size={18} className="icon" />
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
