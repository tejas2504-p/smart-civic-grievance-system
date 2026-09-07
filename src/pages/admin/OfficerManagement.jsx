import React, { useState } from 'react';
import { officers } from '../../data/mockData';
import { SearchBox, Modal, ConfirmModal } from '../../components/ui/SharedComponents';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Eye, User, BarChart2 } from 'lucide-react';

export default function OfficerManagement() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = officers.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.employeeId.toLowerCase().includes(search.toLowerCase()) || o.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Management</h1>
          <p className="page-desc">Manage government officers and their assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusCircle size={16} /> Add Officer
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name, employee ID, department..." style={{ maxWidth: 360 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th style={{ textAlign: 'right' }}>Active Cases</th>
                <th style={{ textAlign: 'right' }}>Resolved</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                        {o.name[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{o.employeeId}</span></td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{o.department}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: o.activeCases > 15 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{o.activeCases}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-success)' }}>{o.resolved}</td>
                  <td>
                    <span className={`badge ${o.status === 'active' ? 'status-resolved' : 'status-closed'}`}>
                      {o.status === 'active' ? '✓ Active' : '✕ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="View Performance"><BarChart2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" title="Edit"><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--color-danger)' }} onClick={() => { setSelected(o); setShowDelete(true); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Officer"
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { toast.success('Officer added.'); setShowAdd(false); }}>Add Officer</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="form-label" htmlFor="off-name">Full Name <span className="required">*</span></label><input id="off-name" type="text" className="form-input" placeholder="Officer name" /></div>
          <div><label className="form-label" htmlFor="off-emp">Employee ID <span className="required">*</span></label><input id="off-emp" type="text" className="form-input" placeholder="EMP-0000" /></div>
          <div><label className="form-label" htmlFor="off-email">Email <span className="required">*</span></label><input id="off-email" type="email" className="form-input" placeholder="officer@gov.mh.in" /></div>
          <div><label className="form-label" htmlFor="off-dept">Department <span className="required">*</span></label>
            <select id="off-dept" className="form-input">
              <option>Road Maintenance</option>
              <option>Water Supply</option>
              <option>Electricity</option>
              <option>Sanitation</option>
            </select>
          </div>
        </div>
      </Modal>
      <ConfirmModal open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { toast.success(`${selected?.name} removed.`); setShowDelete(false); }} title="Remove Officer" description={`Are you sure you want to remove "${selected?.name}" from the system?`} confirmLabel="Remove" danger />
    </div>
  );
}
