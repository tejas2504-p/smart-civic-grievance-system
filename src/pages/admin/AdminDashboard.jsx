import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';
import { adminStats, complaintsByCategory as mockCat, complaintsByDept as mockDept, complaintsOverTime, resolutionRate } from '../../data/mockData';
import { StatCard } from '../../components/ui/SharedComponents';
import { FileText, Clock, CheckCircle, AlertCircle, AlertTriangle, TrendingUp, Building2, Users } from 'lucide-react';

const COLORS = ['#123B63', '#1D5D91', '#2E7D32', '#E67E22', '#C62828', '#5c35b8', '#00796b'];

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 20px 12px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = { fontSize: '0.8125rem', border: '1px solid var(--color-border)', borderRadius: 6 };

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: adminStats.totalComplaints,
    today: adminStats.todayComplaints,
    pending: adminStats.pending,
    resolved: adminStats.resolved,
    critical: adminStats.critical,
    slaBreach: adminStats.slaBreach,
    departments: adminStats.departments,
    officers: adminStats.officers,
    categoryData: mockCat,
    deptData: mockDept,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAnalytics();
        if (res?.success && res.data) {
          const d = res.data;
          const catData = d.categoryStats && d.categoryStats.length > 0
            ? d.categoryStats.map(c => ({ name: c._id || 'General', value: c.count }))
            : mockCat;

          const deptData = d.departmentStats && d.departmentStats.length > 0
            ? d.departmentStats.map(dp => ({ name: dp._id?.split(' ')[0] || 'Dept', complaints: dp.count, resolved: 0 }))
            : mockDept;

          setStats({
            total: d.total ?? adminStats.totalComplaints,
            today: d.today ?? adminStats.todayComplaints,
            pending: d.pending ?? adminStats.pending,
            resolved: d.resolved ?? adminStats.resolved,
            critical: d.critical ?? adminStats.critical,
            slaBreach: adminStats.slaBreach,
            departments: d.departmentStats?.length || adminStats.departments,
            officers: adminStats.officers,
            categoryData: catData,
            deptData: deptData,
          });
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-desc">Portal overview and analytics</p>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Complaints" value={stats.total.toLocaleString()} icon={FileText} iconBg="#e8f4fd" iconColor="var(--color-secondary)" />
        <StatCard label="Today's Complaints" value={stats.today} icon={TrendingUp} iconBg="#fff3e0" iconColor="var(--color-warning)" trend={{ up: true, label: '+12% vs yesterday' }} />
        <StatCard label="Pending" value={stats.pending.toLocaleString()} icon={Clock} iconBg="#fff3e0" iconColor="var(--color-warning)" />
        <StatCard label="Resolved" value={stats.resolved.toLocaleString()} icon={CheckCircle} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
        <StatCard label="Critical" value={stats.critical} icon={AlertCircle} iconBg="var(--color-danger-light)" iconColor="var(--color-danger)" />
        <StatCard label="SLA Breached" value={stats.slaBreach} icon={AlertTriangle} iconBg="#fce4ec" iconColor="#880e4f" />
        <StatCard label="Departments" value={stats.departments} icon={Building2} iconBg="#e8eaf6" iconColor="#3f51b5" />
        <StatCard label="Officers" value={stats.officers} icon={Users} iconBg="#e0f2f1" iconColor="#00796b" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <ChartCard title="Complaints Over Time" subtitle="Monthly complaints vs resolved">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={complaintsOverTime} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Line type="monotone" dataKey="complaints" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Complaints" />
              <Line type="monotone" dataKey="resolved" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Complaints by Category" subtitle="Distribution across issue types">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {stats.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <ChartCard title="Complaints by Department" subtitle="Total vs resolved per department">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.deptData} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="complaints" fill="var(--color-secondary)" name="Complaints" radius={[3, 3, 0, 0]} />
              <Bar dataKey="resolved" fill="var(--color-success)" name="Resolved" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Resolution Rate by Department" subtitle="Percentage resolved">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resolutionRate} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Rate']} />
              <Bar dataKey="rate" fill="var(--color-primary)" radius={[0, 3, 3, 0]} name="Resolution Rate" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Manage Departments', to: '/admin/departments', icon: Building2 },
          { label: 'Manage Officers', to: '/admin/officers', icon: Users },
          { label: 'Category Management', to: '/admin/categories', icon: FileText },
          { label: 'SLA Management', to: '/admin/sla', icon: Clock },
          { label: 'View Reports', to: '/admin/reports', icon: TrendingUp },
          { label: 'Analytics', to: '/admin/analytics', icon: TrendingUp },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-primary)', transition: 'border-color 0.15s' }} className="service-card" onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-secondary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <item.icon size={18} style={{ color: 'var(--color-secondary)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
