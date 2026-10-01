import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, FileText,
  ShieldCheck, Clock, MapPin, AlertCircle, ArrowRight, X, Mic,
  Building2, FileCheck, Edit3, Search, Check, Lightbulb
} from 'lucide-react';

const STEPS = [
  {
    step: 1,
    icon: Mic,
    iconBg: '#FFF3E0',
    iconColor: '#E67E22',
    title: {
      en: 'Describe Issue in Your Own Words',
      mr: 'आपल्या साध्या शब्दांत समस्या सांगा',
      hi: 'अपनी समस्या अपने शब्दों में बताएं'
    },
    desc: {
      en: 'Speak or type naturally in Marathi, Hindi, or English. No government jargon, legal clauses, or complicated administrative codes required.',
      mr: 'मराठी, हिंदी किंवा इंग्रजीत बोला किंवा लिहा. शासकीय तांत्रिक शब्दांची किंवा कलमांची अजिबात गरज नाही.',
      hi: 'मराठी, हिंदी या अंग्रेजी में बोलें या लिखें। किसी सरकारी तकनीकी शब्द या धाराओं की आवश्यकता नहीं।'
    },
    badge: 'Voice & Semantic AI',
    tip: 'Click the microphone icon or type plain phrases like "Dangerous pothole near station" or "Need income certificate for college concession".',
    highlights: ['Natural Speech in 3 Languages', 'Voice-to-Text Input', 'Zero Form Jargon']
  },
  {
    step: 2,
    icon: Building2,
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    title: {
      en: 'Automatic Service & Department Match',
      mr: 'योग्य विभाग व सेवेची आपोआप निवड',
      hi: 'उचित विभाग व सेवा का स्वतः मिलान'
    },
    desc: {
      en: 'Our AI classifier automatically routes your grievance to the exact competent authority (PWD, Municipal Corporation, MSEDCL, Public Health, Revenue).',
      mr: 'आमची एआय प्रणाली आपली तक्रार थेट संबंधित शासकीय विभागाशी (बांधकाम, मनपा, महावितरण, आरोग्य, महसूल) अचूक जोडते.',
      hi: 'हमारी एआई प्रणाली आपकी शिकायत को सीधे संबंधित सरकारी विभाग (PWD, नगर निगम, महावितरण, स्वास्थ्य, राजस्व) से जोड़ती है।'
    },
    badge: 'Smart Jurisdiction Triage',
    tip: 'Potholes route to PWD, water bursts to Water Supply, and garbage to Sanitation — without citizens needing to know bureaucratic divisions.',
    highlights: ['Over 150+ Services Mapped', 'Jurisdiction Auto-Resolution', 'Prevents Wrong Department Reject']
  },
  {
    step: 3,
    icon: Clock,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    title: {
      en: 'Know Your Rights & Timelines (RTS)',
      mr: 'आपले कायदेशीर हक्क आणि कालमर्यादा जाणून घ्या',
      hi: 'अपने कानूनी अधिकार और समयसीमा जानें'
    },
    desc: {
      en: 'Every service is legally governed by the Maharashtra Right to Public Services Act (RTS), guaranteeing a maximum resolution timeframe (SLA) of 7 to 21 days.',
      mr: 'प्रत्येक सेवा महाराष्ट्र लोकसेवा हक्क अधिनियमांतर्गत संरक्षित असून ७ ते २१ दिवसांत निराकरणाची कायदेशीर हमी मिळते.',
      hi: 'प्रत्येक सेवा महाराष्ट्र लोकसेवा अधिकार अधिनियम के तहत संरक्षित है और 7 से 21 दिनों में निवारण की कानूनी गारंटी मिलती है।'
    },
    badge: 'Maharashtra RTS Act Guarantee',
    tip: 'If an officer fails to act within the SLA timeline, the system automatically triggers escalation alerts to senior appellate authorities.',
    highlights: ['Legally Binding SLA Timelines', 'Auto-Escalation to Appellate Officers', 'Official Penalty Warnings']
  },
  {
    step: 4,
    icon: FileCheck,
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    title: {
      en: 'Smart Document Checklist',
      mr: 'कागदपत्रांची अचूक पडताळणी',
      hi: 'स्मार्ट दस्तावेज सूची'
    },
    desc: {
      en: 'Review the mandatory checklist before submitting. The AI explains why each document is required and warns you if anything is missing.',
      mr: 'अर्ज सादर करण्यापूर्वी आवश्यक कागदपत्रांची यादी तपासा. कोणते कागदपत्र का आवश्यक आहे ते एआय सहज समजावून सांगते.',
      hi: 'आवेदन जमा करने से पहले आवश्यक दस्तावेजों की सूची जांचें। कौन सा दस्तावेज क्यों आवश्यक है यह एआई समझाता है।'
    },
    badge: 'Gap Prevention',
    tip: 'Missing proof of address or site photos are flagged immediately, ensuring your grievance is never rejected on clerical omissions.',
    highlights: ['Official Department Requirements', 'One-Click Readiness Assessment', 'Eliminates Document Rejections']
  },
  {
    step: 5,
    icon: Edit3,
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    title: {
      en: 'Fill Form with Real-Time AI Suggestions',
      mr: 'एआय मार्गदर्शनासह अचूक अर्ज भरा',
      hi: 'एआई मार्गदर्शन के साथ सटीक फॉर्म भरें'
    },
    desc: {
      en: 'Get gentle inline assistance while entering details. The AI validates PIN codes, ward boundaries, and helps articulate clear, actionable descriptions.',
      mr: 'तपशील भरताना उपयुक्त सूचना मिळवा. पिन कोड, प्रभाग सीमा आणि समस्येचे अचूक वर्णन करण्यास एआय मदत करते.',
      hi: 'विवरण भरते समय उपयोगी सुझाव प्राप्त करें। पिन कोड, वार्ड सीमा और समस्या का स्पष्ट विवरण लिखने में एआई मदद करता है।'
    },
    badge: 'Assisted Quality Filing',
    tip: 'Helpful hints guide you to attach high-clarity photos and exact GPS locations for expedited on-ground officer inspections.',
    highlights: ['Instant Postal Code Validation', 'GPS Landmark Attachment', 'Clarity & Urgency Enhancer']
  },
  {
    step: 6,
    icon: ShieldCheck,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    title: {
      en: 'Secure Dual-Channel Verified Submission',
      mr: 'सुरक्षित ओटीपी पडताळणीसह अधिकृत नोंदणी',
      hi: 'सुरक्षित ओटीपी सत्यापन के साथ आधिकारिक पंजीकरण'
    },
    desc: {
      en: 'Submit your grievance with Cloudflare Turnstile human verification and instant dual-channel OTP confirmation sent to your registered mobile and email.',
      mr: 'क्लाउडफ्लेअर मानवी पडताळणी आणि सुरक्षित ओटीपीद्वारे आपली तक्रार थेट अधिकृत प्रणालीत नोंदवा.',
      hi: 'क्लाउडफ्लेयर सत्यापन और सुरक्षित ओटीपी के माध्यम से अपनी शिकायत सीधे आधिकारिक पोर्टल पर दर्ज करें।'
    },
    badge: 'Bank-Grade Security',
    tip: 'You immediately receive an authoritative Tracking ID (e.g. GRV-2026-XXXX) with a downloadable acknowledgement receipt.',
    highlights: ['Instant SMS & Email Receipts', 'Permanent Tracking Reference ID', 'Anti-Spam Human Verification']
  },
  {
    step: 7,
    icon: Search,
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
    title: {
      en: 'Track with Plain-Language Explanations',
      mr: 'सोप्या भाषेत प्रगतीचा मागोवा घ्या',
      hi: 'सरल भाषा में लाइव प्रगति ट्रैक करें'
    },
    desc: {
      en: 'Never get stuck wondering what bureaucratic status phrases mean. Click "Explain My Status" anytime on your dashboard for transparent explanations.',
      mr: '"चौकशी प्रलंबित" किंवा "विभागाकडे अग्रेषित" चा खरा अर्थ काय हे एका क्लिकवर सोप्या शब्दात समजून घ्या.',
      hi: '"जांच लंबित" या "विभागाध्यक्ष को प्रेषित" का सरल अर्थ क्या है यह एक क्लिक में समझें।'
    },
    badge: 'Transparent Redressal',
    tip: 'View assigned officer details, field visit notes, and download the official resolution certificate once the work is verified complete.',
    highlights: ['Plain Language AI Explainer', 'Assigned Officer Details', 'Official Closure Certificate']
  }
];

