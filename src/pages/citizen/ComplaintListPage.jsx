import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../store/DataContext';
import { StatusBadge, PriorityBadge, SearchBox, Pagination, EmptyState, TabList } from '../../components/ui/SharedComponents';
import { formatDate, truncate } from '../../lib/utils';
import { FileText, PlusCircle, Filter, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'inprogress' },
  { label: 'Resolved', value: 'resolved' },
];

export default function ComplaintListPage() {
  const { complaints, loading, deleteComplaint } = useData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const pageSize = 10;

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete grievance ${id}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteComplaint(id);
    } catch (err) {
      toast.error(err.message || 'Failed to delete complaint.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = complaints.filter(c => {
    const matchSearch = !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(search.toLowerCase()));

    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && ['Submitted', 'Under Review'].includes(c.status)) ||
      (activeTab === 'inprogress' && ['Assigned', 'In Progress'].includes(c.status)) ||
      (activeTab === 'resolved' && ['Resolved', 'Closed'].includes(c.status));

    return matchSearch && matchTab;
  });

  const tabs = STATUS_TABS.map(t => ({
    ...t,
    count: t.value === 'all' ? complaints.length :
      complaints.filter(c => {
        if (t.value === 'pending') return ['Submitted', 'Under Review'].includes(c.status);
        if (t.value === 'inprogress') return ['Assigned', 'In Progress'].includes(c.status);
        if (t.value === 'resolved') return ['Resolved', 'Closed'].includes(c.status);
        return true;
      }).length,
  }));

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-desc">Track, manage, and monitor all your submitted grievances in real time</p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          <PlusCircle size={16} /> Register Complaint
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Filters row */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by ID, title, category, department..." style={{ flex: 1, minWidth: 220 }} />
          {search && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>
              Clear Search
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 20px' }}>
          <TabList tabs={tabs} active={activeTab} onChange={v => { setActiveTab(v); setPage(1); }} />
        </div>

        {/* Table / List */}
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Loading your complaints...</p>
          </div>
        ) : paginated.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Issue</th>
                  <th>Department</th>
                  <th>Submitted</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700, background: '#EEF4FA', padding: '3px 8px', borderRadius: 4 }}>
                        {c.id}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{truncate(c.title, 55)}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.category}</p>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.department}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(c.submittedDate || c.createdAt)}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Link to={`/complaints/${c.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          View <ChevronRight size={12} />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, c.id)}
                          disabled={deletingId === c.id}
                          className="btn btn-ghost btn-sm"
                          title="Delete complaint"
                          style={{ color: '#dc2626', padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            description={search ? `No results for "${search}"` : "You haven't submitted any complaints in this category yet."}
            action={
              <Link to="/complaints/new" className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> Register a Complaint
              </Link>
            }
          />
        )}

        {/* Pagination */}
        {filtered.length > pageSize && (
          <div style={{ padding: '0 20px', borderTop: '1px solid var(--color-border)' }}>
            <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
