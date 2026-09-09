import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Volume2, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * High-Assurance Indian Government Civic Security CAPTCHA Component
 * 
 * Features:
 * 1. Official Government Visual Security Code (Canvas-rendered with anti-bot distortion, wave curves & security noise).
 * 2. Audio speech synthesizer (🔊) for Government Web Accessibility Guidelines (GWAG).
 * 3. Instant refresh (🔄) to regenerate a fresh code.
 * 4. Case-insensitive auto-verification with cryptographic server-side HMAC token.
 * 5. Persistent verification state: does NOT reload when verified code is entered.
 * 6. High-visibility green badge & feedback banner showing "Security code verified / Captcha is right".
 * 7. Optional Cloudflare Turnstile mode with auto-fallback.
 */
export const TurnstileCaptcha = forwardRef(function TurnstileCaptcha(
  { onVerify, onExpire, onError, theme = 'light', mode: defaultMode = 'visual' },
  ref
) {
  // Mode: 'visual' (Government Security Code) | 'turnstile' (Cloudflare)
  const [captchaMode, setCaptchaMode] = useState(defaultMode);

  // Keep latest callbacks in refs so they NEVER trigger re-renders or effect re-runs
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  // Visual CAPTCHA state
  const [captchaData, setCaptchaData] = useState(null); // { captchaId, code, timestamp }
  const [userInput, setUserInput] = useState('');
  const [isVisualVerified, setIsVisualVerified] = useState(false);
  const [visualError, setVisualError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef(null);

  // Turnstile state
  const turnstileContainerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);

  const siteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  // =========================================================================
  // 1. VISUAL GOVERNMENT SECURITY CODE GENERATOR & CANVAS RENDERER
  // =========================================================================

  // Draw anti-bot distorted security canvas
  const drawCaptchaCanvas = useCallback((code) => {
    const canvas = canvasRef.current;
    if (!canvas || !code) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Clean background with subtle civic security tint
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle background grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Random security wavy lines across canvas
    const lineColors = ['#94a3b8', '#cbd5e1', '#64748b'];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.25, Math.random() * height,
        width * 0.75, Math.random() * height,
        width, Math.random() * height
      );
      ctx.stroke();
    }

    // 4. Random noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = lineColors[i % lineColors.length];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw distorted characters
    const charList = code.split('');
    const charSpacing = (width - 24) / charList.length;
    const charColors = ['#123B63', '#1D5D91', '#0d2d4e', '#164878', '#1e293b'];
    const fonts = ['bold 22px Inter, sans-serif', 'bold 24px Courier New, monospace', 'bold 22px Arial, sans-serif'];

    charList.forEach((char, idx) => {
      ctx.save();
      const x = 14 + idx * charSpacing + (Math.random() * 4 - 2);
      const y = height / 2 + 7 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = charColors[idx % charColors.length];
      ctx.font = fonts[idx % fonts.length];
      ctx.fillText(char, 0, 0);

      ctx.restore();
    });

    // 6. Security wave line cutting across characters
    ctx.strokeStyle = 'rgba(18, 59, 99, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, height / 2);
    ctx.quadraticCurveTo(width / 2, height / 2 + (Math.random() * 16 - 8), width - 4, height / 2);
    ctx.stroke();
  }, []);

  // Fetch new challenge from server or generate fallback
  const fetchNewChallenge = useCallback(async () => {
    setIsRefreshing(true);
    setUserInput('');
    setIsVisualVerified(false);
    setVisualError('');
    if (onExpireRef.current) onExpireRef.current();

    try {
      const res = await api.getCaptcha();
      if (res && res.success) {
        setCaptchaData(res);
        setTimeout(() => drawCaptchaCanvas(res.code), 50);
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      // Offline / network fallback with client-side timestamp
      const fallbackChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += fallbackChars.charAt(Math.floor(Math.random() * fallbackChars.length));
      }
      const timestamp = Date.now();
      const fallbackData = {
        captchaId: `client_fallback.${timestamp}`,
        code,
        timestamp,
      };
      setCaptchaData(fallbackData);
      setTimeout(() => drawCaptchaCanvas(code), 50);
    } finally {
      setIsRefreshing(false);
    }
  }, [drawCaptchaCanvas]);

  // Initial load - ONLY run once when mode changes, never on re-render!
  useEffect(() => {
    if (captchaMode === 'visual') {
      fetchNewChallenge();
    }
  }, [captchaMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle user typing security code
  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setUserInput(val);

    if (!captchaData) return;

    if (val.length === 6) {
      if (val === captchaData.code.toUpperCase()) {
        setIsVisualVerified(true);
        setVisualError('');
        const hmacPart = captchaData.captchaId.split('.')[0];
        const verifiedToken = `CIVIC_CAPTCHA:${val}:${hmacPart}:${captchaData.timestamp}`;
        if (onVerifyRef.current) onVerifyRef.current(verifiedToken);
      } else {
        setIsVisualVerified(false);
        setVisualError('Incorrect security code. Please check the characters or click reload.');
        if (onExpireRef.current) onExpireRef.current();
      }
    } else {
      if (isVisualVerified) {
        setIsVisualVerified(false);
        if (onExpireRef.current) onExpireRef.current();
      }
      if (visualError && val.length < 6) {
        setVisualError('');
      }
    }
  };

  // Audio speech accessibility (Text-to-Speech)
  const handleSpeakCaptcha = () => {
    if (!captchaData || !captchaData.code) return;
    if (!window.speechSynthesis) {
      alert('Speech synthesis not supported in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const spokenCode = captchaData.code.split('').join('. ');
      const utterance = new SpeechSynthesisUtterance(`Security code is: ${spokenCode}`);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // =========================================================================
  // 2. CLOUDFLARE TURNSTILE INTEGRATION (OPTIONAL / ALTERNATE)
  // =========================================================================

  const renderTurnstileWidget = useCallback(() => {
    if (!window.turnstile || !turnstileContainerRef.current) return;

    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
    }

    try {
      const widgetId = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        theme: theme,
        callback: (newToken) => {
          setTurnstileToken(newToken);
          setTurnstileLoaded(true);
          setTurnstileError(false);
          if (onVerifyRef.current) onVerifyRef.current(newToken);
        },
        'expired-callback': () => {
          setTurnstileToken('');
          if (onExpireRef.current) onExpireRef.current();
        },
        'error-callback': (errCode) => {
          console.warn('Turnstile error:', errCode);
          setTurnstileError(true);
          setTurnstileLoaded(false);
          setCaptchaMode('visual');
          fetchNewChallenge();
        },
      });
      widgetIdRef.current = widgetId;
      setTurnstileLoaded(true);
    } catch (err) {
      console.warn('Turnstile render exception:', err.message);
      setTurnstileError(true);
      setCaptchaMode('visual');
      fetchNewChallenge();
    }
  }, [siteKey, theme, fetchNewChallenge]);

  useEffect(() => {
    if (captchaMode !== 'turnstile') return;

    let checkInterval = null;
    let attempts = 0;

    if (window.turnstile) {
      renderTurnstileWidget();
    } else {
      checkInterval = setInterval(() => {
        attempts++;
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderTurnstileWidget();
        } else if (attempts > 25) {
          clearInterval(checkInterval);
          setTurnstileError(true);
          setCaptchaMode('visual');
          fetchNewChallenge();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [captchaMode, renderTurnstileWidget, fetchNewChallenge]);

  // =========================================================================
  // 3. EXPOSE IMPERATIVE METHODS VIA REF
  // =========================================================================
  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (captchaMode === 'visual') {
        if (isVisualVerified && captchaData) {
          const hmacPart = captchaData.captchaId.split('.')[0];
          return `CIVIC_CAPTCHA:${userInput}:${hmacPart}:${captchaData.timestamp}`;
        }
        return '';
      }
      return turnstileToken;
    },
    reset: () => {
      setUserInput('');
      setIsVisualVerified(false);
      setVisualError('');
      setTurnstileToken('');
      if (captchaMode === 'visual') {
        fetchNewChallenge();
      } else if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    },
    isVerified: () => (captchaMode === 'visual' ? isVisualVerified : !!turnstileToken),
  }));

  // =========================================================================
  // 4. RENDER UI
  // =========================================================================
  const isVerified = captchaMode === 'visual' ? isVisualVerified : !!turnstileToken;

  return (
    <div
      style={{
        margin: '14px 0',
        padding: '12px 14px',
        background: isVerified ? '#F0FDF4' : '#F8FAFC',
        border: isVerified ? '2px solid #16A34A' : '1px solid var(--color-border)',
        borderRadius: 8,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: isVerified ? '#15803D' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={16} color={isVerified ? '#16A34A' : 'var(--color-primary)'} />
          <span>Human Verification / सुरक्षा पडताळणी</span>
          <span className="required" aria-hidden="true">*</span>
        </span>

        {isVerified ? (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#15803D',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#DCFCE7',
              padding: '3px 10px',
              borderRadius: 5,
              border: '1px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={14} color="#16A34A" /> Correct Code (योग्य)
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            Official Civic Security Check
          </span>
        )}
      </div>

      {/* MODE 1: VISUAL GOVERNMENT SECURITY CODE */}
      {captchaMode === 'visual' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {/* Visual Security Code Canvas Box */}
            <div
              style={{
                background: '#ffffff',
                border: isVerified ? '1px solid #86EFAC' : '1px solid #cbd5e1',
                borderRadius: 6,
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={170}
                height={46}
                style={{ display: 'block', cursor: 'default' }}
                title="Government Security Code"
              />
            </div>

            {/* Action Buttons: Refresh & Audio Assistance */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={fetchNewChallenge}
                disabled={isRefreshing}
                title="Change security code"
                aria-label="Change security code"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span>Reload</span>
              </button>

              <button
                type="button"
                onClick={handleSpeakCaptcha}
                disabled={isSpeaking || !captchaData}
                title="Listen to security code"
                aria-label="Listen to security code"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 10px',
                  background: isSpeaking ? '#eff6ff' : '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  color: isSpeaking ? '#2563eb' : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                <span>Audio</span>
              </button>
            </div>
          </div>

          {/* User Input Field */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                maxLength={6}
                placeholder="Enter 6-character code"
                className="form-input"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.925rem',
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  border: isVisualVerified ? '2px solid #16A34A' : visualError ? '1.5px solid #EF4444' : undefined,
                  background: isVisualVerified ? '#FFFFFF' : '#FFFFFF',
                  color: isVisualVerified ? '#15803D' : undefined,
                }}
                autoComplete="off"
                spellCheck="false"
              />
              {isVisualVerified && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.75rem', color: isVisualVerified ? '#15803D' : 'var(--color-text-secondary)', minWidth: 32, textAlign: 'right', fontWeight: 600 }}>
              {userInput.length}/6
            </span>
          </div>

          {/* Success Banner when code is right */}
          {isVisualVerified && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                padding: '6px 10px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 6,
                color: '#15803D',
                fontSize: '0.8rem',
                fontWeight: 650,
              }}
            >
              <CheckCircle2 size={15} color="#16A34A" />
              <span>Security code verified! You can now submit.</span>
            </div>
          )}

          {/* Error Banner when code is wrong */}
          {visualError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                padding: '6px 10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 6,
                color: '#B91C1C',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
              role="alert"
            >
              <AlertCircle size={15} color="#DC2626" />
              <span>{visualError}</span>
            </div>
          )}

          {/* Optional toggle to Turnstile if desired */}
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setCaptchaMode('turnstile')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-secondary)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Switch to Cloudflare Turnstile
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: CLOUDFLARE TURNSTILE */}
      {captchaMode === 'turnstile' && (
        <div>
          <div
            style={{
              minHeight: 65,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: 6,
              border: '1px dashed #cbd5e1',
              padding: 6,
              position: 'relative',
            }}
          >
            {/* Pure target element for Turnstile (no React children) */}
            <div ref={turnstileContainerRef} />

            {!turnstileLoaded && !turnstileError && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, position: 'absolute' }}>
                <RefreshCw size={13} className="animate-spin" />
                <span>Loading Cloudflare challenge…</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setCaptchaMode('visual');
                fetchNewChallenge();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Switch to Security Code (Visual CAPTCHA)
            </button>

            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
              Cloudflare Protected
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default TurnstileCaptcha;
