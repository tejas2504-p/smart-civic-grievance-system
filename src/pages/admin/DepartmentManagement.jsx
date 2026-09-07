import React, { useState } from 'react';
import { departments } from '../../data/mockData';
import { SearchBox, Modal, ConfirmModal } from '../../components/ui/SharedComponents';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Eye, Building2 } from 'lucide-react';

export default function DepartmentManagement() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = departments.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Department Management</h1>
          <p className="page-desc">Manage government departments and their assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusCircle size={16} /> Add Department
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search departments..." style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th style={{ textAlign: 'right' }}>Officers</th>
                <th style={{ textAlign: 'right' }}>Complaints</th>
                <th style={{ textAlign: 'right' }}>Pending</th>
                <th style={{ textAlign: 'right' }}>Resolved</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={15} style={{ color: 'var(--color-secondary)' }} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{d.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}>{d.code}</span></td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem' }}>{d.officers}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem' }}>{d.complaints}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem', color: d.pending > 50 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{d.pending}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-success)' }}>{d.resolved}</td>
                  <td>
                    <span className={`badge ${d.status === 'active' ? 'status-resolved' : 'status-closed'}`}>
                      {d.status === 'active' ? '✓ Active' : '✕ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" aria-label="View details" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" aria-label="Edit department" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" aria-label="Delete department" title="Delete" style={{ color: 'var(--color-danger)' }} onClick={() => { setSelected(d); setShowDelete(true); }}>
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

      {/* Add Department Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Department"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => { toast.success('Department added.'); setShowAdd(false); }}>Add Department</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" htmlFor="dept-name">Department Name <span className="required">*</span></label>
            <input id="dept-name" type="text" className="form-input" placeholder="e.g. Road Maintenance" />
          </div>
          <div>
            <label className="form-label" htmlFor="dept-code">Department Code <span className="required">*</span></label>
            <input id="dept-code" type="text" className="form-input" placeholder="e.g. RDM" maxLength={5} />
          </div>
          <div>
            <label className="form-label" htmlFor="dept-head">Head of Department</label>
            <input id="dept-head" type="text" className="form-input" placeholder="Department head name" />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { toast.success(`${selected?.name} has been deleted.`); setShowDelete(false); }} title="Delete Department" description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}
