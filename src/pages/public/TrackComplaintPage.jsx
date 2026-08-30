import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { complaints } from '../../data/mockData';
import { StatusBadge, PriorityBadge } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { Search, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const found = complaints.find(c => c.id.toLowerCase() === trackId.toLowerCase().trim());
    if (found) { setResult(found); setNotFound(false); }
    else { setResult(null); setNotFound(true); toast.error('Complaint not found.'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ color: '#fff', fontWeight: 600 }}>Bharat Civic Connect | भारत नागरिक सेवा</span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
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
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9375rem' }}>
            <Search size={16} /> Track
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
            </div>
          </div>
        )}

        {!result && !notFound && (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px 24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 12 }}>Quick Examples</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>Try one of these complaint IDs:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {complaints.map(c => (
                <button key={c.id} className="btn btn-outline btn-sm" onClick={() => setTrackId(c.id)} style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                  {c.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
