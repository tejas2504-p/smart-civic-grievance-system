import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { Search, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import ComplaintChat from '../../components/ui/ComplaintChat';

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    
    setLoading(true);
    setResult(null);
    setNotFound(false);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${trackId.trim()}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setNotFound(true);
        toast.error('Complaint not found.');
      }
    } catch (err) {
      setNotFound(true);
      toast.error('Error fetching complaint details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px 0 48px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <Link to="/" style={{ color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--color-secondary)' }}>
            <Search size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Track Your Complaint
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Enter your Complaint ID to check the current status
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            className="form-input"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            placeholder="Enter Complaint ID (e.g. CMP-10245)"
            style={{ flex: 1, fontSize: '1rem', padding: '10px 14px' }}
            aria-label="Complaint ID"
            required
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9375rem' }}>
            <Search size={16} /> {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {notFound && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <div>
              <strong>Complaint Not Found</strong>
              <p style={{ marginTop: 4 }}>No complaint found with ID "{trackId}". Please check the ID and try again.</p>
            </div>
          </div>
        )}

        {result && (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-primary)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{result.id}</span>
                <PriorityBadge priority={result.priority} />
                <StatusBadge status={result.status} />
              </div>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.0625rem' }}>{result.title}</h2>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 16px', fontSize: '0.875rem', marginBottom: 24 }}>
                <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</dt>
                <dd>{result.category}</dd>
                <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Department</dt>
                <dd>{result.department}</dd>
                <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Submitted</dt>
                <dd>{formatDate(result.submittedDate)}</dd>
                <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Expected By</dt>
                <dd>{formatDate(result.expectedResolution)}</dd>
                <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Assigned To</dt>
                <dd>{result.officer?.name || 'Not yet assigned'}</dd>
              </dl>

              <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 16 }}>Progress Timeline</h3>
              {result.timeline.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${item.done ? 'done' : i > 0 && result.timeline[i-1].done ? 'active' : 'pending'}`}>
                    {item.done ? <CheckCircle size={14} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{item.status}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.date || 'Pending'}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary btn-sm">Login to View Full Details</Link>
                <Link to="/" className="btn btn-ghost btn-sm">Back to Home</Link>
              </div>
              
              <div style={{ marginTop: 24 }}>
                <ComplaintChat complaintId={result.id} />
              </div>
            </div>
          </div>
        )}

        {!result && !notFound && (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px 24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 12 }}>Tracking Information</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Enter the exact Complaint ID provided during registration (e.g., MH-2026-0001) to view real-time status updates and communicate with the assigned officer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
