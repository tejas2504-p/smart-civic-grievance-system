import React, { useState } from 'react';
import { UserCheck, Shield, X, AlertCircle } from 'lucide-react';
import { officers } from '../../data/mockData';

export default function AssignOfficerModal({ open, onClose, complaint, onAssign }) {
  if (!open || !complaint) return null;

  const [selectedOfficerId, setSelectedOfficerId] = useState(
    complaint.assignedOfficer?.id || complaint.officer?.id || officers[0]?.id || ''
  );
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter officers matching department first, or all active officers
  const deptOfficers = officers.filter(o => o.status === 'active');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const officerObj = officers.find(o => o.id === selectedOfficerId) || {
      id: selectedOfficerId,
      name: 'Department Officer',
      email: 'officer@gov.mh.in',
      department: complaint.department || 'General Administration',
    };

    setSubmitting(true);
    try {
      await onAssign(complaint.id, {
        officerId: officerObj.id,
        officerName: officerObj.name,
        officerEmail: officerObj.email,
        department: officerObj.department || complaint.department,
        remarks: remarks.trim() || `Assigned to ${officerObj.name} for investigation and field resolution.`,
      });
      onClose();
    } catch (err) {
      // Toast handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 id="assign-modal-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Assign Government Officer
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Grievance ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{complaint.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 4 }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Complaint Summary card */}
            <div
              style={{
                background: 'var(--color-bg)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                padding: '12px 14px',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {complaint.title}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                Department: <strong>{complaint.department}</strong> · Priority: <strong>{complaint.priority}</strong>
              </div>
            </div>

            {/* Officer Select Dropdown */}
            <div>
              <label className="form-label" htmlFor="officer-select">
                Select Zonal / Department Officer <span className="required">*</span>
              </label>
              <select
                id="officer-select"
                className="form-input"
                value={selectedOfficerId}
                onChange={e => setSelectedOfficerId(e.target.value)}
                required
              >
                {deptOfficers.map(off => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.employeeId}) — {off.department} · {off.activeCases} active cases
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                The assigned officer will immediately receive a priority work order alert.
              </p>
            </div>

            {/* Assignment Directives / Remarks */}
            <div>
              <label className="form-label" htmlFor="assign-remarks">
                Administrative Directives / Special Instructions (Optional)
              </label>
              <textarea
                id="assign-remarks"
                rows={3}
                className="form-input"
                placeholder="E.g., Conduct physical site inspection within 24 hours and report findings."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Transparency Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: 'var(--color-success)',
              }}
            >
              <Shield size={14} style={{ flexShrink: 0 }} />
              <span>
                <strong>Transparency Guaranteed:</strong> This assignment order and officer details will be instantly reflected on the citizen's tracker and government audit logs.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UserCheck size={14} />
              <span>{submitting ? 'Assigning Officer...' : 'Assign Officer & Advance Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
