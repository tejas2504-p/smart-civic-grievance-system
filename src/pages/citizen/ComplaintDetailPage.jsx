import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useData } from '../../store/DataContext';
import { StatusBadge, PriorityBadge, Breadcrumb, Alert } from '../../components/ui/SharedComponents';
import { formatDate, formatDateTime } from '../../lib/utils';
import { MapPin, Calendar, User, Clock, Send, CheckCircle, AlertTriangle, Download, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load map to avoid SSR issues
const MapSection = lazy(() => import('../../components/maps/MapSection'));

function Timeline({ items = [] }) {
  if (!items || items.length === 0) {
    return <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>No timeline events recorded.</p>;
  }

  return (
    <div>
      {items.map((item, i) => {
        const isLatest = i === items.length - 1;
        return (
          <div key={i} className="timeline-item">
            <div className={`timeline-dot ${isLatest ? 'active' : 'done'}`}>
              <CheckCircle size={14} />
            </div>
            <div style={{ paddingBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {item.status}
              </p>
              {item.date && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: item.remarks ? 4 : 0 }}>
                  {formatDateTime(item.date)}
                  {item.updatedBy && ` · ${item.updatedBy}`}
                </p>
              )}
              {item.remarks && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>
                  {item.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteComplaint } = useData();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Fetch real complaint from MongoDB Atlas
  useEffect(() => {
    let isMounted = true;

    async function fetchComplaint() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getComplaintById(id);
        if (isMounted && res.success && res.data) {
          setComplaint(res.data);
          setMessages(res.data.conversation || []);
          setShowFeedback(res.data.status === 'Resolved' && !res.data.feedback);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not load grievance details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchComplaint();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!complaint) return;
    if (!window.confirm(`Are you sure you want to delete grievance ${complaint.id}? This will permanently remove it from MongoDB.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteComplaint(complaint.id);
      navigate('/complaints');
    } catch (err) {
      toast.error(err.message || 'Could not delete complaint.');
      setDeleting(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !complaint) return;
    try {
      await api.addRemark(complaint.id, { remarks: message.trim() });
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'citizen',
          name: 'You',
          message: message.trim(),
          date: new Date().toISOString(),
        },
      ]);
      setMessage('');
      toast.success('Remark added to timeline.');
    } catch (err) {
      toast.error('Could not submit remark.');
    }
  };

  const submitFeedback = () => {
    if (!rating) {
      toast.error('Please select a rating.');
      return;
    }
    toast.success('Thank you for your feedback!');
    setShowFeedback(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Loading grievance details from database...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: 16 }} />
        <h1 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Complaint Not Found or Access Denied</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          {error || 'The complaint ID you entered does not exist or you do not have permission to view it.'}
        </p>
        <Link to="/complaints" className="btn btn-primary">Back to My Complaints</Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'My Complaints', href: '/complaints' }, { label: complaint.id }]} />

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 700, background: '#e8f4fd', padding: '3px 10px', borderRadius: 4 }}>
                {complaint.id}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
              {complaint.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-outline btn-sm"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Grievance'}
            </button>
            {complaint.status === 'Resolved' && (
              <button className="btn btn-sm" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
                <RotateCcw size={14} /> Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid-responsive-sidebar">
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Complaint info */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Complaint Information</h2>
            <dl className="responsive-dl" style={{ fontSize: '0.875rem' }}>
              {[
                { label: 'Complaint ID', value: complaint.id },
                { label: 'Category', value: complaint.category },
                { label: 'Department', value: complaint.department },
                { label: 'Priority', value: <PriorityBadge priority={complaint.priority} /> },
                { label: 'Submitted', value: formatDate(complaint.submittedDate || complaint.createdAt) },
                { label: 'Assigned Officer', value: complaint.assignedOfficer?.name || complaint.officer?.name || 'Assigned to Department' },
                { label: 'Location', value: complaint.location?.address ? `${complaint.location.address}, ${complaint.location.city || ''}` : 'Mumbai' },
              ].map(({ label, value }) => (
                <React.Fragment key={label}>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{value}</dd>
                </React.Fragment>
              ))}
            </dl>
            <div className="divider" style={{ margin: '16px 0' }} />
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>Description</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {complaint.description}
            </p>
          </div>

          {/* Remarks & Citizen Communication */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
            <h2 className="section-title" style={{ marginBottom: 14 }}>Citizen Remarks & Communication</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add an update or additional detail to this grievance..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex: '1 1 200px' }}
              />
              <button className="btn btn-primary btn-sm" onClick={sendMessage} aria-label="Send remark">
                <Send size={14} /> Send
              </button>
            </div>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
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
                <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
                <span style={{ fontWeight: 600 }}>{complaint.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
                <PriorityBadge priority={complaint.priority} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Department</span>
                <span>{complaint.department}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
