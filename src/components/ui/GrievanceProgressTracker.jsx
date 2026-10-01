import React from 'react';
import { 
  ClipboardCheck, 
  Search, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  ShieldAlert,
  Clock,
  User,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

const STAGES = [
  {
    key: 'Submitted',
    label: 'Lodged',
    subtext: 'Citizen Lodged',
    icon: ClipboardCheck,
    color: '#3B82F6',
  },
  {
    key: 'Under Review',
    label: 'Under Review',
    subtext: 'Admin Scrutiny',
    icon: Search,
    color: '#EAB308',
  },
  {
    key: 'Assigned',
    label: 'Officer Assigned',
    subtext: 'Zonal Allocation',
    icon: UserCheck,
    color: '#8B5CF6',
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    subtext: 'Field Investigation',
    icon: Wrench,
    color: '#F97316',
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    subtext: 'Citizen Satisfied',
    icon: CheckCircle2,
    color: '#10B981',
  },
];

export default function GrievanceProgressTracker({ complaint }) {
  if (!complaint) return null;

  const currentStatus = complaint.status || 'Submitted';
  const isEscalated = currentStatus === 'Escalated';
  const isClosed = currentStatus === 'Closed';

  // Determine active stage index
  const statusIndexMap = {
    'Submitted': 0,
    'Under Review': 1,
    'Assigned': 2,
    'In Progress': 3,
    'Resolved': 4,
    'Closed': 4,
    'Escalated': 3,
  };

  const activeIndex = statusIndexMap[currentStatus] ?? 0;
  const officer = complaint.assignedOfficer || complaint.officer;

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 'clamp(16px, 3vw, 24px)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 20,
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={15} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 750, color: 'var(--color-text-primary)', margin: 0 }}>
              Official Order & Resolution Progression
            </h2>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: isEscalated ? '#FEE2E2' : '#EFF6FF',
                color: isEscalated ? '#DC2626' : '#1D4ED8',
                border: isEscalated ? '1px solid #FCA5A5' : '1px solid #BFDBFE',
              }}
            >
              {isEscalated ? '⚠️ Escalated Priority' : '⚡ Real-time Order Tracking'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
            Transparent end-to-end audit lifecycle viewable by Citizen, Officer & Administrator
          </p>
        </div>

        {/* Assigned Officer Pill if available */}
        {officer?.name && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
            }}
          >
            <User size={15} color="#8B5CF6" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Assigned Officer
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {officer.name} {officer.department ? `· ${officer.department}` : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper / Progress Pipeline (Like Amazon / E-Commerce Order Progress) */}
      <div style={{ position: 'relative', margin: '10px 0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
            position: 'relative',
            gap: 4,
          }}
        >
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIndex || (idx === STAGES.length - 1 && activeIndex === STAGES.length - 1);
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div
                key={stage.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Connecting Track Line behind dots */}
                {idx < STAGES.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 18,
                      left: '50%',
                      width: '100%',
                      height: 4,
                      background: idx < activeIndex ? '#10B981' : 'var(--color-border)',
                      zIndex: 1,
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}

                {/* Node Icon Circle */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? '#10B981'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : 'var(--color-surface)',
                    border: isCompleted
                      ? '2px solid #10B981'
                      : isCurrent
                      ? '3px solid #60A5FA'
                      : '2px solid var(--color-border)',
                    color: isCompleted || isCurrent ? '#ffffff' : 'var(--color-text-secondary)',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                    zIndex: 2,
                    transition: 'all 0.2s ease',
                  }}
                  title={`${stage.label}: ${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}`}
                >
                  <Icon size={17} />
                </div>

                {/* Label */}
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: isCurrent ? 750 : 600,
                      color: isCurrent ? 'var(--color-primary)' : isCompleted ? '#10B981' : 'var(--color-text-secondary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {stage.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {stage.subtext}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Order Action Log / Milestones */}
      {complaint.timeline && complaint.timeline.length > 0 && (
        <div
          style={{
            background: 'var(--color-bg)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={13} />
            <span>Official Action Trail & Transparency Log</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {complaint.timeline.map((event, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontSize: '0.8125rem',
                  paddingBottom: idx !== complaint.timeline.length - 1 ? 8 : 0,
                  borderBottom: idx !== complaint.timeline.length - 1 ? '1px dashed var(--color-border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: idx === complaint.timeline.length - 1 ? '#10B981' : 'var(--color-secondary)',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <span style={{ fontWeight: 650, color: 'var(--color-text-primary)' }}>
                      {event.status}
                    </span>
                    {event.updatedBy && (
                      <span style={{ color: 'var(--color-text-secondary)', marginLeft: 6 }}>
                        · by <strong>{event.updatedBy}</strong> {event.role ? `(${event.role})` : ''}
                      </span>
                    )}
                    {event.remarks && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {event.remarks}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {event.date ? formatDateTime(event.date) : 'Recently'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
