import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, Building2 } from 'lucide-react';

export default function TransparencyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/public`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Public Transparency Data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-danger)' }}>Failed to load data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 'clamp(20px, 4vw, 40px) 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 clamp(12px, 3vw, 24px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)' }}>Public Transparency Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 600, margin: '10px auto 0' }}>
            We believe in open governance. Here is real-time aggregated data on how we are handling civic grievances across the state.
          </p>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: 'clamp(16px, 3vw, 24px)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Grievances</p>
            <p style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '6px 0' }}>{data.total.toLocaleString()}</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: 'clamp(16px, 3vw, 24px)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Resolved</p>
            <p style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: 'var(--color-success)', margin: '6px 0' }}>{data.resolved.toLocaleString()}</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: 'clamp(16px, 3vw, 24px)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Resolution Rate</p>
            <p style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0' }}>{data.resolutionRate}%</p>
          </div>
        </div>

        {/* Department Breakdown */}
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: 'clamp(16px, 3vw, 24px)', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Building2 size={20} color="var(--color-secondary)" />
            <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', fontWeight: 700 }}>Department Performance</h2>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {data.departmentStats.map(dept => (
              <div key={dept.department} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600 }}>{dept.department}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{dept.resolved} / {dept.total} ({dept.rate.toFixed(1)}%)</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${dept.rate}%`, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
