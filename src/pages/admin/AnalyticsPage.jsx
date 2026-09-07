import React from 'react';
import { Link } from 'react-router-dom';
import { complaintsOverTime, complaintsByCategory, resolutionRate } from '../../data/mockData';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  const radarData = resolutionRate.map(d => ({ dept: d.dept, Resolution: d.rate, Target: 90 }));

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
        <KPICard label="Resolution Rate" value="79" unit="%" trend={{ up: true, label: '+3.2% vs last month' }} />
        <KPICard label="Avg Resolution Time" value="4.2" unit=" days" trend={{ up: false, label: '-0.8 days improvement' }} />
        <KPICard label="Citizen Satisfaction" value="4.1" unit="/5" trend={{ up: true, label: '+0.3 vs last month' }} />
        <KPICard label="SLA Compliance" value="92" unit="%" trend={{ up: true, label: '+1.5%' }} />
        <KPICard label="Escalation Rate" value="2.1" unit="%" trend={{ up: false, label: '-0.5% improvement' }} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Complaints Trend</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Monthly volume with resolved overlay</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={complaintsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Area type="monotone" dataKey="complaints" stroke="var(--color-secondary)" fill="#e8f4fd" name="Complaints" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="var(--color-success)" fill="#e8f5e9" name="Resolved" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Department Resolution vs Target</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Actual rate vs 90% target</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <Radar name="Resolution" dataKey="Resolution" stroke="var(--color-secondary)" fill="var(--color-secondary)" fillOpacity={0.25} />
              <Radar name="Target" dataKey="Target" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.1} strokeDasharray="4 4" />
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
          <BarChart data={complaintsByCategory} margin={{ left: -10 }}>
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