export default function AIGuidedJourney({ isOpen, onClose }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const lang = i18n.language === 'mr' ? 'mr' : i18n.language === 'hi' ? 'hi' : 'en';

  if (!isOpen) return null;

  const current = STEPS[activeStep - 1];
  const StepIcon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadmap-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(9, 34, 62, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #CBD5E1'
        }}
      >
        {/* Tricolor Government Accent Line */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%, #138808 100%)',
            flexShrink: 0
          }}
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)',
            color: '#ffffff',
            padding: 'clamp(16px, 3vw, 22px) clamp(18px, 3.5vw, 28px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF9933',
                flexShrink: 0
              }}
            >
              <Compass size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 id="roadmap-title" style={{ fontSize: 'clamp(1.05rem, 3vw, 1.25rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  {lang === 'mr'
                    ? 'नागरिक मार्गदर्शक: ७ सोप्या पायऱ्या'
                    : lang === 'hi'
                    ? 'नागरिक मार्गदर्शन: 7 सरल चरण'
                    : 'Citizen Roadmap: 7 Easy Steps'}
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'rgba(255, 153, 51, 0.2)',
                    color: '#FFB74D',
                    border: '1px solid rgba(255, 153, 51, 0.4)',
                    padding: '2px 8px',
                    borderRadius: 20
                  }}
                >
                  AI Assisted
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0', lineHeight: 1.3 }}>
                {lang === 'mr'
                  ? 'शासकीय सेवा आणि तक्रार निवारण प्रक्रिया समजून घ्या'
                  : lang === 'hi'
                  ? 'सरकारी सेवा और शिकायत निवारण प्रक्रिया को समझें'
                  : 'How our portal makes citizen grievance redressal fast, simple & transparent'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Milestone Timeline Navigation Bar */}
        <div
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px clamp(12px, 3vw, 24px)',
            overflowX: 'auto',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: '580px',
              gap: 8,
              position: 'relative'
            }}
          >
            {/* Background connecting track */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                right: '20px',
                height: '2px',
                background: '#E2E8F0',
                zIndex: 0,
                transform: 'translateY(-50%)'
              }}
              aria-hidden="true"
            />

            {STEPS.map((s) => {
              const isCompleted = s.step < activeStep;
              const isCurrent = s.step === activeStep;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    outline: 'none'
                  }}
                  title={`Go to Step ${s.step}`}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 750,
                      transition: 'all 0.2s ease',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(255, 153, 51, 0.35)' : 'none',
                      background: isCurrent
                        ? '#123B63'
                        : isCompleted
                        ? '#10B981'
                        : '#ffffff',
                      color: isCurrent || isCompleted ? '#ffffff' : '#64748B',
                      border: isCurrent
                        ? '2px solid #FF9933'
                        : isCompleted
                        ? '2px solid #10B981'
                        : '2px solid #CBD5E1'
                    }}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : s.step}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: isCurrent ? 750 : 500,
                      color: isCurrent ? '#123B63' : isCompleted ? '#059669' : '#64748B',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Step {s.step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Body Content */}
        <div
          style={{
            padding: 'clamp(20px, 4vw, 32px)',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          {/* Header Row: Badge & Step Counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#EEF4FA',
                  color: 'var(--color-primary)',
                  border: '1px solid #BFDBFE'
                }}
              >
                Step {current.step} of {STEPS.length}
              </span>

              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 650,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: current.iconBg,
                  color: current.iconColor
                }}
              >
                {current.badge}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
              Progress: {Math.round((activeStep / STEPS.length) * 100)}% Complete
            </div>
          </div>

          {/* Main Title with Dedicated Icon */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: current.iconBg,
                color: current.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <StepIcon size={24} strokeWidth={2.2} />
            </div>

            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: 'clamp(1.2rem, 3.5vw, 1.45rem)',
                  fontWeight: 800,
                  color: '#09223e',
                  margin: '0 0 6px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.015em'
                }}
              >
                {current.title[lang] || current.title.en}
              </h2>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: 0
                }}
              >
                {current.desc[lang] || current.desc.en}
              </p>
            </div>
          </div>

          {/* Highlight Key Pillars */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {current.highlights.map((h, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.775rem',
                  fontWeight: 650,
                  color: '#334155'
                }}
              >
                <CheckCircle2 size={13} color="#10B981" />
                <span>{h}</span>
              </span>
            ))}
          </div>

          {/* Contextual Real-World Example Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)'
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                flexShrink: 0,
                marginTop: 2
              }}
            >
              <Lightbulb size={16} />
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 750, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                Practical Citizen Scenario
              </div>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                {current.tip}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div
          style={{
            padding: '14px clamp(16px, 3vw, 28px)',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 12
          }}
        >
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.825rem',
              fontWeight: 650,
              padding: '8px 14px',
              borderRadius: '8px',
              color: activeStep === 1 ? '#94A3B8' : '#334155',
              cursor: activeStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          {/* Center Step Dots */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {STEPS.map((s) => (
              <span
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  width: s.step === activeStep ? 22 : 8,
                  height: 8,
                  borderRadius: '4px',
                  background: s.step === activeStep ? '#123B63' : s.step < activeStep ? '#10B981' : '#CBD5E1',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                title={`Step ${s.step}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeStep < STEPS.length ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(STEPS.length, prev + 1))}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(18, 59, 99, 0.18)'
                }}
              >
                <span>Next Step</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/complaints/new');
                }}
                className="btn btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 750,
                  borderRadius: '8px',
                  background: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>Start Filing Grievance</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
