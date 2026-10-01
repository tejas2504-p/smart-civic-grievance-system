import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, AlertTriangle, Sparkles, CheckCircle2, Info, X, ShieldCheck, Check, Lightbulb } from 'lucide-react';
import { aiClient } from '../../services/ai/aiClient';

// Common field guidance dictionary in EN, MR, HI
const FIELD_GUIDE = {
  category: {
    en: {
      title: 'Department / Category Selection',
      tip: 'Select the primary department responsible for your issue. For example, choose PWD / Roads for potholes, Water Supply for pipeline leaks, or Revenue for caste/domicile certificates.',
      example: 'Example: Pothole on Link Road -> Roads & Infrastructure'
    },
    mr: {
      title: 'विभाग / वर्गवारी निवड',
      tip: 'आपल्या समस्येशी संबंधित मुख्य शासकीय विभाग निवडा. खड्ड्यांसाठी बांधकाम (PWD), पाण्याच्या समस्येसाठी पाणीपुरवठा, किंवा दाखल्यांसाठी महसूल विभाग निवडा.',
      example: 'उदा: रस्त्यावरील खड्डा -> रस्ते आणि पायाभूत सुविधा'
    },
    hi: {
      title: 'विभाग / श्रेणी चयन',
      tip: 'अपनी समस्या से संबंधित प्राथमिक विभाग चुनें। जैसे सड़कों के गड्ढों के लिए लोक निर्माण विभाग (PWD) या पानी की समस्या के लिए जलापूर्ति विभाग।',
      example: 'उदा: सड़क पर गड्ढा -> सड़क एवं अवसंरचना'
    }
  },
  title: {
    en: {
      title: 'Complaint Subject Title',
      tip: 'Keep it clear and specific (5 to 12 words). Mention both the exact problem and your area/locality for rapid triage.',
      example: 'Example: Contaminated drinking water supply in Ward 12, Shivajinagar'
    },
    mr: {
      title: 'तक्रारीचा मुख्य विषय',
      tip: 'विषय संक्षिप्त व स्पष्ट ठेवा (५ ते १२ शब्द). समस्या व परिसराचा स्पष्ट उल्लेख केल्यास विभाग जलद दखल घेतो.',
      example: 'उदा: प्रभाग क्र. १२, शिवाजीनगर येथे गढूळ पिण्याच्या पाण्याचा पुरवठा'
    },
    hi: {
      title: 'शिकायत का विषय',
      tip: 'विषय संक्षिप्त और स्पष्ट रखें (5 से 12 शब्द)। समस्या और स्थान का स्पष्ट उल्लेख करें।',
      example: 'उदा: वार्ड 12, शिवाजीनगर में दूषित पेयजल आपूर्ति'
    }
  },
  description: {
    en: {
      title: 'Detailed Problem Description',
      tip: 'Include: 1. Exact landmark / building, 2. When the problem started, 3. Number of affected citizens, 4. Prior reference number (if any).',
      example: 'Tip: Adding specific landmarks like "Opposite ZP School, Near Water Tank" helps officers inspect the site within 24 hours.'
    },
    mr: {
      title: 'समस्येचा सविस्तर तपशील',
      tip: 'वर्णन करा: १. अचूक महत्त्वाची खूण, २. समस्या कधीपासून सुरू झाली, ३. नागरिकांवर होणारा परिणाम, ४. जुन्या अर्जाचा क्रमांक.',
      example: 'सल्ला: "जि.प. शाळेसमोर, पाण्याच्या टाकीजवळ" अशी खूण दिल्यास अधिकारी २४ तासांत पाहणी करू शकतात.'
    },
    hi: {
      title: 'समस्या का विस्तृत विवरण',
      tip: 'वर्णन करें: 1. सटीक लैंडमार्क, 2. समस्या कब से शुरू हुई, 3. प्रभावित नागरिक, 4. पुरानी शिकायत संख्या यदि कोई हो।',
      example: 'सुझाव: "प्राथमिक विद्यालय के सामने" जैसा लैंडमार्क देने से अधिकारी 24 घंटे में पहुंच सकते हैं।'
    }
  },
  address: {
    en: {
      title: 'Incident Location / Street Address',
      tip: 'Provide complete street name, building/society name, and notable landmark. Accurate addresses reduce field inspection time by 40%.',
      example: 'Example: Flat 402, Shiv Shradha Heights, Behind Old ST Bus Stand, Satara Road'
    },
    mr: {
      title: 'घटनेचे ठिकाण / पत्ता',
      tip: 'रस्त्याचे नाव, इमारतीचे नाव आणि महत्त्वाची खूण स्पष्ट लिहा. अचूक पत्ता दिल्यास क्षेत्रीय अधिकाऱ्यांची पाहणी ४०% जलद होते.',
      example: 'उदा: फ्लॅट ४०२, शिवश्रद्धा हाइट्स, जुन्या एसटी बस स्टँडमागे, सातारा रस्ता'
    },
    hi: {
      title: 'घटना स्थल / सड़क का पता',
      tip: 'सड़क का नाम, भवन का नाम और लैंडमार्क स्पष्ट लिखें। सटीक पते से मौके पर निरीक्षण 40% तेजी से होता है।',
      example: 'उदा: फ्लैट 402, शिवश्रद्धा हाइट्स, पुराने बस स्टैंड के पीछे'
    }
  },
  pincode: {
    en: {
      title: 'Official Postal PIN Code',
      tip: 'Enter a valid 6-digit Maharashtra PIN code (starts with 40, 41, 42, 43, or 44). This automatically routes your request to the local ward engineer.',
      example: 'Valid format: 400001 to 445402'
    },
    mr: {
      title: 'पोस्टल पिन कोड',
      tip: 'महाराष्ट्रातील वैध ६ अंकी पिन कोड प्रविष्ट करा (४०, ४१, ४२, ४३ किंवा ४४ ने सुरू होणारा). यामुळे तक्रार थेट स्थानिक क्षेत्रीय अभियंत्याकडे वर्ग होते.',
      example: 'वैध स्वरूप: ४००००१ ते ४४५४०२'
    },
    hi: {
      title: 'पोस्टल पिन कोड',
      tip: 'महाराष्ट्र का वैध 6 अंकों का पिन कोड दर्ज करें (40, 41, 42, 43 या 44 से शुरू होने वाला)। इससे शिकायत सीधे स्थानीय वार्ड इंजीनियर को भेजी जाती है।',
      example: 'वैध प्रारूप: 400001 से 445402'
    }
  },
  district: {
    en: {
      title: 'Administrative District',
      tip: 'Select the official Maharashtra revenue district where the issue exists or where the citizen service is sought.',
      example: 'Examples: Pune, Mumbai City, Mumbai Suburban, Thane, Nagpur, Nashik, Chhatrapati Sambhajinagar'
    },
    mr: {
      title: 'प्रशासकीय जिल्हा',
      tip: 'समस्या ज्या महसूल जिल्ह्यात येते किंवा ज्या जिल्ह्यासाठी सेवा हवी आहे तो अधिकृत महाराष्ट्र जिल्हा निवडा.',
      example: 'उदा: पुणे, मुंबई शहर, मुंबई उपनगर, ठाणे, नागपूर, नाशिक, छत्रपती संभाजीनगर'
    },
    hi: {
      title: 'प्रशासनिक जिला',
      tip: 'जिस जिले में समस्या है अथवा जहां के लिए सेवा चाहिए, वह महाराष्ट्र का आधिकारिक जिला चुनें।',
      example: 'उदा: पुणे, मुंबई, ठाणे, नागपुर, नासिक, छत्रपति संभाजीनगर'
    }
  },
  attachments: {
    en: {
      title: 'Supporting Evidence & Photos',
      tip: 'Attach geotagged photos or scan copies (PDF/JPG/PNG up to 10MB). Submitting visual evidence cuts dispute and resolution time by half.',
      example: 'Recommended: Clear daylight photo of road pothole or water meter leak'
    },
    mr: {
      title: 'पुरावे व छायाचित्रे',
      tip: 'स्पष्ट फोटो किंवा स्कॅन प्रत जोडा (PDF/JPG/PNG कमाल १०MB). फोटो जोडल्यास तक्रार जलद निकाली निघते.',
      example: 'शिफारस: दिवसा काढलेले रस्त्यावरील खड्ड्याचे स्पष्ट छायाचित्र'
    },
    hi: {
      title: 'सहायक दस्तावेज व चित्र',
      tip: 'स्पष्ट फोटो या स्कैन कॉपी संलग्न करें (PDF/JPG/PNG अधिकतम 10MB)। फोटो से समाधान आधा समय में होता है।',
      example: 'अनुशंसित: सड़क के गड्ढे का स्पष्ट फोटो'
    }
  }
};

