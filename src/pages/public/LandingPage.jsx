import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import {
  FilePlus2, PlusCircle, Search, FileStack, FileText, MapPinned, HelpCircle,
  Headphones, CheckCircle, Clock, Users, Building2,
  ChevronRight, Shield, ArrowRight, ArrowUpRight, Sparkles,
  Phone, Mail, Lock, Zap, Compass
} from 'lucide-react';

import { publicStats } from '../../data/mockData';
import HeroSlider from '../../components/ui/HeroSlider';
import AIServiceSearch from '../../components/ai/AIServiceSearch';
import AIGuidedJourney from '../../components/ai/AIGuidedJourney';

// Public footer
function PublicFooter({ user, role }) {
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'officer') return '/officer';
    return '/dashboard';
  };

  return (
    <footer style={{ background: '#0F172A', color: 'rgba(255,255,255,0.85)', position: 'relative' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #F28C28 0%, #F28C28 33%, #FFFFFF 33%, #FFFFFF 66%, #21864B 66%, #21864B 100%)', width: '100%' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(36px, 5vw, 52px) clamp(16px, 3vw, 24px) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36, paddingBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img
              src="/logo.jpg"
              alt="Bharat Civic Connect Logo"
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
            />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.975rem', margin: 0 }}>Bharat Civic Connect</p>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 0' }}>भारत नागरिक सेवा | Govt. of Maharashtra</p>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: '#94A3B8' }}>
            A transparent digital platform for citizen grievance redressal, empowering citizens to submit, track, and resolve issues effectively under the Maharashtra Public Services Guarantee Act.
          </p>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Links</h3>
          {['Register Complaint', 'Track Complaint', 'My Dashboard', 'FAQ', 'Help & Support', 'Issues Map'].map(link => {
            let to = '/';
            if (link === 'Register Complaint') to = user ? '/complaints/new' : '/login';
            else if (link === 'Track Complaint') to = '/track';
            else if (link === 'My Dashboard') to = user ? getDashboardPath() : '/login';
            else if (link === 'FAQ') to = '/faq';
            else if (link === 'Help & Support') to = '/help';
            else if (link === 'Issues Map') to = '/admin/map';
            return (
              <div key={link} style={{ marginBottom: 10 }}>
                <Link to={to} style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.825rem', transition: 'color 0.15s' }}>
                  {link}
                </Link>
              </div>
            );
          })}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Departments</h3>
          {['Road Maintenance', 'Water Supply', 'Electricity', 'Sanitation', 'Public Health', 'Parks & Recreation'].map(d => (
            <div key={d} style={{ marginBottom: 10 }}>
              <span style={{ color: '#94A3B8', fontSize: '0.825rem' }}>{d}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Citizen Helpline</h3>
          <p style={{ fontSize: '0.825rem', color: '#E2E8F0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={15} color="#F28C28" /> <span style={{ fontWeight: 600 }}>Toll-Free: 1800-123-4567</span>
          </p>
          <p style={{ fontSize: '0.825rem', color: '#CBD5E1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={15} color="#60A5FA" /> <span>grievance@mh.gov.in</span>
          </p>
          <p style={{ fontSize: '0.825rem', color: '#CBD5E1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} color="#34D399" /> <span>Mon–Sat: 9:00 AM – 6:00 PM</span>
          </p>
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Lock size={13} color="#22c55e" />
              <span>Official 256-bit encrypted government portal.</span>
            </p>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>© 2026 Government of Maharashtra. All rights reserved.</p>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Official Citizen Redressal Portal | Version 2.0</p>
      </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [trackId, setTrackId] = useState('');
  const [journeyOpen, setJourneyOpen] = useState(false);

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
    { label: t('landing.stats.total'), value: publicStats.totalComplaints, icon: FileText, color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
    { label: t('landing.stats.resolved'), value: publicStats.resolved, icon: CheckCircle, color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' },
    { label: t('landing.stats.inProgress'), value: publicStats.inProgress, icon: Clock, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
    { label: t('landing.stats.departments'), value: publicStats.departments, icon: Building2, color: '#174EA6', bg: '#F1F5F9', border: '#E2E8F0' },
  ];

  return (
    <div style={{ background: '#F7F9FC' }}>
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title" style={{ padding: '32px 0 40px', background: 'linear-gradient(180deg, #EFF6FF 0%, #F7F9FC 100%)', borderBottom: '1px solid #E5EAF2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 3vw, 24px)' }}>
          {/* Row 1: Slider and Quick Login */}
          <div className="hero-grid grid-responsive-hero">
            
            {/* SEO Accessibility Headings */}
            <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
              <h1 id="hero-title">{t('landing.heroTitle')}</h1>
              <p>{t('landing.heroSubtitle')}</p>
            </div>

            {/* Left Column: Hero Slider */}
            <div style={{ minWidth: 0, height: '100%' }}>
              <HeroSlider />
            </div>

            {/* Citizen Welcome Card: Logged-in vs Guest */}
            {user ? (
              <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5EAF2', padding: 'clamp(20px, 3vw, 26px) clamp(18px, 3vw, 22px)', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #174EA6 0%, #2563EB 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
                      {typeof user?.name === 'string' ? (user.name[0] || 'U') : 'U'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172033', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Welcome Back, {typeof user?.name === 'string' ? user.name.split(' ')[0] : 'User'}!
                      </h2>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 650, background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                        <CheckCircle size={11} />
                        {role === 'admin' ? 'Administrator' : role === 'officer' ? 'Department Officer' : 'Verified Citizen'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: 18, lineHeight: 1.5 }}>
                    You are signed in to the Maharashtra Grievance Portal. Manage your submissions or track real-time SLA resolutions below.
                  </p>

                  <Link
                    to={role === 'admin' ? '/admin' : role === 'officer' ? '/officer' : '/dashboard'}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 10, justifyContent: 'center', padding: '11px 16px', fontSize: '0.9rem', fontWeight: 650, background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)' }}
                  >
                    <Users size={16} /> Go to Dashboard
                  </Link>

                  {role === 'citizen' && (
                    <Link
                      to="/complaints/new"
                      className="btn"
                      style={{ width: '100%', marginBottom: 14, justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem', fontWeight: 650, background: '#FFFFFF', color: '#2563EB', border: '1.5px solid #2563EB', borderRadius: 10, transition: 'all 0.15s' }}
                    >
                      <FilePlus2 size={16} /> Register New Complaint
                    </Link>
                  )}

                  {role === 'officer' && (
                    <Link
                      to="/officer/complaints"
                      className="btn"
                      style={{ width: '100%', marginBottom: 14, justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem', fontWeight: 650, background: '#FFFFFF', color: '#2563EB', border: '1.5px solid #2563EB', borderRadius: 10 }}
                    >
                      <FileText size={16} /> View Assigned Complaints
                    </Link>
                  )}

                  {role === 'admin' && (
                    <Link
                      to="/admin/analytics"
                      className="btn"
                      style={{ width: '100%', marginBottom: 14, justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem', fontWeight: 650, background: '#FFFFFF', color: '#2563EB', border: '1.5px solid #2563EB', borderRadius: 10 }}
                    >
                      <Building2 size={16} /> Government Analytics
                    </Link>
                  )}
                </div>

                <div>
                  <div style={{ padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E5EAF2', marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: 6, alignItems: 'center', lineHeight: 1.4, margin: 0 }}>
                      <Shield size={14} style={{ flexShrink: 0, color: '#15803D' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Session: {user?.email || user?.mobile || 'Active'}
                      </span>
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => logout()}
                      style={{ background: 'none', border: 'none', fontSize: '0.8125rem', color: '#DC2626', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', padding: '4px 8px' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5EAF2', padding: 'clamp(20px, 3vw, 26px) clamp(18px, 3vw, 22px)', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#172033', marginBottom: 4 }}>
                    Access Your Account
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: 18 }}>
                    Login to submit, track or manage complaints
                  </p>
                  
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginBottom: 10, justifyContent: 'center', padding: '11px 16px', fontSize: '0.9rem', fontWeight: 650, background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)' }}>
                    <Users size={16} /> Sign In to Portal
                  </Link>

                  <Link to="/register" className="btn" style={{ width: '100%', marginBottom: 16, justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem', fontWeight: 650, background: '#FFFFFF', color: '#2563EB', border: '1.5px solid #2563EB', borderRadius: 10 }}>
                    Register New Account
                  </Link>
                </div>

                <div>
                  <div style={{ padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E5EAF2', marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.4, margin: 0 }}>
                      <Shield size={14} style={{ flexShrink: 0, marginTop: 1, color: '#15803D' }} />
                      Official Government of Maharashtra Redressal Gateway.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>New citizen? </span>
                    <Link to="/register" style={{ fontSize: '0.8125rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Prominent Complaint Tracking Card */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '20px',
            background: '#FFFFFF',
            border: '1px solid #E5EAF2',
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
            padding: '20px clamp(18px, 3vw, 28px)',
            marginTop: '28px'
          }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F28C28' }} />
                <p style={{ fontSize: '1.025rem', fontWeight: 700, color: '#172033', margin: 0 }}>
                  {t('landing.heroTitle')}
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                {t('landing.heroSubtitle')}
              </p>
            </div>

            {/* Inline Track Complaint Form */}
            <form onSubmit={handleTrack} style={{ 
              display: 'flex', 
              gap: 8, 
              width: '100%',
              maxWidth: '460px', 
              background: '#F8FAFC', 
              border: '1.5px solid #E5EAF2', 
              borderRadius: 10, 
              padding: '5px 5px 5px 14px',
              alignItems: 'center',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
              flexWrap: 'nowrap'
            }}>
              <Search size={18} color="#64748B" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                placeholder={t('landing.trackPlaceholder')}
                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#172033', fontSize: '0.875rem', fontWeight: 500 }}
                aria-label="Enter complaint ID to track"
              />
              <button 
                type="submit" 
                className="btn btn-sm" 
                style={{ 
                  background: '#2563EB', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '9px 18px', 
                  fontWeight: 650, 
                  fontSize: '0.85rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  cursor: 'pointer', 
                  flexShrink: 0, 
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)' 
                }}
              >
                <span>{t('landing.track')}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      <section style={{ background: '#F7F9FC', borderBottom: '1px solid #E5EAF2', padding: '32px clamp(16px, 3vw, 24px)' }} aria-label="Portal statistics">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="grid-responsive-stats-4" style={{ gap: 18 }}>
            {stats.map((stat, i) => (
              <div key={i} className="stat-card-white">
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: stat.bg, 
                  color: stat.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  border: `1px solid ${stat.border}`
                }}>
                  <stat.icon size={24} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.85rem)', fontWeight: 800, color: '#172033', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 650 }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) clamp(16px, 3vw, 24px)' }}>
        {/* AI Natural Language Service Discovery Section */}
        <section aria-label="AI Service Discovery" style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4f46e5', background: 'rgba(79, 70, 229, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                <Sparkles size={13} />
                <span>AI Citizen Intelligence Layer</span>
              </span>
              <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 6 }}>
                What service or help do you need today?
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setJourneyOpen(true)}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 650,
                borderColor: '#4f46e5',
                color: '#4f46e5'
              }}
            >
              <Compass size={16} />
              <span>7-Step Citizen Filing Guide</span>
            </button>
          </div>

          {/* Embedded Semantic Search Box */}
          <AIServiceSearch onSelectService={(service) => navigate('/complaints/new')} />
        </section>

        <AIGuidedJourney isOpen={journeyOpen} onClose={() => setJourneyOpen(false)} />

        {/* Quick Services — Modern 3D Cards */}
        <section aria-labelledby="services-title" style={{ marginBottom: 60 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="quick-services-badge">
              <Sparkles size={13} color="#E67E22" />
              <span>CITIZEN SERVICES & REDRESSAL</span>
            </div>
            <h2 id="services-title" style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Quick Services
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto' }}>
              Everything you need in one unified citizen portal. Fast, transparent & accountable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 20 }}>
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
            <h2 id="how-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#172033', marginBottom: 8, letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>
              Simple 4-step process to resolve your grievance transparently
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, position: 'relative' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5EAF2', borderRadius: 14, padding: '26px 22px', position: 'relative', boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#E2E8F0', marginBottom: 12, lineHeight: 1 }}>
                  {step.num}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#2563EB', border: '1px solid #DBEAFE' }}>
                  <step.icon size={22} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.975rem', color: '#172033', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', zIndex: 1 }} aria-hidden="true" className="hide-mobile">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Info Banner */}
        <section style={{ marginBottom: 40, background: 'linear-gradient(135deg, #174EA6 0%, #1E40AF 100%)', borderRadius: 16, padding: '36px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, boxShadow: '0 10px 25px -4px rgba(23, 78, 166, 0.25)' }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: 750, fontSize: '1.35rem', marginBottom: 6 }}>
              Have a Problem? Register Now.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.925rem', margin: 0 }}>
              Your complaint will be addressed within the SLA timeline by the relevant department.
            </p>
          </div>
          <Link to="/complaints/new" className="btn btn-lg" style={{ background: '#F28C28', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 10, padding: '12px 24px', flexShrink: 0, boxShadow: '0 4px 14px rgba(242, 140, 40, 0.35)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>Register a Complaint</span> <ChevronRight size={18} />
          </Link>
        </section>
      </main>

      <PublicFooter user={user} role={role} />
    </div>
  );
}
