import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge, PriorityBadge, Breadcrumb, Modal, ConfirmModal, Alert } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { CheckCircle, Send, AlertTriangle, ArrowUpCircle, PlusCircle, Sparkles, User, Phone, Mail, MapPin } from 'lucide-react';

export default function OfficerComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  useEffect(() => {
    async function loadComplaint() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getComplaintById(id);
        if (res.success && res.data) {
          setComplaint(res.data);
          setStatus(res.data.status);
          setMessages(res.data.conversation || []);
        }
      } catch (err) {
        setError(err.message || 'Could not load complaint details');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadComplaint();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading complaint...</p>
      </div>
    );
  }

  if (error || !complaint) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <h1>Complaint not found</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>{error}</p>
      <Link to="/officer/complaints" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Complaints</Link>
    </div>
  );

  const handleAction = async (action) => {
    const map = {
      accept: 'Assigned',
      start: 'In Progress',
      resolve: 'Resolved',
      escalate: 'Escalated',
    };
    const targetStatus = map[action];
    if (!targetStatus) return;

    try {
      const res = await api.updateComplaintStatus(complaint.id, {
        status: targetStatus,
        remarks: remark || `Officer updated status to ${targetStatus}`,
      });
      if (res.success && res.data) {
        setComplaint(res.data);
        setStatus(targetStatus);
        toast.success(`Complaint status updated to ${targetStatus}.`);
        setShowResolve(false);
        setShowEscalate(false);
        setRemark('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await api.addRemark(complaint.id, { remarks: message.trim() });
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'officer',
          name: 'Officer',
          message: message.trim(),
          date: new Date().toISOString(),
        },
      ]);
      setMessage('');
      toast.success('Remark added to timeline.');
    } catch (err) {
      toast.error('Could not add remark');
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/officer' }, { label: 'Complaints', href: '/officer/complaints' }, { label: complaint.id }]} />

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 700, background: '#e8f4fd', padding: '3px 10px', borderRadius: 4 }}>{complaint.id}</span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={status} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.05rem, 3vw, 1.125rem)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{complaint.title}</h1>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {status === 'Submitted' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleAction('accept')}>
                Accept Assignment
              </button>
            )}
            {status === 'Assigned' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleAction('start')}>
                <PlusCircle size={14} /> Start Investigation
              </button>
            )}
            {status !== 'Resolved' && status !== 'Closed' && (
              <>
                <button className="btn btn-sm" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }} onClick={() => setShowResolve(true)}>
                  <CheckCircle size={14} /> Mark Resolved
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }} onClick={() => setShowEscalate(true)}>
                  <ArrowUpCircle size={14} /> Escalate
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid-responsive-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Citizen info */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Citizen Information</h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                {complaint.citizen?.name?.[0] || 'C'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{complaint.citizen?.name || 'Citizen'}</p>
                {complaint.citizen?.phone && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Phone size={13} /> {complaint.citizen.phone}</p>}
                {complaint.citizen?.email && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Mail size={13} /> {complaint.citizen.email}</p>}
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> {complaint.location?.address || 'Mumbai'}</p>
              </div>
            </div>
          </div>

          {/* Complaint details */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Complaint Details</h2>
            <dl className="responsive-dl" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</dt>
              <dd>{complaint.category}</dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Priority</dt>
              <dd><PriorityBadge priority={complaint.priority} /></dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Submitted</dt>
              <dd>{formatDate(complaint.submittedDate || complaint.createdAt)}</dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Department</dt>
              <dd>{complaint.department}</dd>
            </dl>
            <div className="divider" style={{ margin: '12px 0' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Description</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{complaint.description}</p>
          </div>

          {/* Remarks input */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Add Official Remark</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter official remark or action taken..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={sendMessage}>
                <Send size={14} /> Submit
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px', marginBottom: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Timeline</h2>
            <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 16, marginLeft: 6 }}>
              {(complaint.timeline || []).map((t, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                  <div style={{ position: 'absolute', left: -21, top: 3, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-secondary)' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{t.status}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{formatDate(t.date)} {t.updatedBy && `· ${t.updatedBy}`}</p>
                  {t.remarks && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{t.remarks}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolve modal */}
      {showResolve && (
        <ConfirmModal
          title="Mark Complaint as Resolved"
          message="Confirm that the on-ground investigation and work is complete."
          confirmLabel="Mark Resolved"
          onConfirm={() => handleAction('resolve')}
          onCancel={() => setShowResolve(false)}
        />
      )}

      {/* Escalate modal */}
      {showEscalate && (
        <ConfirmModal
          title="Escalate Complaint"
          message="Escalate this grievance to higher department authorities."
          confirmLabel="Escalate"
          onConfirm={() => handleAction('escalate')}
          onCancel={() => setShowEscalate(false)}
        />
      )}
    </div>
  );
}
