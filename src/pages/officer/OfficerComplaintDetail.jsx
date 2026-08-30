import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaints } from '../../data/mockData';
import { StatusBadge, PriorityBadge, Breadcrumb, Modal, ConfirmModal, Alert } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { CheckCircle, Send, AlertTriangle, ArrowUpCircle, MessageSquare, PlusCircle, Sparkles, User, Phone, Mail, MapPin } from 'lucide-react';
import { Suspense, lazy } from 'react';
const MapSection = lazy(() => import('../../components/maps/MapSection'));

export default function OfficerComplaintDetail() {
  const { id } = useParams();
  const complaint = complaints.find(c => c.id === id);
  const [status, setStatus] = useState(complaint?.status);
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(complaint?.conversation || []);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  if (!complaint) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <h1>Complaint not found</h1>
      <Link to="/officer/complaints" className="btn btn-primary" style={{ marginTop: 16 }}>Back</Link>
    </div>
  );

  const handleAction = (action) => {
    const map = {
      accept: 'Assigned',
      start: 'In Progress',
      resolve: 'Resolved',
    };
    if (map[action]) {
      setStatus(map[action]);
      toast.success(`Complaint ${map[action].toLowerCase()}.`);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: prev.length + 1, sender: 'officer', name: 'Officer (You)', message: message.trim(), date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
    setMessage('');
    toast.success('Message sent to citizen.');
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/officer' }, { label: 'Complaints', href: '/officer/complaints' }, { label: complaint.id }]} />

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-secondary)', fontWeight: 700, background: '#e8f4fd', padding: '2px 10px', borderRadius: 4 }}>{complaint.id}</span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={status} />
            </div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{complaint.title}</h1>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Citizen info */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Citizen Information</h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                {complaint.citizen.name[0]}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{complaint.citizen.name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Phone size={13} /> {complaint.citizen.mobile}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Mail size={13} /> {complaint.citizen.email}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> {complaint.location.address}, {complaint.location.city}</p>
              </div>
            </div>
          </div>

          {/* Complaint details */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Complaint Details</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 16px', fontSize: '0.875rem', marginBottom: 16 }}>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</dt>
              <dd>{complaint.category} › {complaint.subcategory}</dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Priority</dt>
              <dd><PriorityBadge priority={complaint.priority} /></dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Submitted</dt>
              <dd>{formatDate(complaint.submittedDate)}</dd>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Due By</dt>
              <dd>{formatDate(complaint.expectedResolution)}</dd>
            </dl>
            <div className="divider" style={{ margin: '12px 0' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Description</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{complaint.description}</p>
          </div>

          {/* AI Analysis */}
          {complaint.aiAnalysis && (
            <div style={{ background: '#f0f7ff', border: '1px solid #b3d4ec', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={15} style={{ color: 'var(--color-secondary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>AI Analysis</span>
                <span style={{ fontSize: '0.6875rem', background: 'var(--color-secondary)', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 600, marginLeft: 'auto' }}>AI-assisted</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.875rem' }}>
                <div><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Priority</p><p>{complaint.aiAnalysis.priority}</p></div>
                <div><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Confidence</p><p>{complaint.aiAnalysis.confidence}%</p></div>
                <div><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Duplicate Prob.</p><p>{complaint.aiAnalysis.duplicateProbability}%</p></div>
              </div>
              <p style={{ marginTop: 10, fontSize: '0.8125rem', paddingTop: 10, borderTop: '1px solid #c2d9f0' }}>{complaint.aiAnalysis.summary}</p>
            </div>
          )}

          {/* Map */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Location</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>{complaint.location.address}, {complaint.location.city} — {complaint.location.lat}, {complaint.location.lng}</p>
            <Suspense fallback={<div style={{ height: 250, background: 'var(--color-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-secondary)' }}>Loading map…</p></div>}>
              <MapSection lat={complaint.location.lat} lng={complaint.location.lng} title={complaint.title} height={250} />
            </Suspense>
          </div>

          {/* Officer remark */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Add Remark</h2>
            <textarea rows={3} className="form-input" placeholder="Add your investigation notes or action taken..." value={remark} onChange={e => setRemark(e.target.value)} style={{ marginBottom: 10, resize: 'vertical' }} />
            <button className="btn btn-outline btn-sm" onClick={() => { if (remark.trim()) { toast.success('Remark saved.'); setRemark(''); } }}>
              Save Remark
            </button>
          </div>

          {/* Communication */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="section-title">Communication with Citizen</h2>
            </div>
            <div style={{ padding: '16px', minHeight: 100, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>No messages yet.</p>}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'officer' ? 'flex-end' : 'flex-start' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{msg.name} · {msg.date}</p>
                  <div className={`message ${msg.sender}`}>{msg.message}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Send a message to the citizen..." rows={2} className="form-input" style={{ flex: 1, resize: 'none' }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
              <button className="btn btn-primary btn-sm" onClick={sendMessage}><Send size={14} /></button>
            </div>
          </div>
        </div>

        {/* Timeline sidebar */}
        <div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Timeline</h2>
            {complaint.timeline.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot ${item.done ? 'done' : i > 0 && complaint.timeline[i-1].done ? 'active' : 'pending'}`}>
                  {item.done ? <CheckCircle size={14} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{item.status}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.date || 'Pending'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px', marginTop: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {status === 'Submitted' && <button className="btn btn-primary btn-sm" onClick={() => handleAction('accept')} style={{ justifyContent: 'flex-start' }}><CheckCircle size={14} /> Accept Complaint</button>}
              {status === 'Assigned' && <button className="btn btn-primary btn-sm" onClick={() => handleAction('start')} style={{ justifyContent: 'flex-start' }}><PlusCircle size={14} /> Start Investigation</button>}
              <button className="btn btn-outline btn-sm" onClick={() => toast.info('Request for information sent.')} style={{ justifyContent: 'flex-start' }}><MessageSquare size={14} /> Request Information</button>
              {status !== 'Resolved' && (
                <button className="btn btn-sm" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success)', justifyContent: 'flex-start' }} onClick={() => setShowResolve(true)}>
                  <CheckCircle size={14} /> Mark Resolved
                </button>
              )}
              <button className="btn btn-sm" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', justifyContent: 'flex-start' }} onClick={() => setShowEscalate(true)}>
                <ArrowUpCircle size={14} /> Escalate
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal open={showResolve} onClose={() => setShowResolve(false)} onConfirm={() => { handleAction('resolve'); setShowResolve(false); }} title="Mark as Resolved" description="Are you sure you want to mark this complaint as resolved? The citizen will be notified." confirmLabel="Mark Resolved" />
      <ConfirmModal open={showEscalate} onClose={() => setShowEscalate(false)} onConfirm={() => { toast.warning('Complaint escalated.'); setShowEscalate(false); }} title="Escalate Complaint" description="This will escalate the complaint to the department head. Do you want to proceed?" confirmLabel="Escalate" danger />
    </div>
  );
}
