import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, X, Send, Bot, User, ThumbsUp, ThumbsDown,
  ExternalLink, FileText, Clock, HelpCircle, Check, ArrowRight,
  ShieldCheck, RefreshCw, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { aiClient } from '../../services/ai/aiClient';
import AIVoiceInput from './AIVoiceInput';

export default function AIAssistant() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync language with portal i18n
  useEffect(() => {
    if (i18n.language && i18n.language !== currentLang) {
      setCurrentLang(i18n.language);
    }
  }, [i18n.language]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = currentLang === 'mr'
        ? '👋 नमस्कार! मी आपला **महाराष्ट्र शासन एआय सहाय्यक** आहे. मी आपल्याला शासकीय सेवा शोधण्यात, कागदपत्रे समजून घेण्यात आणि अर्जाची स्थिती तपासण्यात मदत करू शकतो.'
        : currentLang === 'hi'
          ? '👋 नमस्कार! मैं आपका **महाराष्ट्र शासन एआई सहायक** हूँ। मैं सरकारी सेवाएं खोजने, आवश्यक दस्तावेज समझने और आवेदन की स्थिति जांचने में आपकी मदद कर सकता हूँ।'
          : '👋 Namaskar! I am your **Maharashtra Government AI Assistant**. How can I assist you with government services, document requirements, or grievance tracking today?';

      setMessages([
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: welcomeMsg,
          timestamp: new Date(),
          source: 'Government of Maharashtra Citizen Services Portal',
        },
      ]);
    }
  }, [currentLang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const quickActions = [
    { label: '🔎 Find a Service', mr: '🔎 सेवा शोधा', hi: '🔎 सेवा खोजें', query: 'I need to find a government service' },
    { label: '📄 Required Documents', mr: '📄 आवश्यक कागदपत्रे', hi: '📄 आवश्यक दस्तावेज़', query: 'What documents are required for domicile certificate?' },
    { label: '📝 Help Me Apply', mr: '📝 अर्ज कसा करावा', hi: '📝 आवेदन कैसे करें', query: 'How do I apply for a caste certificate?' },
    { label: '📊 Check Status', mr: '📊 स्थिती तपासा', hi: '📊 स्थिति देखें', query: 'Where can I track my application status?' },
    { label: '💰 Fees & Charges', mr: '💰 शासकीय शुल्क', hi: '💰 शुल्क विवरण', query: 'How much are the official government fees for income certificate?' },
    { label: '⏱ Processing Time', mr: '⏱ लागणारा वेळ', hi: '⏱ समय सीमा', query: 'What is the processing time under Maharashtra RTS Act?' },
  ];

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setLoading(true);

    try {
      const aiResponse = await aiClient.chat(text, currentLang);

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.response,
        actions: aiResponse.actions || [],
        source: aiResponse.source,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      // Graceful safe fallback response
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: currentLang === 'mr'
            ? 'मी शासकीय सेवांची माहिती शोधत आहे. आपण थेट सेवा सूची किंवा तक्रार नोंदणी पर्यायाचा वापर करू शकता.'
            : 'I am fetching official service information. You can explore standard services or lodge a grievance directly through the portal.',
          actions: [
            { label: 'Lodge Grievance', url: '/complaints/new', type: 'navigate' },
            { label: 'Track Application', url: '/track', type: 'navigate' },
          ],
          source: 'Citizen Services Knowledge Base',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === 'navigate' && action.url) {
      setIsOpen(false);
      navigate(action.url);
    } else if (action.action === 'show_docs') {
      handleSend(`What are the documents required for ${action.serviceId}?`);
    } else if (action.action === 'start_journey') {
      handleSend(`Explain the step-by-step application journey for this service`);
    }
  };

  const handleFeedback = async (msgId, isHelpful) => {
    setFeedbackSent(prev => ({ ...prev, [msgId]: isHelpful }));
    toast.success(isHelpful ? 'Thank you for your feedback!' : 'Feedback received. We will improve our answers.');
    try {
      await aiClient.sendFeedback(isHelpful);
    } catch (e) {
      // silent
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Government Assistant"
            style={{
              background: 'linear-gradient(135deg, #123B63 0%, #09223e 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 999,
              padding: '12px 20px',
              fontSize: '0.925rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(18, 59, 99, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              transition: 'all 0.25s ease',
            }}
            className="ai-pulse-btn"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFA133 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#fff" />
            </div>
            <span>
              {currentLang === 'mr' ? '🤖 विचार AI' : currentLang === 'hi' ? '🤖 पूछें AI' : '🤖 Ask AI'}
            </span>
          </button>
        )}
      </div>

      {/* Slide-in / Drawer Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Government Assistant"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 'clamp(320px, 92vw, 420px)',
            height: 'clamp(480px, 82vh, 640px)',
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid #FF9933',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 750, margin: 0, color: '#ffffff' }}>
                  {currentLang === 'mr' ? 'शासकीय एआय सहाय्यक' : currentLang === 'hi' ? 'शासकीय एआई सहायक' : 'Government AI Assistant'}
                </h2>
                <span style={{ fontSize: '0.725rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> Official RAG Grounded
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Language Switcher */}
              <select
                value={currentLang}
                onChange={(e) => {
                  setCurrentLang(e.target.value);
                  i18n.changeLanguage(e.target.value);
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  padding: '3px 6px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <option value="en" style={{ color: '#000' }}>EN</option>
                <option value="mr" style={{ color: '#000' }}>मराठी</option>
                <option value="hi" style={{ color: '#000' }}>हिन्दी</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: 6,
            }}
          >
            {quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => handleSend(qa.query)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #CBD5E1',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {currentLang === 'mr' ? qa.mr : currentLang === 'hi' ? qa.hi : qa.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: '#F8FAFC',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    background: m.sender === 'user' ? 'var(--color-primary)' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : 'var(--color-text-primary)',
                    borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    border: m.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {m.text}

                  {/* Actions Cards if any */}
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act)}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span>{act.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Source Transparency & Feedback for AI messages */}
                {m.sender === 'ai' && (
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px', fontSize: '0.7rem', color: '#94A3B8' }}>
                    <span>{m.source ? `Source: ${m.source}` : 'Official Service Guidelines'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleFeedback(m.id, true)}
                        disabled={feedbackSent[m.id] !== undefined}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: feedbackSent[m.id] === true ? '#16A34A' : '#94A3B8', padding: 2 }}
                        title="Helpful"
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleFeedback(m.id, false)}
                        disabled={feedbackSent[m.id] !== undefined}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: feedbackSent[m.id] === false ? '#DC2626' : '#94A3B8', padding: 2 }}
                        title="Not helpful"
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
                <Bot size={16} color="var(--color-primary)" className="animate-spin" />
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {currentLang === 'mr' ? 'अधिकृत माहिती तपासत आहे...' : currentLang === 'hi' ? 'आधिकारिक जानकारी खोज रहा हूँ...' : 'Retrieving official service details...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Voice Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #E2E8F0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AIVoiceInput
              language={currentLang}
              onTranscript={(transcript) => {
                setInputVal(transcript);
                handleSend(transcript);
              }}
              size={17}
            />

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                currentLang === 'mr'
                  ? 'आपला प्रश्न येथे लिहा (उदा. अधिवास प्रमाणपत्र)...'
                  : currentLang === 'hi'
                    ? 'अपना प्रश्न यहाँ लिखें (उदा. आय प्रमाण पत्र)...'
                    : 'Ask about any service or complaint...'
              }
              style={{
                flex: 1,
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              aria-label="Send message"
              style={{
                background: inputVal.trim() && !loading ? 'var(--color-primary)' : '#94A3B8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputVal.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
