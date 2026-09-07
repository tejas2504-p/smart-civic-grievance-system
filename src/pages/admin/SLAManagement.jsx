import React, { useState } from 'react';
import { slaConfig } from '../../data/mockData';
import { toast } from 'sonner';
import { Clock, Edit, Save } from 'lucide-react';

export default function SLAManagement() {
  const [editing, setEditing] = useState(null);
  const [configs, setConfigs] = useState(slaConfig);

  const priorityColors = {
    Critical: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '#ef9a9a' },
    High: { bg: '#fff3e0', color: 'var(--color-warning)', border: '#ffcc80' },
    Medium: { bg: '#fffde7', color: '#7b5e00', border: '#fff176' },
    Low: { bg: 'var(--color-success-light)', color: 'var(--color-success)', border: '#a5d6a7' },
  };

  const save = (idx, hours) => {
    const updated = [...configs];
    updated[idx] = { ...updated[idx], hours, label: hours >= 24 ? `${hours / 24} Day${hours / 24 > 1 ? 's' : ''}` : `${hours} Hours` };
    setConfigs(updated);
    setEditing(null);
    toast.success('SLA updated successfully.');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Management</h1>
          <p className="page-desc">Define service level agreements for each priority level</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {configs.map((sla, i) => {
          const colors = priorityColors[sla.priority];
          return (
            <div key={sla.priority} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20, borderTop: `4px solid ${colors.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ padding: '4px 12px', background: colors.bg, color: colors.color, borderRadius: 999, fontSize: '0.8125rem', fontWeight: 700 }}>
                  {sla.priority}
                </div>
                {editing === i ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)} style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(i)} aria-label="Edit SLA"><Edit size={14} /></button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Clock size={24} style={{ color: colors.color }} />
                {editing === i ? (
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    <input
                      type="number"
                      defaultValue={sla.hours}
                      min={1}
                      id={`sla-${i}`}
                      className="form-input"
                      style={{ flex: 1, padding: '4px 8px', fontSize: '0.875rem' }}
                      aria-label="Hours"
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => save(i, parseInt(document.getElementById(`sla-${i}`).value) || sla.hours)}>
                      <Save size={13} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.color }}>{sla.label}</span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Complaints with <strong>{sla.priority}</strong> priority must be resolved within {sla.label}.
              </p>
            </div>
          );
        })}
      </div>

      {/* Escalation rules */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Escalation Rules</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>First Escalation</th>
                <th>Second Escalation</th>
                <th>Final Escalation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { priority: 'Critical', first: '12 Hours', second: '18 Hours', final: '24 Hours' },
                { priority: 'High', first: '1 Day', second: '2 Days', final: '3 Days' },
                { priority: 'Medium', first: '3 Days', second: '5 Days', final: '7 Days' },
                { priority: 'Low', first: '7 Days', second: '10 Days', final: '15 Days' },
              ].map(row => (
                <tr key={row.priority}>
                  <td><span style={{ fontWeight: 600 }}>{row.priority}</span></td>
                  <td style={{ fontSize: '0.875rem' }}>{row.first}</td>
                  <td style={{ fontSize: '0.875rem' }}>{row.second}</td>
                  <td style={{ fontSize: '0.875rem' }}>{row.final}</td>
                  <td><button className="btn btn-ghost btn-sm"><Edit size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
