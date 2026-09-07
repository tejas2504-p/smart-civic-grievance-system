import React, { useState, Suspense, lazy } from 'react';
import { complaints } from '../../data/mockData';
import { PriorityBadge, StatusBadge } from '../../components/ui/SharedComponents';
const MapSection = lazy(() => import('../../components/maps/MapSection'));

const PRIORITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUS_FILTERS = ['All', 'In Progress', 'Resolved', 'Submitted', 'Under Review'];

export default function AdminMapPage() {
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const filtered = complaints.filter(c =>
    (priorityFilter === 'All' || c.priority === priorityFilter) &&
    (statusFilter === 'All' || c.status === statusFilter)
  );

  const priorityColors = { Critical: '#C62828', High: '#ED6C02', Medium: '#7b5e00', Low: '#2E7D32' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Government Map Dashboard</h1>
          <p className="page-desc">Interactive geographic view of complaints across the region</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Filters & complaint list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 12 }}>Filters</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="map-priority" style={{ marginBottom: 4 }}>Priority</label>
              <select id="map-priority" className="form-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                {PRIORITY_FILTERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="map-status" style={{ marginBottom: 4 }}>Status</label>
              <select id="map-status" className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUS_FILTERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 10 }}>Map Legend</h3>
            {Object.entries(priorityColors).map(([p, color]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p} Priority</span>
              </div>
            ))}
          </div>

          {/* Complaint list */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {filtered.length} complaint{filtered.length !== 1 ? 's' : ''} shown
              </p>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedComplaint(c)}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    background: selectedComplaint?.id === c.id ? '#f0f7ff' : 'transparent',
                    borderLeft: selectedComplaint?.id === c.id ? '3px solid var(--color-secondary)' : '3px solid transparent',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedComplaint(c)}
                >
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{c.id}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{c.title.slice(0, 40)}…</p>
                  <PriorityBadge priority={c.priority} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Suspense fallback={<div style={{ height: 500, background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-secondary)' }}>Loading map…</p></div>}>
            <MapSection
              lat={selectedComplaint?.location.lat || 18.5204}
              lng={selectedComplaint?.location.lng || 73.8567}
              title={selectedComplaint?.title || 'Pune Region'}
              height={480}
            />
          </Suspense>

          {selectedComplaint && (
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{selectedComplaint.id}</span>
                    <PriorityBadge priority={selectedComplaint.priority} />
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{selectedComplaint.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    📍 {selectedComplaint.location.address}, {selectedComplaint.location.city}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedComplaint(null)} aria-label="Close">✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
