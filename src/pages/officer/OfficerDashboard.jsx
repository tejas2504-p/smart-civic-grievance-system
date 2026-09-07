import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { officerComplaints } from '../../data/mockData';
import { useAuth } from '../../store/AuthContext';
import { StatusBadge, PriorityBadge, StatCard, SearchBox, TabList } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { FileText, Clock, CheckCircle, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const assigned = officerComplaints.length;
  const pending = officerComplaints.filter(c => ['Submitted', 'Under Review', 'Assigned'].includes(c.status)).length;
  const inProgress = officerComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = officerComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const overdue = officerComplaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;
  const escalated = officerComplaints.filter(c => c.status === 'Escalated').length;

  const tabs = [
    { value: 'all', label: 'All', count: officerComplaints.length },
    { value: 'pending', label: 'Pending', count: pending },
    { value: 'inprogress', label: 'In Progress', count: inProgress },
    { value: 'overdue', label: 'Overdue', count: overdue },
  ];

  const filtered = officerComplaints.filter(c => {
    const matchSearch = !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase());
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
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {user?.department} · {user?.designation} · {user?.employeeId}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Assigned" value={assigned} icon={FileText} iconBg="#e8f4fd" iconColor="var(--color-secondary)" />
        <StatCard label="Pending" value={pending} icon={Clock} iconBg="#fff3e0" iconColor="var(--color-warning)" />
        <StatCard label="In Progress" value={inProgress} icon={AlertTriangle} iconBg="#e3f2fd" iconColor="var(--color-secondary)" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
        <StatCard label="Overdue" value={overdue} icon={AlertCircle} iconBg="var(--color-danger-light)" iconColor="var(--color-danger)" />
        <StatCard label="Escalated" value={escalated} icon={AlertTriangle} iconBg="#fce4ec" iconColor="#880e4f" />
      </div>

      {/* Complaints table */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Assigned Complaints</h2>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search complaints..." style={{ marginLeft: 'auto', width: 240 }} />
        </div>
        <div style={{ padding: '0 20px' }}>
          <TabList tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Complaint</th>
                <th>Priority</th>
                <th>Citizen</th>
                <th>Submitted</th>
                <th>SLA</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{c.id}</span></td>
                  <td style={{ maxWidth: 240 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{c.title.length > 50 ? c.title.slice(0, 50) + '…' : c.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.category}</p>
                  </td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.citizen.name}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(c.submittedDate)}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: c.status === 'Resolved' ? 'var(--color-success)' : new Date(c.expectedResolution) < new Date() ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                      {formatDate(c.expectedResolution)}
                    </span>
                  </td>
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
        </div>
      </div>
    </div>
  );
}
