import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, Sparkles, ArrowRight, FileText, Clock,
  ShieldCheck, HelpCircle, CheckCircle2, ChevronRight, AlertCircle,
  FileCheck, X, Building2
} from 'lucide-react';
import { aiClient } from '../../services/ai/aiClient';
import AIVoiceInput from './AIVoiceInput';
import AIDocumentAssistant from './AIDocumentAssistant';

export default function AIServiceSearch({ onSelectService, onAskAI, headerAction, style }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState(null);
  const [selectedDocService, setSelectedDocService] = useState(null);

  const currentLang = i18n.language || 'en';

  const placeholders = {
    en: 'Example: I want proof that I live in Maharashtra...',
    mr: 'उदा: मला महाराष्ट्रात राहण्याचा पुरावा (दाखला) हवा आहे...',
    hi: 'उदा: मुझे महाराष्ट्र में निवास का प्रमाण पत्र चाहिए...',
  };

  const handleSearch = async (textToSearch = null) => {
    const q = (textToSearch || query).trim();
    if (!q) return;

    setLoading(true);
    try {
      const data = await aiClient.searchServices(q, currentLang);
      setSearchResponse(data);
    } catch (err) {
      console.warn('AI search error, using default view:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    { label: 'Proof of Residence (Domicile)', q: 'I want proof that I live in Maharashtra' },
    { label: 'Pothole on Main Road', q: 'Dangerous pothole on road causing accidents' },
    { label: 'Financial Help for Education', q: 'I need financial assistance for college scholarship' },
    { label: 'Drinking Water Pipeline Burst', q: 'Contaminated muddy water and pipeline leak' },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: 'clamp(20px, 3.5vw, 32px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        margin: '20px 0',
        ...style,
      }}
    >
      {/* Header Container */}
      <div style={{ maxWidth: 840, margin: '0 auto 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: headerAction ? 'space-between' : 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #EEF4FA 0%, #E0F2FE 100%)',
              border: '1px solid #BFDBFE',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 750,
              color: 'var(--color-primary)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <Sparkles size={14} color="#FF6B35" />
            <span>AI NATURAL LANGUAGE SERVICE DISCOVERY</span>
          </div>
          {headerAction}
        </div>

        <div style={{ textAlign: headerAction ? 'left' : 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)', fontWeight: 800, color: '#09223e', margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {currentLang === 'mr'
              ? 'आपल्याला कोणती शासकीय सेवा हवी आहे?'
              : currentLang === 'hi'
              ? 'आपको किस सरकारी सेवा की आवश्यकता है?'
              : 'What do you need help with?'}
          </h2>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {currentLang === 'mr'
              ? 'आपल्या साध्या शब्दात लिहा. आमचे एआय योग्य सेवा, संबंधित विभाग आणि आवश्यक कागदपत्रे शोधून देईल.'
              : 'Tell us what you need in your own natural words. The AI will find the exact government service, documents, and procedure.'}
          </p>
        </div>
      </div>

      {/* Large Smart Search Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#F8FAFC',
          border: '2px solid var(--color-primary)',
          borderRadius: 14,
          padding: '6px 8px 6px 16px',
          maxWidth: 820,
          margin: '0 auto 16px',
          boxShadow: '0 4px 16px rgba(18, 59, 99, 0.08)',
        }}
      >
        <Search size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholders[currentLang] || placeholders.en}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
            color: 'var(--color-text-primary)',
            padding: '8px 0',
          }}
          aria-label="Describe what you need help with"
        />

        <AIVoiceInput
          language={currentLang}
          onTranscript={(t) => {
            setQuery(t);
            handleSearch(t);
          }}
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn btn-primary"
          style={{
            padding: '11px 22px',
            fontSize: '0.925rem',
            fontWeight: 750,
            borderRadius: 10,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {loading ? (
            <span>Searching...</span>
          ) : (
            <>
              <span>Find Service</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Quick Sample Prompts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth: 840,
          margin: '0 auto 20px',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 650 }}>Try asking:</span>
        {exampleQueries.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuery(ex.q);
              handleSearch(ex.q);
            }}
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: '0.775rem',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontWeight: 550,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            "{ex.label}"
          </button>
        ))}
      </div>

      {/* Search Results Display */}
      {searchResponse && searchResponse.results && (
        <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                Recommended Services ({searchResponse.results.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                Matched against official Government of Maharashtra citizen service catalog
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: 20, fontWeight: 650 }}>
              Live Semantic Search Active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
            {searchResponse.results.map((srv) => (
              <div
                key={srv.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #CBD5E1',
                  borderRadius: 14,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.725rem', fontWeight: 750, padding: '3px 9px', borderRadius: 6, border: '1px solid #DBEAFE' }}>
                      {srv.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                      <Building2 size={13} /> {srv.department}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.025rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {srv.name}
                  </h4>

                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '0 0 14px' }}>
                    {srv.description}
                  </p>

                  {/* Why this service badge */}
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: '0.785rem',
                      color: '#166534',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: 2 }}>Why this service?</strong>
                      <span style={{ lineHeight: 1.45 }}>{srv.whyRecommended}</span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.75rem', color: '#475569', marginBottom: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: 6 }}>
                      <Clock size={13} color="var(--color-secondary)" /> SLA: {srv.processingTime}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: 6 }}>
                      <FileText size={13} color="var(--color-secondary)" /> {srv.documentsCount} Documents Required
                    </span>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectService) {
                        onSelectService(srv);
                      } else {
                        navigate(srv.applicationUrl || '/complaints/new');
                      }
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.825rem', fontWeight: 750, borderRadius: 8, flex: 1, justifyContent: 'center' }}
                  >
                    Start Application
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDocService(srv)}
                    className="btn btn-outline"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 650, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <FileCheck size={14} /> Checklist
                  </button>

                  {onAskAI && (
                    <button
                      type="button"
                      onClick={() => onAskAI(`What are the procedures and documents required for ${srv.name}?`)}
                      className="btn btn-ghost"
                      style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--color-primary)' }}
                    >
                      Ask AI
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Checklist Preview Modal */}
      {selectedDocService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Document checklist"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 34, 62, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 99999
          }}
          onClick={() => setSelectedDocService(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              border: '1px solid #CBD5E1'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #E2E8F0', pb: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09223e', margin: 0 }}>
                  {selectedDocService.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Official Document Verification Checklist</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocService(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <AIDocumentAssistant serviceId={selectedDocService.id} />

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => {
                  const srv = selectedDocService;
                  setSelectedDocService(null);
                  if (onSelectService) onSelectService(srv);
                  else navigate('/complaints/new');
                }}
                className="btn btn-primary"
                style={{ padding: '9px 20px', fontSize: '0.875rem', fontWeight: 700, borderRadius: 8 }}
              >
                Proceed to Lodge Grievance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
