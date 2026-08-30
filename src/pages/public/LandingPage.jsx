import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import {
  PlusCircle, Search, FileText, MapPin, HelpCircle,
  PhoneCall, CheckCircle, Clock, Users, Building2,
  ChevronRight, Shield, Globe, ArrowRight
} from 'lucide-react';
import { publicStats } from '../../data/mockData';
import HeroSlider from '../../components/ui/HeroSlider';

// Public header for landing page
function PublicHeader() {
  const { t, i18n } = useTranslation();
  const [showLang, setShowLang] = useState(false);
  const langOptions = [
    { code: 'en', label: 'English' },
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
  ];
  return (
    <header style={{ background: 'var(--color-primary)', padding: '0 0' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--color-primary-dark)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
          Government of Maharashtra | महाराष्ट्र शासन
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>Screen Reader Access</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLang(v => !v)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, padding: '2px 10px', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              aria-label="Language selector"
            >
              <Globe size={12} />
              {langOptions.find(l => l.code === i18n.language)?.label || 'English'}
            </button>
            {showLang && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 6, boxShadow: 'var(--shadow-md)', zIndex: 200 }}>
                {langOptions.map(lang => (
                  <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: i18n.language === lang.code ? 600 : 400 }}>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Main header */}
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          <img
            src="/logo.jpg"
            alt="Bharat Civic Connect Logo"
            style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover' }}
          />
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2 }}>Bharat Civic Connect</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>भारत नागरिक सेवा · Government of Maharashtra</p>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <Link to="/login" style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
            Login
          </Link>
          <Link to="/register" style={{ padding: '7px 16px', background: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: 6, color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            Register
          </Link>
        </div>
      </div>
      {/* Nav bar */}
      <nav style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0 24px', display: 'flex', gap: 0 }} aria-label="Main navigation">
        {[
          { to: '/', label: 'Home' },
          { to: '/about', label: 'About' },
          { to: '/services', label: 'Services' },
          { to: '/track', label: 'Track Complaint' },
          { to: '/faq', label: 'FAQ' },
          { to: '/help', label: 'Help & Support' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 400, borderBottom: '2px solid transparent', display: 'block' }}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

// Public footer
function PublicFooter() {
  return (
    <footer style={{ background: 'var(--color-primary-dark)', color: 'rgba(255,255,255,0.8)', padding: '40px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, paddingBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src="/logo.jpg"
              alt="Bharat Civic Connect Logo"
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Bharat Civic Connect</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>भारत नागरिक सेवा</p>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)' }}>
            A transparent digital platform for citizen grievance management, designed to make government services accessible to everyone.
          </p>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Links</h3>
          {['Register Complaint', 'Track Complaint', 'My Dashboard', 'FAQ', 'Help & Support', 'Privacy Policy'].map(link => (
            <div key={link} style={{ marginBottom: 8 }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.8125rem' }}>
                {link}
              </Link>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departments</h3>
          {['Road Maintenance', 'Water Supply', 'Electricity', 'Sanitation', 'Public Health', 'Parks & Recreation'].map(d => (
            <div key={d} style={{ marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8125rem' }}>{d}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h3>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>📞 Helpline: 1800-XXX-XXXX</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>✉️ grievance@mh.gov.in</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>🕐 Mon–Sat, 9:00 AM – 6:00 PM</p>
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
              🔒 Your information is securely protected.
            </p>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>© 2026 Government of Maharashtra. All rights reserved.</p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Last updated: August 2026 | Version 1.0</p>
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

  const quickLogin = (role) => {
    login(role);
    if (role === 'officer') navigate('/officer');
    else if (role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  const serviceCards = [
    { icon: PlusCircle, label: 'Register Complaint', desc: 'Submit a new grievance', to: '/complaints/new', color: '#e8f4fd', iconColor: '#1D5D91' },
    { icon: Search, label: 'Track Complaint', desc: 'Check complaint status', to: '/track', color: '#fff3e0', iconColor: '#ED6C02' },
    { icon: FileText, label: 'My Complaints', desc: 'View submitted complaints', to: '/complaints', color: '#e8f5e9', iconColor: '#2E7D32' },
    { icon: MapPin, label: 'Nearby Issues', desc: 'See complaints in your area', to: '/admin/map', color: '#fce4ec', iconColor: '#C62828' },
    { icon: HelpCircle, label: 'FAQ', desc: 'Frequently asked questions', to: '/faq', color: '#ede7f6', iconColor: '#5c35b8' },
    { icon: PhoneCall, label: 'Contact Support', desc: 'Get direct assistance', to: '/help', color: '#e0f2f1', iconColor: '#00796b' },
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
      <PublicHeader />

      {/* Skip to content */}
      <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 0, zIndex: 999, background: 'var(--color-primary)', color: '#fff', padding: '8px 16px' }}
        onFocus={e => { e.target.style.left = '0'; }}
        onBlur={e => { e.target.style.left = '-9999px'; }}>
        Skip to main content
      </a>

      {/* Hero */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Row 1: Slider and Quick Login */}
          <div className="hero-grid">
            
            {/* Screen Reader Only SEO / Accessibility headings */}
            <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
              <h1 id="hero-title">{t('landing.heroTitle')}</h1>
              <p>{t('landing.heroSubtitle')}</p>
            </div>

            {/* Left Column: Hero Slider */}
            <div style={{ minWidth: 0 }}>
              <HeroSlider />
            </div>

            {/* Quick login panel */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                Access Your Account
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                Login to submit or track your complaints
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginBottom: 10, justifyContent: 'center' }}>
                <Users size={16} /> Citizen Login
              </Link>
              <div style={{ position: 'relative', margin: '16px 0', textAlign: 'center' }}>
                <div style={{ height: 1, background: 'var(--color-border)', position: 'absolute', top: '50%', width: '100%' }} />
                <span style={{ position: 'relative', background: '#fff', padding: '0 10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>or login as</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => quickLogin('officer')} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
                  Officer
                </button>
                <button onClick={() => quickLogin('admin')} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
                  Admin
                </button>
              </div>
              <div style={{ marginTop: 16, padding: '10px', background: 'var(--color-bg)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <Shield size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-success)' }} />
                  Your information is securely protected and only shared with the relevant department.
                </p>
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>New citizen? </span>
                <Link to="/register" style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600 }}>Create account</Link>
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
        {/* Quick Services */}
        <section aria-labelledby="services-title" style={{ marginBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 id="services-title" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Quick Services
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Everything you need in one place
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {serviceCards.map((card, i) => (
              <Link key={i} to={card.to} className="service-card">
                <div className="icon-wrap" style={{ background: card.color, color: card.iconColor }}>
                  <card.icon size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>{card.label}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{card.desc}</p>
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
