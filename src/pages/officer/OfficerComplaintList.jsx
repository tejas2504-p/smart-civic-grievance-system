import React from 'react';
import { Link } from 'react-router-dom';
import { complaints } from '../../data/mockData';
import { StatusBadge, PriorityBadge, SearchBox, Pagination } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function OfficerComplaintList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = complaints.filter(c =>
    !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-desc">All complaints assigned to you</p>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by ID, title..." style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Complaint</th><th>Priority</th><th>Citizen</th><th>Date</th><th>SLA</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{c.id}</span></td>
                  <td style={{ maxWidth: 240 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.title.slice(0, 50)}{c.title.length > 50 ? '…' : ''}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.category}</p>
                  </td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.citizen.name}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{formatDate(c.submittedDate)}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{formatDate(c.expectedResolution)}</td>
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
        <div style={{ padding: '0 20px', borderTop: filtered.length > pageSize ? '1px solid var(--color-border)' : 'none' }}>
          <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
