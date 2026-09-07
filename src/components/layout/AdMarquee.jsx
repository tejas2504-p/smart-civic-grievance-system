import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Megaphone, 
  Pause, 
  Play, 
  X, 
  ExternalLink, 
  Sparkles, 
  PhoneCall, 
  Smartphone, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';

export default function AdMarquee() {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  if (!isVisible) return null;

  const notices = [
    {
      id: '1',
      tag: 'Special Drive',
      tagColor: '#B45309',
      tagBg: '#FEF3C7',
      icon: Sparkles,
      text: '🚀 Rapid Grievance Resolution Drive active across all municipal wards — guaranteed 48-hour first response!',
      link: '/complaints/new',
      linkText: 'File Grievance',
      details: 'Municipal departments across Maharashtra have initiated a 48-hour turnaround drive for urgent civic issues including water supply, road repairs, and sanitation.'
    },
    {
      id: '2',
      tag: '24x7 Helpline',
      tagColor: '#1E40AF',
      tagBg: '#DBEAFE',
      icon: PhoneCall,
      text: '📞 Citizen Grievance Toll-Free Helpline: 1800-112-555 | WhatsApp Support: +91 98765 43210 (Available in English, मराठी, हिंदी)',
      link: '/help',
      linkText: 'Help Center',
      details: 'Citizens can now lodge and track grievances via our dedicated 24x7 voice helpline and automated WhatsApp chatbot with multilingual support.'
    },
    {
      id: '3',
      tag: 'Mobile App',
      tagColor: '#15803D',
      tagBg: '#DCFCE7',
      icon: Smartphone,
      text: '📲 Download Bharat Civic Connect Mobile App for geotagged photo reporting & real-time SLA push alerts.',
      link: '/track',
      linkText: 'Track Status',
      details: 'Instant status notifications, GPS geotagging for civic issues, and direct communication with assigned zonal officers right from your smartphone.'
    },
    {
      id: '4',
      tag: 'Public Notice',
      tagColor: '#991B1B',
      tagBg: '#FEE2E2',
      icon: ShieldCheck,
      text: '⚡ Monsoon Preparedness & Drainage Restoration complaints are currently designated as Critical Priority.',
      link: '/admin/map',
      linkText: 'View Issues Map',
      details: 'Waterlogging, open manholes, tree falls, and drainage blockages are automatically routed to emergency response teams with 6-hour SLA targets.'
    },
    {
      id: '5',
      tag: 'Milestone',
      tagColor: '#6B21A8',
      tagBg: '#F3E8FF',
      icon: Info,
      text: '🏆 48,200+ Grievances successfully resolved this month with a 94.8% Citizen Satisfaction Index rating.',
      link: '/faq',
      linkText: 'Read FAQs',
      details: 'Transparency in governance: View department-wise performance metrics and historical resolution trends in our public analytics dashboard.'
    }
  ];

  return (
    <>
      <section 
        className="ad-marquee-container"
        aria-label="Government Announcements and Civic Advisories"
        role="region"
      >
        {/* Left Fixed Badge */}
        <div className="ad-marquee-badge">
          <span className="ad-marquee-pulse-dot" aria-hidden="true" />
          <Megaphone size={14} className="ad-marquee-badge-icon" aria-hidden="true" />
          <span className="ad-marquee-badge-text">BULLETIN</span>
        </div>

        {/* Marquee Scrolling Viewport */}
        <div 
          className={`ad-marquee-viewport ${isPaused ? 'paused' : ''}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="ad-marquee-track">
            {/* First Set of Items */}
            {notices.map((item) => (
              <div 
                key={`item-1-${item.id}`} 
                className="ad-marquee-item"
                onClick={() => setSelectedNotice(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNotice(item);
                  }
                }}
              >
                <span 
                  className="ad-marquee-tag"
                  style={{ color: item.tagColor, backgroundColor: item.tagBg }}
                >
                  {item.tag}
                </span>
                <span className="ad-marquee-text">{item.text}</span>
                <span className="ad-marquee-action-hint">
                  Details <ExternalLink size={11} style={{ display: 'inline', marginLeft: 2 }} />
                </span>
                <span className="ad-marquee-separator" aria-hidden="true">✦</span>
              </div>
            ))}

            {/* Duplicate Set for Seamless Continuous Scrolling */}
            {notices.map((item) => (
              <div 
                key={`item-2-${item.id}`} 
                className="ad-marquee-item"
                onClick={() => setSelectedNotice(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNotice(item);
                  }
                }}
              >
                <span 
                  className="ad-marquee-tag"
                  style={{ color: item.tagColor, backgroundColor: item.tagBg }}
                >
                  {item.tag}
                </span>
                <span className="ad-marquee-text">{item.text}</span>
                <span className="ad-marquee-action-hint">
                  Details <ExternalLink size={11} style={{ display: 'inline', marginLeft: 2 }} />
                </span>
                <span className="ad-marquee-separator" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Utility Controls */}
        <div className="ad-marquee-controls">
          <button
            type="button"
            className="ad-marquee-btn"
            onClick={() => setIsPaused(p => !p)}
            aria-label={isPaused ? "Resume announcement scrolling" : "Pause announcement scrolling"}
            title={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            type="button"
            className="ad-marquee-btn close-btn"
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss announcement banner"
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      </section>

      {/* Modal / Dialog for Detailed Announcement view when clicked */}
      {selectedNotice && (
        <div 
          className="ad-marquee-modal-overlay"
          onClick={() => setSelectedNotice(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ad-modal-title"
        >
          <div 
            className="ad-marquee-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-marquee-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span 
                  className="ad-marquee-tag"
                  style={{ 
                    color: selectedNotice.tagColor, 
                    backgroundColor: selectedNotice.tagBg,
                    fontSize: '0.75rem',
                    padding: '3px 8px'
                  }}
                >
                  {selectedNotice.tag}
                </span>
                <h3 id="ad-modal-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  Civic Advisory & Notification
                </h3>
              </div>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedNotice(null)}
                aria-label="Close dialog"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ad-marquee-modal-body">
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12, lineHeight: 1.5 }}>
                {selectedNotice.text}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                {selectedNotice.details}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#78350F', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6, marginBottom: 18 }}>
                <Clock size={13} />
                <span>Published by Maharashtra E-Governance Division · Active 24x7</span>
              </div>
            </div>

            <div className="ad-marquee-modal-footer">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedNotice(null)}
              >
                Close
              </button>
              <Link 
                to={selectedNotice.link} 
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedNotice(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>{selectedNotice.linkText}</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
