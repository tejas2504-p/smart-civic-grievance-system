import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { StatusBadge, PriorityBadge, StatCard, SearchBox, TabList } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { FileText, Clock, CheckCircle, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { complaints = [], loading } = useData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const assigned = complaints.length;
  const pending = complaints.filter(c => ['Submitted', 'Under Review', 'Assigned'].includes(c.status)).length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const overdue = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;

  const tabs = [
    { value: 'all', label: 'All', count: complaints.length },
    { value: 'pending', label: 'Pending', count: pending },
    { value: 'inprogress', label: 'In Progress', count: inProgress },
    { value: 'overdue', label: 'Overdue', count: overdue },
  ];

  const filtered = complaints.filter(c => {
    const matchSearch = !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && ['Submitted', 'Under Review', 'Assigned'].includes(c.status)) ||
      (activeTab === 'inprogress' && c.status === 'In Progress') ||
      (activeTab === 'overdue' && c.priority === 'Critical' && c.status !== 'Resolved');

    return matchSearch && matchTab;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.375rem)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0] || 'Officer'} 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {user?.department || 'Department Office'} · {user?.designation || 'Officer'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Assigned" value={assigned} icon={FileText} iconBg="#e8f4fd" iconColor="var(--color-secondary)" />
        <StatCard label="Pending" value={pending} icon={Clock} iconBg="#fff3e0" iconColor="var(--color-warning)" />
        <StatCard label="In Progress" value={inProgress} icon={AlertTriangle} iconBg="#e3f2fd" iconColor="var(--color-secondary)" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
        <StatCard label="Overdue" value={overdue} icon={AlertCircle} iconBg="var(--color-danger-light)" iconColor="var(--color-danger)" />
        <StatCard label="Escalated" value={escalated} icon={AlertTriangle} iconBg="#fce4ec" iconColor="#880e4f" />
      </div>

      {/* Complaints table */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 'clamp(12px, 2.5vw, 16px) clamp(12px, 3vw, 20px)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Assigned Complaints</h2>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search complaints..." style={{ marginLeft: 'auto', flex: '1 1 200px', maxWidth: 260 }} />
        </div>
        <div style={{ padding: '0 clamp(12px, 3vw, 20px)' }}>
          <TabList tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading complaints...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No complaints found in this category.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Complaint</th>
                  <th>Priority</th>
                  <th>Citizen</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700 }}>{c.id}</span></td>
                    <td style={{ maxWidth: 240 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{c.title.length > 50 ? c.title.slice(0, 50) + '…' : c.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.category}</p>
                    </td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.citizen?.name || 'Citizen'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(c.submittedDate || c.createdAt)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <Link to={`/officer/complaints/${c.id}`} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
