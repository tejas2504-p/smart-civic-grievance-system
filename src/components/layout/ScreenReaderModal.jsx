import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Square, 
  X, 
  HelpCircle, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Keyboard, 
  Headphones,
  Sliders
} from 'lucide-react';

export default function ScreenReaderModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('reader'); // 'reader', 'table', 'shortcuts'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechStatus, setSpeechStatus] = useState('Ready to read');
  const [supported, setSupported] = useState(true);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      setSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getPageText = () => {
    const mainEl = document.getElementById('main-content') || document.querySelector('main') || document.body;
    // Clone node to strip script/style/hidden tags
    const clone = mainEl.cloneNode(true);
    const removeSelectors = ['script', 'style', 'noscript', '.hide-desktop', '.ad-marquee-track'];
    removeSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    const text = clone.innerText || clone.textContent || '';
    return text.replace(/\s+/g, ' ').trim().slice(0, 4000);
  };

  const handleSpeak = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      setSpeechStatus('Reading aloud...');
      return;
    }

    synthRef.current.cancel();
    const text = getPageText();
    if (!text) {
      setSpeechStatus('No readable content found on page.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick appropriate voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setSpeechStatus('Reading current page content aloud...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechStatus('Finished reading.');
    };

    utterance.onerror = (e) => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechStatus('Speech synthesis encountered an issue or was cancelled.');
    };

    synthRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (synthRef.current && isSpeaking && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
      setSpeechStatus('Paused reading.');
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechStatus('Stopped reading.');
    }
  };

  const handleRateChange = (rate) => {
    setSpeechRate(rate);
    if (isSpeaking) {
      // restart with new rate
      handleSpeak();
    }
  };

  const screenReaders = [
    {
      name: 'NVDA (NonVisual Desktop Access)',
      website: 'https://www.nvaccess.org/',
      type: 'Free & Open Source',
      os: 'Windows',
      desc: 'One of the most popular free screen readers for Windows with full browser support.'
    },
    {
      name: 'JAWS (Job Access With Speech)',
      website: 'https://www.freedomscientific.com/products/software/jaws/',
      type: 'Commercial',
      os: 'Windows',
      desc: 'Industry standard screen reader for professional Windows environments.'
    },
    {
      name: 'Microsoft Narrator',
      website: 'https://support.microsoft.com/en-us/windows/complete-guide-to-narrator-e4397a0d-1c4f-138f-9a8f-ac2a049e3a33',
      type: 'Built-in (Free)',
      os: 'Windows 10 / 11',
      desc: 'Built directly into Windows. Press Win + Ctrl + Enter to toggle on/off.'
    },
    {
      name: 'Apple VoiceOver',
      website: 'https://www.apple.com/accessibility/mac/vision/',
      type: 'Built-in (Free)',
      os: 'macOS & iOS',
      desc: 'Standard built-in screen reader for Apple devices. Press Cmd + F5 to activate.'
    },
    {
      name: 'Google TalkBack / Android Accessibility',
      website: 'https://support.google.com/accessibility/android/answer/6283677',
      type: 'Built-in (Free)',
      os: 'Android',
      desc: 'Google screen reader pre-installed on Android mobile devices.'
    }
  ];

  const shortcuts = [
    { key: 'Tab', action: 'Move to next clickable element / input field' },
    { key: 'Shift + Tab', action: 'Move to previous clickable element / input field' },
    { key: 'Enter / Space', action: 'Activate focused button or link' },
    { key: 'Esc (Escape)', action: 'Close any active modal, dialog, or drawer' },
    { key: 'Alt + S or Skip Link', action: 'Jump directly to main content area' },
    { key: 'Win + Ctrl + Enter', action: 'Toggle Windows Narrator screen reader on/off' },
    { key: 'Cmd + F5', action: 'Toggle Apple Mac VoiceOver screen reader on/off' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="ad-marquee-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="screen-reader-modal-title"
      style={{ zIndex: 1200 }}
    >
      <div 
        className="ad-marquee-modal-card"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="ad-marquee-modal-header" style={{ background: '#09223e', color: '#fff', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headphones size={18} color="#FF9933" />
            </div>
            <div>
              <h2 id="screen-reader-modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Screen Reader Access & Speech
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                GIGW compliant assistive accessibility tools & guidance
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close accessibility window"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: '#f8fafc', padding: '0 16px' }}>
          <button
            onClick={() => setActiveTab('reader')}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'reader' ? 650 : 500,
              color: activeTab === 'reader' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'reader' ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Volume2 size={15} />
            <span>Live Read Aloud (TTS)</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'table' ? 650 : 500,
              color: activeTab === 'table' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'table' ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <HelpCircle size={15} />
            <span>Screen Readers</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'shortcuts' ? 650 : 500,
              color: activeTab === 'shortcuts' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'shortcuts' ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Keyboard size={15} />
            <span>Keyboard Shortcuts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: LIVE READ ALOUD */}
          {activeTab === 'reader' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#FFF9E6', border: '1px solid #E8D7B8', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={16} color="#B45309" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#78350F' }}>
                    Web Speech Text-to-Speech Engine
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#5C4827', margin: 0, lineHeight: 1.5 }}>
                  Instantly listen to the contents of the current page. Ideal for citizens with visual impairment, low vision, or reading convenience.
                </p>
              </div>

              {!supported && (
                <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: 12, borderRadius: 6, fontSize: '0.85rem' }}>
                  Speech synthesis is not supported in this browser. Please use an assistive screen reader like NVDA or JAWS.
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!isSpeaking || isPaused ? (
                      <button
                        onClick={handleSpeak}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
                      >
                        <Play size={15} />
                        <span>{isPaused ? 'Resume Reading' : 'Read Aloud Current Page'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        className="btn btn-warning btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#D97706', color: '#fff', border: 'none' }}
                      >
                        <Pause size={15} />
                        <span>Pause</span>
                      </button>
                    )}

                    {(isSpeaking || isPaused) && (
                      <button
                        onClick={handleStop}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                      >
                        <Square size={14} />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>

                  {/* Speech Rate buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginRight: 4 }}>Speed:</span>
                    {[0.8, 1.0, 1.25].map(r => (
                      <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        style={{
                          background: speechRate === r ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: speechRate === r ? '#fff' : 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          padding: '3px 7px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: speechRate === r ? 600 : 400
                        }}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: isSpeaking ? 'var(--color-success)' : 'var(--color-text-secondary)', marginTop: 4 }}>
                  <span 
                    style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: isSpeaking ? 'var(--color-success)' : isPaused ? '#D97706' : '#94a3b8',
                      display: 'inline-block' 
                    }} 
                  />
                  <span>{speechStatus}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                💡 <strong>Tip:</strong> You can also highlight any text on the page or navigate with keyboard tabs to read specific sections.
              </div>
            </div>
          )}

          {/* TAB 2: SCREEN READERS TABLE */}
          {activeTab === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                This portal complies with World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and GIGW standards. The following assistive screen readers are supported:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {screenReaders.map((sr, idx) => (
                  <div 
                    key={idx}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontWeight: 650, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                        {sr.name}
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                        {sr.type} · {sr.os}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {sr.desc}
                    </p>
                    <a
                      href={sr.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, textDecoration: 'none', fontWeight: 500 }}
                    >
                      <span>Visit Official Download / Support Page</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Standard keyboard navigation shortcuts for hands-free or screen reader navigation:
              </p>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 650, color: 'var(--color-text-primary)', width: '38%' }}>Shortcut Key</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 650, color: 'var(--color-text-primary)' }}>Function / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortcuts.map((sc, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < shortcuts.length - 1 ? '1px solid var(--color-border)' : 'none', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '8px 14px' }}>
                          <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                            {sc.key}
                          </kbd>
                        </td>
                        <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>
                          {sc.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ad-marquee-modal-footer">
          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ padding: '7px 20px' }}
          >
            Got It / Close
          </button>
        </div>
      </div>
    </div>
  );
}
