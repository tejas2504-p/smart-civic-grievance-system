import React from 'react';
import { notifications as mockNotifs } from '../../data/mockData';
import { Bell, CheckCircle, FileText, User, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const iconMap = {
  status_change: FileText,
  message: User,
  resolved: CheckCircle,
  assignment: AlertTriangle,
  sla: Clock,
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(mockNotifs);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-desc">Stay updated on your complaint activity</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Bell size={48} style={{ color: 'var(--color-border)', marginBottom: 16 }} />
            <p style={{ fontWeight: 600 }}>No notifications</p>
          </div>
        )}
        {notifs.map((n, i) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <div
              key={n.id}
              style={{
                padding: '16px 20px',
                borderBottom: i < notifs.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: n.read ? 'transparent' : '#f0f7ff',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.read ? 'var(--color-bg)' : '#c2d9f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color: n.read ? 'var(--color-text-secondary)' : 'var(--color-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>{n.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{n.date} · {n.time}</p>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: n.complaintId ? 8 : 0 }}>{n.message}</p>
                {n.complaintId && (
                  <Link
                    to={`/complaints/${n.complaintId}`}
                    style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 500, textDecoration: 'none' }}
                  >
                    View Complaint {n.complaintId} →
                  </Link>
                )}
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-secondary)', flexShrink: 0, marginTop: 6 }} aria-label="Unread" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
