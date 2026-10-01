import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck, FileText, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp,
  Sparkles, ExternalLink, HelpCircle, ArrowRight
} from 'lucide-react';
import { aiClient } from '../../services/ai/aiClient';

export default function AIDocumentAssistant({ serviceId = 'domicile_certificate', onChecklistChange }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const [service, setService] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState({});
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      setLoading(true);
      try {
        const res = await aiClient.getDocumentChecklist(serviceId, lang);
        if (isMounted && res?.success) {
          setService(res);
          const initial = {};
          (res.requiredDocuments || []).forEach(d => {
            initial[d.name] = false;
          });
          setSelectedDocs(initial);
        }
      } catch (e) {
        console.error('Failed to load document checklist', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDocs();
    return () => { isMounted = false; };
  }, [serviceId, lang]);

  const toggleDoc = (docName) => {
    const updated = {
      ...selectedDocs,
      [docName]: !selectedDocs[docName]
    };
    setSelectedDocs(updated);
    if (onChecklistChange) {
      onChecklistChange(updated);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
        Loading official document requirements...
      </div>
    );
  }

  if (!service || !service.requiredDocuments || service.requiredDocuments.length === 0) {
    return null;
  }

  const docs = service.requiredDocuments;
  const total = docs.length;
  const readyCount = Object.values(selectedDocs).filter(Boolean).length;
  const missingCount = total - readyCount;
  const isAllReady = readyCount === total && total > 0;

  return (
    <div
      style={{
        borderRadius: '14px',
        border: '1px solid #BFDBFE',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        padding: 'clamp(16px, 3vw, 20px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: '#123B63',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#09223e', margin: 0 }}>
                  {service.serviceTitle || 'Required Documents Checklist'}
                </h3>
                <span style={{ fontSize: '0.685rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                  Official RTS Rule
                </span>
              </div>
              <p style={{ fontSize: '0.785rem', color: '#64748B', margin: '2px 0 0' }}>
                {lang === 'mr'
                  ? 'कागदपत्रांची पूर्तता तपासा. प्रत्येक कागदपत्राची गरज जाणून घेण्यासाठी क्लिक करा.'
                  : lang === 'hi'
                  ? 'दस्तावेज आवश्यकताएं जांचें। यह जानने के लिए क्लिक करें कि प्रत्येक दस्तावेज क्यों जरूरी है।'
                  : 'Interactive readiness checker. Tap any document to see why it is legally required.'}
              </p>
            </div>
          </div>

          {/* Progress Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', padding: '4px 12px', borderRadius: '20px', border: '1px solid #CBD5E1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 650, color: '#334155' }}>
              {readyCount} / {total} {lang === 'mr' ? 'तयार' : lang === 'hi' ? 'तैयार' : 'Ready'}
            </span>
            <div style={{ width: 64, height: 6, background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(readyCount / total) * 100}%`,
                  background: isAllReady ? '#10B981' : '#2563EB',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {docs.map((d, index) => {
          const isChecked = !!selectedDocs[d.name];
          const isExpanded = expandedDoc === d.name;

          return (
            <div
              key={index}
              style={{
                borderRadius: '10px',
                border: isChecked ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                background: isChecked ? '#F0FDF4' : '#ffffff',
                padding: '12px 14px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  id={`doc-check-${index}`}
                  checked={isChecked}
                  onChange={() => toggleDoc(d.name)}
                  style={{
                    marginTop: 3,
                    width: 17,
                    height: 17,
                    accentColor: '#10B981',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <label
                      htmlFor={`doc-check-${index}`}
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 650,
                        color: isChecked ? '#065F46' : '#1E293B',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {d.name}
                    </label>

                    <button
                      type="button"
                      onClick={() => setExpandedDoc(isExpanded ? null : d.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.725rem',
                        color: '#2563EB',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontWeight: 600,
                        flexShrink: 0
                      }}
                    >
                      <HelpCircle size={13} />
                      <span>{isExpanded ? 'Hide reason' : 'Why required?'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Why required expandable explanation */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        fontSize: '0.785rem',
                        color: '#1E3A8A'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, marginBottom: 4 }}>
                        <Sparkles size={13} color="#2563EB" />
                        <span>Why Maharashtra RTS Act mandates this:</span>
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.45, color: '#334155' }}>
                        {d.whyRequired || 'Mandatory as legal evidence under Maharashtra Right to Services Rules.'}
                      </p>
                      {d.howToGet && (
                        <div style={{ marginTop: 6, fontSize: '0.725rem', color: '#475569' }}>
                          <strong>How to obtain:</strong> {d.howToGet}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary / Gap Analysis */}
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.775rem' }}>
        {isAllReady ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 650 }}>
            <CheckCircle2 size={16} />
            <span>
              {lang === 'mr'
                ? 'उत्कृष्ट! सर्व आवश्यक कागदपत्रे उपलब्ध आहेत.'
                : lang === 'hi'
                ? 'बहुत बढ़िया! आपके पास सभी आवश्यक दस्तावेज तैयार हैं।'
                : 'All set! You have all required documents ready to attach.'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>
              {missingCount} {lang === 'mr' ? 'कागदपत्रे बाकी आहेत. सर्व कागदपत्रे जोडल्यास अर्ज फेटाळला जात नाही.' : 'documents remaining. Having complete papers prevents rejection.'}
            </span>
          </div>
        )}

        <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 550 }}>
          Fees: ₹{service.fees || 0} • Statutory SLA: {service.slaDays || 7} Days
        </div>
      </div>
    </div>
  );
}
