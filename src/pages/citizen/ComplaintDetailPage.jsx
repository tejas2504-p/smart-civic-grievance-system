import React, { useState, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaints } from '../../data/mockData';
import { StatusBadge, PriorityBadge, Breadcrumb, Alert } from '../../components/ui/SharedComponents';
import { formatDate, formatDateTime } from '../../lib/utils';
import { MapPin, Calendar, User, Clock, Send, CheckCircle, AlertTriangle, Download, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load map to avoid SSR issues
const MapSection = lazy(() => import('../../components/maps/MapSection'));

function Timeline({ items }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="timeline-item">
          <div className={`timeline-dot ${item.done ? 'done' : i > 0 && items[i-1].done ? 'active' : 'pending'}`}>
            {item.done ? <CheckCircle size={14} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: item.done ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', marginBottom: 2 }}>
              {item.status}
            </p>
            {item.date && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: item.note ? 4 : 0 }}>
                {formatDateTime(item.date, item.time)}
              </p>
            )}
            {!item.date && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Pending</p>}
            {item.note && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>{item.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AISection({ ai }) {
  return (
    <div style={{ background: '#f0f7ff', border: '1px solid #b3d4ec', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sparkles size={15} style={{ color: 'var(--color-secondary)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>AI Complaint Analysis</span>
        <span style={{ fontSize: '0.6875rem', background: 'var(--color-secondary)', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 600, marginLeft: 'auto' }}>AI-assisted</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {[
          { label: 'Category', value: ai.category },
          { label: 'Priority', value: ai.priority },
          { label: 'Department', value: ai.department },
          { label: 'Confidence', value: `${ai.confidence}%` },
          { label: 'Duplicate Probability', value: `${ai.duplicateProbability}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #c2d9f0' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Summary</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{ai.summary}</p>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const complaint = complaints.find(c => c.id === id);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(complaint?.conversation || []);
  const [showFeedback, setShowFeedback] = useState(complaint?.status === 'Resolved' && !complaint?.feedback);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  if (!complaint) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: 16 }} />
        <h1 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Complaint Not Found</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>The complaint ID you entered does not exist.</p>
        <Link to="/complaints" className="btn btn-primary">Back to My Complaints</Link>
      </div>
    );
  }

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: prev.length + 1, sender: 'citizen', name: 'You', message: message.trim(), date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
    setMessage('');
    toast.success('Message sent.');
  };

  const submitFeedback = () => {
    if (!rating) { toast.error('Please select a rating.'); return; }
    toast.success('Thank you for your feedback!');
    setShowFeedback(false);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'My Complaints', href: '/complaints' }, { label: complaint.id }]} />

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-secondary)', fontWeight: 700, background: '#e8f4fd', padding: '2px 10px', borderRadius: 4 }}>{complaint.id}</span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{complaint.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-outline btn-sm"><Download size={14} /> Download</button>
            {complaint.status === 'Resolved' && (
              <button className="btn btn-sm" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
                <RotateCcw size={14} /> Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Complaint info */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Complaint Information</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: '0.875rem' }}>
              {[
                { label: 'Complaint ID', value: complaint.id },
                { label: 'Category', value: `${complaint.category} › ${complaint.subcategory}` },
                { label: 'Department', value: complaint.department },
                { label: 'Priority', value: <PriorityBadge priority={complaint.priority} /> },
                { label: 'Submitted', value: formatDate(complaint.submittedDate) },
                { label: 'Expected By', value: formatDate(complaint.expectedResolution) },
                { label: 'Assigned Officer', value: complaint.officer ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} />{complaint.officer.name}</span> : 'Not yet assigned' },
              ].map(({ label, value }) => (
                <React.Fragment key={label}>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{value}</dd>
                </React.Fragment>
              ))}
            </dl>
            <div className="divider" style={{ margin: '16px 0' }} />
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>Description</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{complaint.description}</p>
          </div>

          {/* Location */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h2 className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} /> Location
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16, fontSize: '0.875rem' }}>
              <div><p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 2 }}>Address</p><p>{complaint.location.address}</p></div>
              <div><p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 2 }}>City</p><p>{complaint.location.city}</p></div>
              <div><p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 2 }}>Coordinates</p><p style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{complaint.location.lat}, {complaint.location.lng}</p></div>
              <div><p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 2 }}>PIN Code</p><p>{complaint.location.pincode}</p></div>
            </div>
            <Suspense fallback={<div style={{ height: 280, background: 'var(--color-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading map…</p></div>}>
              <MapSection lat={complaint.location.lat} lng={complaint.location.lng} title={complaint.title} />
            </Suspense>
          </div>

          {/* AI Analysis */}
          {complaint.aiAnalysis && <AISection ai={complaint.aiAnalysis} />}

          {/* Communication */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="section-title">Communication</h2>
              <p className="section-subtitle">Secure conversation with the assigned officer</p>
            </div>
            <div style={{ padding: '16px', minHeight: 120, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem', padding: '24px 0' }}>No messages yet.</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'citizen' ? 'flex-end' : 'flex-start' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{msg.name} · {msg.date} {msg.time}</p>
                  <div className={`message ${msg.sender}`}>{msg.message}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="form-input"
                style={{ flex: 1, resize: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                aria-label="Send a message"
              />
              <button className="btn btn-primary btn-sm" onClick={sendMessage} aria-label="Send message">
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
              <h2 className="section-title" style={{ marginBottom: 6 }}>Rate Your Experience</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                Was your issue resolved satisfactorily? Please share your feedback.
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }} role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    aria-label={`${r} star${r > 1 ? 's' : ''}`}
                    aria-pressed={rating >= r}
                    style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: rating >= r ? '#FFA000' : '#D9DEE5', transition: 'color 0.1s', padding: '0 2px' }}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && <span style={{ marginLeft: 8, fontSize: '0.875rem', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</span>}
              </div>
              <textarea rows={3} className="form-input" placeholder="Write your feedback (optional)..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} style={{ marginBottom: 12, resize: 'none' }} />
              <button className="btn btn-primary btn-sm" onClick={submitFeedback}>Submit Feedback</button>
            </div>
          )}
        </div>

        {/* Right sidebar — Timeline */}
        <div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px', marginBottom: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Complaint Timeline</h2>
            <Timeline items={complaint.timeline} />
          </div>

          {/* SLA info */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> SLA Information
            </h3>
            <div style={{ fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Expected By</span>
                <span style={{ fontWeight: 500 }}>{formatDate(complaint.expectedResolution)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
                <PriorityBadge priority={complaint.priority} />
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span>Progress</span>
                  <span>60%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: 'var(--color-secondary)', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachments.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px', marginTop: 16 }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 12 }}>Attachments</h3>
              {complaint.attachments.map((att, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--color-bg)', borderRadius: 6 }}>
                  <span>📎</span>
                  <span style={{ fontSize: '0.8125rem', flex: 1 }}>{att.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
