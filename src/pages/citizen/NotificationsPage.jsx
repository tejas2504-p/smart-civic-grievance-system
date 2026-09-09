import React from 'react';
import { useData } from '../../store/DataContext';
import { Bell, CheckCircle, FileText, User, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/utils';

const iconMap = {
  status_change: FileText,
  message: User,
  resolved: CheckCircle,
  assignment: AlertTriangle,
  sla: Clock,
};

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-desc">Stay updated on your complaint activity in real time</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllNotificationsAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Bell size={44} style={{ color: 'var(--color-border)', marginBottom: 14 }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>No notifications</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>You will receive updates here when your grievance status changes.</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const Icon = iconMap[n.type] || Bell;
            const notifId = n._id || n.id;
            return (
              <div
                key={notifId || i}
                onClick={() => !n.read && markNotificationAsRead(notifId)}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: n.read ? 'transparent' : '#f0f7ff',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.read ? 'var(--color-bg)' : '#c2d9f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: n.read ? 'var(--color-text-secondary)' : 'var(--color-secondary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                      {n.title}
                    </p>
                    {n.createdAt && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatDateTime(n.createdAt)}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: n.complaintId ? 8 : 0 }}>
                    {n.message}
                  </p>
                  {n.complaintId && (
                    <Link
                      to={`/complaints/${n.complaintId}`}
                      style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}
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
          })
        )}
      </div>
    </div>
  );
}
