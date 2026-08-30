import React from 'react';
import { cn } from '../../lib/utils';

// StatusBadge — always shows text AND color (WCAG compliant)
export function StatusBadge({ status }) {
  const map = {
    'Submitted':    { cls: 'status-submitted', emoji: '📋' },
    'Under Review': { cls: 'status-review',    emoji: '🔍' },
    'Assigned':     { cls: 'status-assigned',  emoji: '👤' },
    'In Progress':  { cls: 'status-inprogress',emoji: '⚙️' },
    'Resolved':     { cls: 'status-resolved',  emoji: '✅' },
    'Closed':       { cls: 'status-closed',    emoji: '🔒' },
    'Reopened':     { cls: 'status-reopened',  emoji: '🔄' },
    'Escalated':    { cls: 'status-escalated', emoji: '⚠️' },
  };
  const info = map[status] || { cls: 'status-submitted', emoji: '📋' };
  return (
    <span className={cn('badge', info.cls)}>
      <span aria-hidden="true">{info.emoji}</span>
      {status}
    </span>
  );
}

// PriorityBadge — always shows text AND color (WCAG compliant)
export function PriorityBadge({ priority }) {
  const map = {
    'Critical': { color: '#C62828', bg: '#ffebee', border: '#ef9a9a', emoji: '🔴' },
    'High':     { color: '#ED6C02', bg: '#fff3e0', border: '#ffcc80', emoji: '🟠' },
    'Medium':   { color: '#7b5e00', bg: '#fffde7', border: '#fff176', emoji: '🟡' },
    'Low':      { color: '#2E7D32', bg: '#e8f5e9', border: '#a5d6a7', emoji: '🟢' },
  };
  const info = map[priority] || map['Low'];
  return (
    <span
      className="badge"
      style={{ color: info.color, background: info.bg, borderColor: info.border }}
    >
      <span aria-hidden="true">{info.emoji}</span>
      {priority}
    </span>
  );
}

// Skeleton loader
export function Skeleton({ className, style }) {
  return <div className={cn('skeleton', className)} style={style} />;
}

// Card
export function Card({ children, className, style }) {
  return <div className={cn('card', className)} style={style}>{children}</div>;
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {Icon && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            <Icon size={28} />
          </div>
        </div>
      )}
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>{title}</p>
      {description && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>{description}</p>}
      {action}
    </div>
  );
}

// Error state
export function ErrorState({ onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 6 }}>Unable to load data.</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>Please try again.</p>
      {onRetry && <button className="btn btn-outline btn-sm" onClick={onRetry}>Retry</button>}
    </div>
  );
}

// Spinner
export function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// Modal
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-title" className="section-title">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Confirmation modal
export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className={cn('btn btn-sm', danger ? 'btn-danger' : 'btn-primary')} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{description}</p>
    </Modal>
  );
}

// Alert/Info box
export function Alert({ type = 'info', children }) {
  return <div className={cn('alert', `alert-${type}`)}>{children}</div>;
}

// Divider
export function Divider() {
  return <div className="divider" />;
}

// Stat card
export function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {trend && <div style={{ fontSize: '0.75rem', color: trend.up ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 4 }}>
            {trend.up ? '↑' : '↓'} {trend.label}
          </div>}
        </div>
        {Icon && (
          <div className="stat-icon" style={{ background: iconBg || 'var(--color-bg)', color: iconColor || 'var(--color-secondary)' }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

// Breadcrumb
export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {item.href ? <a href={item.href}>{item.label}</a> : <span style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Tabs
export function TabList({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', gap: 0 }} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(tab.value)}
          style={{
            borderRadius: 0,
            borderBottom: active === tab.value ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -2,
            color: active === tab.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: active === tab.value ? 600 : 400,
            padding: '10px 16px',
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ marginLeft: 6, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 999, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Pagination
export function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="pagination">
        <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous">‹</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
          <button key={p} className={cn('page-btn', page === p && 'active')} onClick={() => onChange(p)} aria-current={page === p ? 'page' : undefined}>{p}</button>
        ))}
        {totalPages > 5 && <span style={{ padding: '0 4px', color: 'var(--color-text-secondary)' }}>...</span>}
        <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Next">›</button>
      </div>
    </div>
  );
}

// Search Box
export function SearchBox({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div className="search-box" style={style}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}
