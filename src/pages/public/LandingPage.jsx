import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import {
  FilePlus2, PlusCircle, Search, FileStack, FileText, MapPinned, HelpCircle,
  Headphones, CheckCircle, Clock, Users, Building2,
  ChevronRight, Shield, ArrowRight, ArrowUpRight, Sparkles,
  Phone, Mail, Lock, Zap
} from 'lucide-react';


import { publicStats } from '../../data/mockData';
import HeroSlider from '../../components/ui/HeroSlider';

// Public footer
function PublicFooter() {
  return (
    <footer style={{ background: '#09223e', color: 'rgba(255,255,255,0.8)', padding: '48px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, paddingBottom: 36 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src="/logo.jpg"
              alt="Bharat Civic Connect Logo"
              style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Bharat Civic Connect</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>भारत नागरिक सेवा</p>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)' }}>
            A transparent digital platform for citizen grievance redressal, empowering citizens to submit, track, and resolve issues effectively.
          </p>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 650, fontSize: '0.875rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Links</h3>
          {['Register Complaint', 'Track Complaint', 'My Dashboard', 'FAQ', 'Help & Support', 'Privacy Policy'].map(link => (
            <div key={link} style={{ marginBottom: 9 }}>
              <Link to={link === 'Register Complaint' ? '/complaints/new' : link === 'Track Complaint' ? '/track' : link === 'FAQ' ? '/faq' : link === 'Help & Support' ? '/help' : '/login'} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.8125rem' }}>
                {link}
              </Link>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 650, fontSize: '0.875rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departments</h3>
          {['Road Maintenance', 'Water Supply', 'Electricity', 'Sanitation', 'Public Health', 'Parks & Recreation'].map(d => (
            <div key={d} style={{ marginBottom: 9 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8125rem' }}>{d}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 650, fontSize: '0.875rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h3>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={14} color="#FF9933" /> <span>Helpline: 1800-123-4567</span>
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={14} color="#60A5FA" /> <span>grievance@mh.gov.in</span>
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="#34D399" /> <span>Mon–Sat, 9:00 AM – 6:00 PM</span>
          </p>
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} color="#22c55e" />
              <span>Your information is securely encrypted.</span>
            </p>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>© 2026 Government of Maharashtra. All rights reserved.</p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Official Citizen Redressal Portal | Version 1.0</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [trackId, setTrackId] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) navigate(`/track?id=${trackId.trim()}`);
  };


  const serviceCards = [
    { 
      icon: FilePlus2, 
      badge: 'Fast-Track',
      label: 'Register Complaint', 
      desc: 'Submit a new grievance with photo & GPS location', 
      to: '/complaints/new', 
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      shadowColor: 'rgba(255, 107, 53, 0.35)',
      badgeBg: '#FFF3E0',
      badgeColor: '#C2410C'
    },
    { 
      icon: Search, 
      badge: 'Real-Time SLA',
      label: 'Track Complaint', 
      desc: 'Check live progress & assigned officer details', 
      to: '/track', 
      gradient: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
      shadowColor: 'rgba(2, 132, 199, 0.35)',
      badgeBg: '#E0F2FE',
      badgeColor: '#0369A1'
    },
    { 
      icon: FileStack, 
      badge: 'Citizen Vault',
      label: 'My Complaints', 
      desc: 'Access your full history, letters & resolution status', 
      to: '/complaints', 
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.35)',
      badgeBg: '#ECFDF5',
      badgeColor: '#047857'
    },
    { 
      icon: MapPinned, 
      badge: 'GIS Heatmap',
      label: 'Nearby Issues', 
      desc: 'Explore active complaints across your ward on map', 
      to: '/admin/map', 
      gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
      shadowColor: 'rgba(244, 63, 94, 0.35)',
      badgeBg: '#FFE4E6',
      badgeColor: '#BE123C'
    },
    { 
      icon: HelpCircle, 
      badge: 'Knowledge Base',
      label: 'FAQs & Guidelines', 
      desc: 'Step-by-step guides, rules & grievance procedures', 
      to: '/faq', 
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.35)',
      badgeBg: '#F5F3FF',
      badgeColor: '#6D28D9'
    },
    { 
      icon: Headphones, 
      badge: 'Toll-Free 24x7',
      label: 'Helpline & Support', 
      desc: 'Direct officer assistance, toll-free number & email', 
      to: '/help', 
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.35)',
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309'
    },
  ];


  const steps = [
    { num: '01', title: 'Register Complaint', desc: 'Fill in the complaint details, location, and upload evidence.', icon: PlusCircle },
    { num: '02', title: 'Complaint Reviewed', desc: 'Our team reviews and assigns the complaint to the right department.', icon: CheckCircle },
    { num: '03', title: 'Department Takes Action', desc: 'An officer investigates and takes necessary action on-ground.', icon: Building2 },
    { num: '04', title: 'Issue Resolved', desc: 'You are notified when your issue is resolved. Share feedback.', icon: CheckCircle },
  ];

  const stats = [
    { label: t('landing.stats.total'), value: publicStats.totalComplaints, icon: FileText, color: 'var(--color-primary)' },
    { label: t('landing.stats.resolved'), value: publicStats.resolved, icon: CheckCircle, color: 'var(--color-success)' },
    { label: t('landing.stats.inProgress'), value: publicStats.inProgress, icon: Clock, color: 'var(--color-warning)' },
    { label: t('landing.stats.departments'), value: publicStats.departments, icon: Building2, color: 'var(--color-secondary)' },
  ];

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title" style={{ padding: '36px 0 32px', background: 'linear-gradient(145deg, #09223e 0%, #123B63 55%, #184c7e 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Row 1: Slider and Quick Login */}
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 28, alignItems: 'stretch' }}>
            
            {/* SEO Accessibility Headings */}
            <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
              <h1 id="hero-title">{t('landing.heroTitle')}</h1>
              <p>{t('landing.heroSubtitle')}</p>
            </div>

            {/* Left Column: Hero Slider */}
            <div style={{ minWidth: 0, height: '100%' }}>
              <HeroSlider />
            </div>

            {/* Quick login panel */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 750, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  Access Your Account
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 18 }}>
                  Login to submit, track or manage complaints
                </p>
                
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginBottom: 10, justifyContent: 'center', padding: '11px 16px', fontSize: '0.925rem', fontWeight: 700 }}>
                  <Users size={16} /> Sign In to Portal
                </Link>

                <Link to="/register" className="btn btn-outline" style={{ width: '100%', marginBottom: 16, justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem', fontWeight: 650 }}>
                  Register New Account
                </Link>
              </div>

              <div>
                <div style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 14 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <Shield size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-success)' }} />
                    Official Government of Maharashtra Redressal Gateway.
                  </p>
                </div>


                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>New citizen? </span>
                  <Link to="/register" style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Quick Track & Info Bar */}
          <div style={{ 
            display: 'flex', 
 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '24px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '16px 24px',
            marginTop: '32px'
          }}>
            <div style={{ flex: '1 1 500px' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                {t('landing.heroTitle')}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                {t('landing.heroSubtitle')}
              </p>
            </div>

            {/* Inline Track Complaint Form */}
            <form onSubmit={handleTrack} style={{ 
              display: 'flex', 
              gap: 8, 
              width: '100%',
              maxWidth: '440px', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: 8, 
              padding: '4px 4px 4px 12px',
              flexShrink: 0
            }}>
              <input
                type="text"
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                placeholder={t('landing.trackPlaceholder')}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.875rem' }}
                aria-label="Enter complaint ID to track"
              />
              <button type="submit" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6 }}>
                {t('landing.track')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section style={{ background: 'var(--color-primary-dark)', padding: '28px 24px' }} aria-label="Portal statistics">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main id="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {/* Quick Services — Modern 3D Cards */}
        <section aria-labelledby="services-title" style={{ marginBottom: 60 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="quick-services-badge">
              <Sparkles size={13} color="#E67E22" />
              <span>CITIZEN SERVICES & REDRESSAL</span>
            </div>
            <h2 id="services-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Quick Services
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto' }}>
              Everything you need in one unified citizen portal. Fast, transparent & accountable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {serviceCards.map((card, i) => (
              <Link 
                key={i} 
                to={card.to} 
                className="modern-service-card"
                style={{
                  '--card-gradient': card.gradient,
                  '--icon-shadow': card.shadowColor,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                    <div 
                      className="modern-3d-icon-box"
                      style={{ background: card.gradient }}
                    >
                      <card.icon size={26} strokeWidth={2.2} />
                    </div>
                    <span 
                      className="modern-service-badge"
                      style={{ background: card.badgeBg, color: card.badgeColor }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 style={{ fontWeight: 750, fontSize: '1.025rem', color: 'var(--color-text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                    {card.label}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                </div>

                <div className="arrow-hint">
                  <span>Access Service</span>
                  <ArrowUpRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </section>


        {/* How It Works */}
        <section aria-labelledby="how-title" style={{ marginBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 id="how-title" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Simple 4-step process to resolve your grievance
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, position: 'relative' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24, position: 'relative' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-border)', marginBottom: 12, lineHeight: 1 }}>
                  {step.num}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--color-secondary)' }}>
                  <step.icon size={20} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: 6 }}>{step.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)', zIndex: 1 }} aria-hidden="true" className="hide-mobile">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Info Banner */}
        <section style={{ marginBottom: 40, background: 'var(--color-primary)', borderRadius: 10, padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: 6 }}>
              Have a Problem? Register Now.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              Your complaint will be addressed within the SLA timeline by the relevant department.
            </p>
          </div>
          <Link to="/complaints/new" className="btn btn-lg" style={{ background: 'var(--color-accent)', border: 'none', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            Register a Complaint <ChevronRight size={16} />
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
