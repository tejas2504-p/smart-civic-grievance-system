import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const tooltipStyle = { fontSize: '0.8125rem', border: '1px solid var(--color-border)', borderRadius: 6 };

function KPICard({ label, value, trend, unit = '' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 20px' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, marginBottom: 6 }}>{value}{unit}</p>
      {trend && (
        <p style={{ fontSize: '0.75rem', color: trend.up ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {trend.label}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [slaStats, setSlaStats] = useState(null);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const [overviewRes, slaRes, trendsRes] = await Promise.all([
          fetch(`${apiUrl}/api/analytics/overview`, { headers }),
          fetch(`${apiUrl}/api/analytics/sla`, { headers }),
          fetch(`${apiUrl}/api/analytics/trends`, { headers })
        ]);
        
        const overviewData = await overviewRes.json();
        const slaData = await slaRes.json();
        const trendsData = await trendsRes.json();

        if (overviewData.success) setOverview(overviewData.data);
        if (slaData.success) setSlaStats(slaData.data);
        if (trendsData.success) setTrends(trendsData.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
      </div>
    );
  }

  // Safely map data for charts
  const categoryChartData = overview?.categoryStats?.map(c => ({ name: c._id || 'Unknown', value: c.count })) || [];
  
  // Create radar data for departments (mocking target 90% for now since we don't store targets per dept)
  const radarData = overview?.departmentStats?.map(d => ({
    dept: d._id || 'Unknown',
    Resolution: overview.total > 0 ? ((d.count / overview.total) * 100).toFixed(1) : 0, // Using count ratio just for visual radar, ideally it's dept resolution rate
    Target: 90
  })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-desc">Deep dive into complaint trends and performance metrics</p>
        </div>
        <select className="form-input" style={{ width: 'auto' }}>
          <option>Last 6 Months</option>
          <option>Last 3 Months</option>
          <option>This Year</option>
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Resolution Rate" value={overview?.resolutionRate || 0} unit="%" />
        <KPICard label="Avg Resolution Time" value={slaStats?.avgResolutionHours || 0} unit=" hrs" />
        <KPICard label="Total Complaints" value={overview?.total || 0} />
        <KPICard label="SLA Compliance" value={slaStats?.complianceRate || 100} unit="%" />
        <KPICard label="Escalation Rate" value={slaStats?.total > 0 ? ((slaStats.escalated / slaStats.total) * 100).toFixed(1) : 0} unit="%" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Complaints Trend</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Monthly volume with resolved overlay</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Area type="monotone" dataKey="complaints" stroke="var(--color-secondary)" fill="#e8f4fd" name="Complaints" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="var(--color-success)" fill="#e8f5e9" name="Resolved" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Department Volume vs Target</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Visualizing load vs target distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <Radar name="Volume Share" dataKey="Resolution" stroke="var(--color-secondary)" fill="var(--color-secondary)" fillOpacity={0.25} />
              <Radar name="Target Share" dataKey="Target" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.1} strokeDasharray="4 4" />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 4 }}>Complaints by Category</h2>
        <p className="section-subtitle" style={{ marginBottom: 16 }}>Volume distribution across issue categories</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryChartData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Complaints" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
