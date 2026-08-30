import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { complaints, notifications } from '../../data/mockData';
import { StatusBadge, PriorityBadge, StatCard, EmptyState } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { FileText, Clock, CheckCircle, AlertTriangle, PlusCircle, Bell, ChevronRight } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const unread = notifications.filter(n => !n.read).length;
  const recentComplaints = complaints.slice(0, 5);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Track and manage your grievances here.
        </p>
      </div>

      {/* Notification banner if unread */}
      {unread > 0 && (
        <Link to="/notifications" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{ background: '#f0f7ff', border: '1px solid #c2d9f0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500 }}>
              You have <strong>{unread}</strong> unread notification{unread > 1 ? 's' : ''}.
            </p>
            <ChevronRight size={16} style={{ color: 'var(--color-secondary)', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Complaints"
          value={total}
          icon={FileText}
          iconBg="#e8f4fd"
          iconColor="var(--color-secondary)"
        />
        <StatCard
          label="Pending Review"
          value={pending}
          icon={Clock}
          iconBg="#fff3e0"
          iconColor="var(--color-warning)"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon={AlertTriangle}
          iconBg="#e3f2fd"
          iconColor="var(--color-secondary)"
        />
        <StatCard
          label="Resolved"
          value={resolved}
          icon={CheckCircle}
          iconBg="var(--color-success-light)"
          iconColor="var(--color-success)"
        />
      </div>

      {/* Recent complaints */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Recent Complaints</h2>
            <p className="section-subtitle">Your latest grievance submissions</p>
          </div>
          <Link to="/complaints" style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {recentComplaints.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Issue</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{c.id}</span></td>
                    <td style={{ maxWidth: 240 }}>
                      <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{c.title.length > 50 ? c.title.slice(0, 50) + '…' : c.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.category}</p>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.department}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(c.submittedDate)}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <Link to={`/complaints/${c.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No complaints found"
            description="You haven't submitted any complaints yet."
            action={
              <Link to="/complaints/new" className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> Register a Complaint
              </Link>
            }
          />
        )}
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--color-primary)', borderRadius: 8, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>Have a new problem to report?</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>Submit a new complaint and track its resolution in real-time.</p>
        </div>
        <Link to="/complaints/new" className="btn" style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 600, flexShrink: 0 }}>
          <PlusCircle size={16} /> Register New Complaint
        </Link>
      </div>
    </div>
  );
}
