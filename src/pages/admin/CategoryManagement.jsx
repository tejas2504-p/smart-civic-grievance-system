import React, { useState } from 'react';
import { categories } from '../../data/mockData';
import { Modal } from '../../components/ui/SharedComponents';
import { toast } from 'sonner';
import { PlusCircle, ChevronRight, Edit, Tag } from 'lucide-react';

export default function CategoryManagement() {
  const [expanded, setExpanded] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-desc">Manage complaint categories, subcategories, and department mappings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusCircle size={16} /> Add Category
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
              role="button"
              tabIndex={0}
              aria-expanded={expanded === cat.id}
              onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === cat.id ? null : cat.id)}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tag size={16} style={{ color: 'var(--color-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{cat.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {cat.subcategories.length} subcategories · {cat.department} · Default: {cat.defaultPriority} · SLA: {cat.slaDays} day{cat.slaDays > 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); toast.info('Edit category coming soon.'); }} aria-label="Edit category">
                  <Edit size={14} />
                </button>
                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', transform: expanded === cat.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>
            </div>
            {expanded === cat.id && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Subcategories</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cat.subcategories.map(sub => (
                      <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>├─</span>
                        <span>{sub}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 2, color: 'var(--color-text-secondary)' }} aria-label={`Edit ${sub}`}><Edit size={12} /></button>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={() => toast.info('Add subcategory coming soon.')}>
                      <PlusCircle size={12} /> Add Subcategory
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
                  {[
                    { label: 'Mapped Department', value: cat.department },
                    { label: 'Default Priority', value: cat.defaultPriority },
                    { label: 'SLA Duration', value: `${cat.slaDays} day${cat.slaDays > 1 ? 's' : ''}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '10px 12px' }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Category"
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { toast.success('Category added.'); setShowAdd(false); }}>Add</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="form-label" htmlFor="cat-name">Category Name <span className="required">*</span></label><input id="cat-name" type="text" className="form-input" /></div>
          <div><label className="form-label" htmlFor="cat-dept">Department <span className="required">*</span></label>
            <select id="cat-dept" className="form-input">
              <option>Road Maintenance</option><option>Water Supply</option><option>Electricity</option><option>Sanitation</option>
            </select>
          </div>
          <div><label className="form-label" htmlFor="cat-pri">Default Priority</label>
            <select id="cat-pri" className="form-input"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
          </div>
          <div><label className="form-label" htmlFor="cat-sla">SLA Days <span className="required">*</span></label><input id="cat-sla" type="number" className="form-input" min={1} placeholder="7" /></div>
        </div>
      </Modal>
    </div>
  );
}
