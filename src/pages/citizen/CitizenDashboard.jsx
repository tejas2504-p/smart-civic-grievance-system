import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { StatusBadge, PriorityBadge, EmptyState } from '../../components/ui/SharedComponents';
import { formatDate } from '../../lib/utils';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Bell, 
  ChevronRight, 
  Search, 
  ArrowUpRight,
  Sparkles,
  MapPin,
  Headphones,
  Calendar,
  Filter,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { complaints, notifications, isLiveConnected } = useData();
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  // Real-time Metrics
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;


  // Filtered complaints based on active tab and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      // Tab filter
      if (filterStatus === 'PENDING' && !(item.status === 'Submitted' || item.status === 'Under Review')) {
        return false;
      }
      if (filterStatus === 'IN_PROGRESS' && !(item.status === 'In Progress' || item.status === 'Assigned')) {
        return false;
      }
      if (filterStatus === 'RESOLVED' && !(item.status === 'Resolved' || item.status === 'Closed')) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        const matchDept = item.department?.toLowerCase().includes(q);
        return matchId || matchTitle || matchCat || matchDept;
      }
      return true;
    });
  }, [filterStatus, searchQuery, complaints]);


  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Greeting & Main Action Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #123B63 0%, #1D5D91 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 20px rgba(18, 59, 99, 0.12)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 650, background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: 999, letterSpacing: '0.03em' }}>
              CITIZEN DASHBOARD
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={13} color="#4ade80" /> Verified Citizen
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 750, color: '#ffffff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Here is a simple summary of your grievance submissions and live resolution status.
          </p>
        </div>

        {/* Big Clean Action Button */}
        <Link 
          to="/complaints/new" 
          className="btn"
          style={{
            background: '#E67E22',
            color: '#ffffff',
            border: 'none',
            padding: '11px 22px',
            borderRadius: 8,
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(230, 126, 34, 0.4)',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }}
        >
          <PlusCircle size={18} />
          <span>Lodge New Grievance</span>
        </Link>
      </div>

      {/* Unread Notifications Alert (Minimal & Clean) */}
      {unreadNotifs > 0 && (
        <Link 
          to="/notifications" 
          style={{ 
            textDecoration: 'none', 
            background: '#FFFDF5', 
            border: '1px solid #FDE68A', 
            borderRadius: 10, 
            padding: '10px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={14} color="#D97706" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#92400E', margin: 0, fontWeight: 500, flex: 1 }}>
            You have <strong>{unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}</strong> on your grievances. Click to review updates.
          </p>
          <span style={{ fontSize: '0.785rem', color: '#B45309', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 2 }}>
            View <ChevronRight size={14} />
          </span>
        </Link>
      )}

      {/* 4 Clean Interactive Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Card 1: All */}
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          style={{
            background: '#ffffff',
            border: filterStatus === 'ALL' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: filterStatus === 'ALL' ? '0 4px 14px rgba(18, 59, 99, 0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              All Complaints
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EEF4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
            {total}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Total grievances filed
          </p>
        </button>

        {/* Card 2: Pending */}
        <button
          type="button"
          onClick={() => setFilterStatus('PENDING')}
          style={{
            background: '#ffffff',
            border: filterStatus === 'PENDING' ? '2px solid #ED6C02' : '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: filterStatus === 'PENDING' ? '0 4px 14px rgba(237, 108, 2, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 650, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Pending Review
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ED6C02' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#C2410C', lineHeight: 1 }}>
            {pending}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Awaiting department triage
          </p>
        </button>

        {/* Card 3: In Progress */}
        <button
          type="button"
          onClick={() => setFilterStatus('IN_PROGRESS')}
          style={{
            background: '#ffffff',
            border: filterStatus === 'IN_PROGRESS' ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: filterStatus === 'IN_PROGRESS' ? '0 4px 14px rgba(29, 93, 145, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              In Progress
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)', lineHeight: 1 }}>
            {inProgress}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Assigned & active on ground
          </p>
        </button>

        {/* Card 4: Resolved */}
        <button
          type="button"
          onClick={() => setFilterStatus('RESOLVED')}
          style={{
            background: '#ffffff',
            border: filterStatus === 'RESOLVED' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: filterStatus === 'RESOLVED' ? '0 4px 14px rgba(46, 125, 50, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Resolved
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', lineHeight: 1 }}>
            {resolved}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Successfully closed issues
          </p>
        </button>
      </div>

      {/* 4 Minimal Quick Shortcut Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Link 
          to="/complaints/new" 
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFF3E0', color: '#ED6C02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlusCircle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>New Grievance</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>File a complaint in 2 mins</div>
          </div>
          <ChevronRight size={16} color="var(--color-text-secondary)" />
        </Link>

        <Link 
          to="/track" 
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Search size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Track Status</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Check by Complaint ID</div>
          </div>
          <ChevronRight size={16} color="var(--color-text-secondary)" />
        </Link>

        <Link 
          to="/admin/map" 
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCE7F3', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nearby Issues</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>View municipal GIS map</div>
          </div>
          <ChevronRight size={16} color="var(--color-text-secondary)" />
        </Link>

        <Link 
          to="/help" 
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Headphones size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>24x7 Help Desk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Call 1800-112-555</div>
          </div>
          <ChevronRight size={16} color="var(--color-text-secondary)" />
        </Link>
      </div>

      {/* Main Complaints List (Clean, minimal, easy to scan) */}
      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Controls Bar: Tabs & Quick Search */}
        <div 
          style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--color-border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: 14,
            background: '#FAFBFD'
          }}
        >
          {/* Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStatus('ALL')}
              style={{
                background: filterStatus === 'ALL' ? 'var(--color-primary)' : 'transparent',
                color: filterStatus === 'ALL' ? '#ffffff' : 'var(--color-text-secondary)',
                border: filterStatus === 'ALL' ? 'none' : '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: filterStatus === 'ALL' ? 650 : 500,
                cursor: 'pointer'
              }}
            >
              All ({total})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              style={{
                background: filterStatus === 'PENDING' ? '#ED6C02' : 'transparent',
                color: filterStatus === 'PENDING' ? '#ffffff' : 'var(--color-text-secondary)',
                border: filterStatus === 'PENDING' ? 'none' : '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: filterStatus === 'PENDING' ? 650 : 500,
                cursor: 'pointer'
              }}
            >
              Pending ({pending})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              style={{
                background: filterStatus === 'IN_PROGRESS' ? 'var(--color-secondary)' : 'transparent',
                color: filterStatus === 'IN_PROGRESS' ? '#ffffff' : 'var(--color-text-secondary)',
                border: filterStatus === 'IN_PROGRESS' ? 'none' : '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: filterStatus === 'IN_PROGRESS' ? 650 : 500,
                cursor: 'pointer'
              }}
            >
              In Progress ({inProgress})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              style={{
                background: filterStatus === 'RESOLVED' ? 'var(--color-success)' : 'transparent',
                color: filterStatus === 'RESOLVED' ? '#ffffff' : 'var(--color-text-secondary)',
                border: filterStatus === 'RESOLVED' ? 'none' : '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: filterStatus === 'RESOLVED' ? 650 : 500,
                cursor: 'pointer'
              }}
            >
              Resolved ({resolved})
            </button>
          </div>

          {/* Quick Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID or topic..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '0.8125rem',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Complaints Table / List */}
        {filteredComplaints.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#FAFBFD' }}>
                  <th style={{ width: '130px' }}>Complaint ID</th>
                  <th>Grievance Details</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => (
                  <tr key={c.id} style={{ transition: 'background 0.15s ease' }}>
                    <td>
                      <span 
                        style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.8rem', 
                          color: 'var(--color-primary)', 
                          fontWeight: 700,
                          background: '#EEF4FA',
                          padding: '2px 7px',
                          borderRadius: 4
                        }}
                      >
                        {c.id}
                      </span>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <p style={{ fontWeight: 650, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2, lineHeight: 1.3 }}>
                        {c.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {c.category}
                      </p>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {c.department}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(c.submittedDate)}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/complaints/${c.id}`} 
                        className="btn btn-outline btn-sm"
                        style={{ 
                          fontSize: '0.775rem', 
                          padding: '4px 10px', 
                          fontWeight: 600,
                          color: 'var(--color-secondary)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <EmptyState
              icon={FileText}
              title={searchQuery ? 'No matching complaints' : 'No complaints found'}
              description={searchQuery ? 'Try searching with a different keyword or clear the search query.' : 'You have not submitted any grievances in this category yet.'}
              action={
                searchQuery ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}
                    className="btn btn-outline btn-sm"
                  >
                    Clear Filter
                  </button>
                ) : (
                  <Link to="/complaints/new" className="btn btn-primary btn-sm">
                    <PlusCircle size={14} /> File a Complaint Now
                  </Link>
                )
              }
            />
          </div>
        )}

        {/* Footer info & view all */}
        <div 
          style={{ 
            padding: '12px 20px', 
            borderTop: '1px solid var(--color-border)', 
            background: '#FAFBFD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)'
          }}
        >
          <span>Showing {filteredComplaints.length} of {total} grievances</span>
          <Link 
            to="/complaints" 
            style={{ 
              color: 'var(--color-secondary)', 
              fontWeight: 650, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>View Full Archive</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
