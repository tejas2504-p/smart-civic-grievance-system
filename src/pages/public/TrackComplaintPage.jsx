import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge, PriorityBadge } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { Search, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const doTrack = async (idToSearch) => {
    if (!idToSearch || !idToSearch.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.trackComplaint(idToSearch.trim());
      if (res.success && res.data) {
        setResult(res.data);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
        toast.error('Complaint not found.');
      }
    } catch (err) {
      setResult(null);
      setNotFound(true);
      toast.error('Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      doTrack(initialId);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    doTrack(trackId);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 'clamp(16px, 3vw, 24px) 0 48px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 clamp(12px, 3vw, 24px)' }}>
        <div style={{ marginBottom: 20 }}>
          <Link to="/" style={{ color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--color-secondary)' }}>
            <Search size={26} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Track Your Complaint
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Enter your Complaint ID to check the official real-time status
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            className="form-input"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            placeholder="Enter Complaint ID (e.g. MH-2026-1024)"
            style={{ flex: '1 1 240px', fontSize: '1rem', padding: '10px 14px' }}
            aria-label="Complaint ID"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px', fontSize: '0.9375rem', flex: '0 0 auto' }}>
            {loading ? 'Searching...' : <><Search size={16} /> Track</>}
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
            <div style={{ background: 'var(--color-primary)', padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{result.id}</span>
                <PriorityBadge priority={result.priority} />
                <StatusBadge status={result.status} />
              </div>
              <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)', fontWeight: 700, color: '#fff', margin: 0 }}>{result.title}</h2>
            </div>

            <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
              <div className="grid-responsive-form" style={{ marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Department</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{result.department}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Category</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{result.category}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Submitted Date</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{formatDate(result.submittedDate)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Current Status</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{result.status}</p>
                </div>
              </div>

              {result.timeline && result.timeline.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Status Timeline</h3>
                  <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 16, marginLeft: 8 }}>
                    {result.timeline.map((step, i) => (
                      <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                        <div style={{ position: 'absolute', left: -22, top: 2, width: 10, height: 10, borderRadius: '50%', background: 'var(--color-secondary)' }} />
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{step.status}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{formatDate(step.date)} {step.remarks && `· ${step.remarks}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
