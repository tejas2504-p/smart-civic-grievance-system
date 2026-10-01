import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, HelpCircle, X, CheckCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { aiClient } from '../../services/ai/aiClient';

export default function AIStatusExplainer({ status, complaintId = null }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);

  const currentLang = i18n.language || 'en';

  const fetchExplanation = async () => {
    setIsOpen(true);
    if (!explanation) {
      setLoading(true);
      try {
        const data = await aiClient.explainStatus(status, complaintId, currentLang);
        setExplanation(data);
      } catch (err) {
        console.warn('Status explainer failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={fetchExplanation}
        className="btn btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: '0.8rem',
          fontWeight: 650,
          borderRadius: 6,
          background: '#EEF4FA',
          color: 'var(--color-primary)',
          border: '1px solid #BFDBFE',
        }}
      >
        <Bot size={15} color="#FF6B35" />
        <span>{currentLang === 'mr' ? '🤖 स्थितीचे स्पष्टीकरण' : currentLang === 'hi' ? '🤖 स्थिति का विवरण' : '🤖 Explain My Status'}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Application Status Explainer"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 99999,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 14,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 750, margin: 0, color: '#ffffff' }}>
                    {currentLang === 'mr' ? 'अर्जाच्या स्थितीचे स्पष्टीकरण' : currentLang === 'hi' ? 'आवेदन की स्थिति का विवरण' : 'Application Status Explained'}
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                    Current Status: <strong style={{ color: '#FCD34D' }}>{status}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B' }}>
                  <Bot size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Analyzing official stage and citizen charter SLA...</p>
                </div>
              ) : explanation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: 14,
                      fontSize: '0.875rem',
                      lineHeight: 1.55,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {explanation.explanation}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', background: '#F0FDF4', padding: '8px 12px', borderRadius: 8 }}>
                      <CheckCircle size={15} color="#16A34A" />
                      <span><strong>Next Milestone:</strong> {explanation.nextStep}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E40AF', background: '#EFF6FF', padding: '8px 12px', borderRadius: 8 }}>
                      <Clock size={15} color="#2563EB" />
                      <span><strong>Target SLA:</strong> {explanation.slaTarget}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={13} color="#16A34A" /> Verified Against Citizen Charter
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 6 }}
                    >
                      Got It
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
