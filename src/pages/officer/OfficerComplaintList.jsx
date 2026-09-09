import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../store/DataContext';
import { StatusBadge, PriorityBadge, SearchBox, Pagination } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

export default function OfficerComplaintList() {
  const { complaints = [], loading } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = complaints.filter(c =>
    !search ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Complaints</h1>
          <p className="page-desc">All grievances assigned to your department and office</p>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by ID, title, category..." style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading complaints...</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No complaints found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Complaint</th>
                  <th>Priority</th>
                  <th>Citizen</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700 }}>{c.id}</span></td>
                    <td style={{ maxWidth: 240 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title.slice(0, 50)}{c.title.length > 50 ? '…' : ''}</p>
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
        {filtered.length > pageSize && (
          <div style={{ padding: '0 20px', borderTop: '1px solid var(--color-border)' }}>
            <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
