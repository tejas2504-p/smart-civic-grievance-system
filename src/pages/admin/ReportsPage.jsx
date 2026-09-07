import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Download, Calendar, Building2, User, BarChart2, FileBarChart, Clock } from 'lucide-react';

const reportTypes = [
  {
    title: 'Daily Complaint Report',
    desc: 'Summary of all complaints received, resolved, and pending today.',
    icon: FileText,
    color: '#e8f4fd',
    iconColor: 'var(--color-secondary)',
  },
  {
    title: 'Monthly Complaint Report',
    desc: 'Detailed monthly statistics and trends for all complaint categories.',
    icon: Calendar,
    color: '#fff3e0',
    iconColor: 'var(--color-warning)',
  },
  {
    title: 'Department Report',
    desc: 'Performance report for each department including resolution rates.',
    icon: Building2,
    color: '#e8eaf6',
    iconColor: '#3f51b5',
  },
  {
    title: 'Officer Performance Report',
    desc: 'Individual officer performance metrics, response times, and resolution rates.',
    icon: User,
    color: '#e0f2f1',
    iconColor: '#00796b',
  },
  {
    title: 'SLA Report',
    desc: 'Track SLA compliance, breaches, and escalation statistics.',
    icon: Clock,
    color: 'var(--color-danger-light)',
    iconColor: 'var(--color-danger)',
  },
  {
    title: 'Category Report',
    desc: 'Breakdown of complaints by category and subcategory with trends.',
    icon: BarChart2,
    color: '#ede7f6',
    iconColor: '#5c35b8',
  },
  {
    title: 'Resolution Report',
    desc: 'Detailed view of resolved complaints, feedback, and satisfaction scores.',
    icon: FileBarChart,
    color: 'var(--color-success-light)',
    iconColor: 'var(--color-success)',
  },
];

export default function ReportsPage() {
  const handleExport = (type, format) => {
    toast.success(`Generating ${type} as ${format}...`);
    setTimeout(() => toast.success(`${type} exported successfully.`), 1200);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Generate and export detailed reports</p>
        </div>
      </div>

      {/* Date range filter */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }} htmlFor="date-from">From</label>
          <input id="date-from" type="date" className="form-input" style={{ width: 'auto' }} defaultValue="2026-08-01" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }} htmlFor="date-to">To</label>
          <input id="date-to" type="date" className="form-input" style={{ width: 'auto' }} defaultValue="2026-08-21" />
        </div>
        <button className="btn btn-primary btn-sm">Apply Filter</button>
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {reportTypes.map((report, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: report.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: report.iconColor }}>
                <report.icon size={20} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>{report.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{report.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleExport(report.title, 'CSV')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                <Download size={13} /> Export CSV
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleExport(report.title, 'PDF')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                <Download size={13} /> Export PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