/**
 * Modern AI Field Help Tooltip / Popover with Hover Intent, Clean Positioning & Indian Government Design
 */
export function AIFormFieldHelp({ fieldKey, customTip }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const triggerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const lang = i18n.language === 'mr' ? 'mr' : i18n.language === 'hi' ? 'hi' : 'en';

  const guide = FIELD_GUIDE[fieldKey]?.[lang] || FIELD_GUIDE[fieldKey]?.['en'] || {
    title: 'Field Assistance',
    tip: customTip || 'Please provide accurate information as per your official documents.',
    example: ''
  };

  // Determine if popup should align to the right to prevent going off-screen
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.left + 350 > window.innerWidth - 16) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [open]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 250); // 250ms grace period so cursor can travel smoothly into tooltip
  };

  return (
    <span
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: '6px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button / Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(prev => !prev);
        }}
        aria-expanded={open}
        aria-label={`AI Help for ${guide.title}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '20px',
          background: open ? 'linear-gradient(135deg, #123B63 0%, #1D5D91 100%)' : '#EEF4FA',
          color: open ? '#ffffff' : '#123B63',
          border: open ? '1px solid #123B63' : '1px solid #BFDBFE',
          fontSize: '0.685rem',
          fontWeight: 750,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1.4,
          boxShadow: open ? '0 2px 6px rgba(18, 59, 99, 0.2)' : 'none',
          outline: 'none',
        }}
        title="Click or hover for AI guidelines"
      >
        <Sparkles size={11} color={open ? '#FF9933' : '#E67E22'} />
        <span>AI Guide</span>
      </button>

      {/* Pop-up Card */}
      {open && (
        <div
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: alignRight ? 'auto' : 0,
            right: alignRight ? 0 : 'auto',
            zIndex: 1000,
            width: 'min(340px, calc(100vw - 40px))',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(9, 34, 62, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
            textAlign: 'left',
          }}
        >
          {/* Top Indian Tricolor Accent Line */}
          <div
            style={{
              height: '3px',
              width: '100%',
              background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%, #138808 100%)',
            }}
            aria-hidden="true"
          />

          <div style={{ padding: '12px 14px' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: '8px', borderBottom: '1px solid #E2E8F0', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '6px', background: '#EEF4FA', color: '#123B63', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={12} color="#FF6B35" />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 750, color: '#09223e', lineHeight: 1.2 }}>
                  {guide.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                  RTS Rule
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}
                  aria-label="Close guidance"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tip Description */}
            <p style={{ fontSize: '0.785rem', color: '#334155', lineHeight: 1.5, margin: '0 0 10px' }}>
              {guide.tip}
            </p>

            {/* Recommended Format / Example */}
            {guide.example && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.735rem',
                  color: '#166534',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>Recommended Format:</strong>
                  <span>{guide.example}</span>
                </div>
              </div>
            )}

            {/* Trust Footer */}
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.675rem', color: '#64748B' }}>
              <ShieldCheck size={12} color="#10B981" />
              <span>Official Maharashtra Redressal Standard</span>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Non-Intrusive Form Consistency Banner
 * Silently validates semantic relationships without blocking form submission.
 */
export function AIFormConsistencyBanner({ formData }) {
  const { i18n } = useTranslation();
  const [warnings, setWarnings] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!formData) return;
    const timer = setTimeout(async () => {
      try {
        const lang = i18n.language || 'en';
        const res = await aiClient.validateFormConsistency(formData, lang);
        if (res?.success && Array.isArray(res.inconsistencies)) {
          setWarnings(res.inconsistencies);
          setDismissed(false);
        }
      } catch (e) {
        // Silent fallback - never block the user
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [formData?.pincode, formData?.district, formData?.category, formData?.description, i18n.language]);

  if (dismissed || warnings.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        margin: '16px 0',
        borderRadius: '12px',
        border: '1px solid #FDE68A',
        background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)',
        padding: '14px 16px',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Lightbulb size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 750, color: '#92400E', margin: 0 }}>
                {i18n.language === 'mr'
                  ? 'एआय मदतनीस सूचना (मार्गदर्शन)'
                  : i18n.language === 'hi'
                  ? 'एआई सहायक सुझाव (मार्गदर्शन)'
                  : 'AI Quality Guidance Tip'}
              </h4>
              <span style={{ fontSize: '0.685rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                {warnings.length} {warnings.length === 1 ? 'smart tip' : 'smart tips'}
              </span>
            </div>

            <p style={{ fontSize: '0.785rem', color: '#B45309', margin: '3px 0 8px', lineHeight: 1.4 }}>
              {i18n.language === 'mr'
                ? 'हे केवळ अचूकतेसाठी मार्गदर्शन आहे. आपण इच्छित असल्यास हा फॉर्म जसा आहे तसा सबमिट करू शकता.'
                : 'Helpful advice to prevent administrative delays. You may still proceed with your submission.'}
            </p>

            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.785rem', color: '#78350F', lineHeight: 1.5 }}>
              {warnings.map((w, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  <span>{w.message || w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#B45309',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss suggestions"
          aria-label="Dismiss tip"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default AIFormFieldHelp;
