import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * Production-Ready Cloudflare Turnstile CAPTCHA Component
 * Uses official Cloudflare Turnstile JavaScript API.
 * Default sitekey uses Cloudflare's official testing sitekey (1x00000000000000000000AA) in development.
 */
export const TurnstileCaptcha = forwardRef(function TurnstileCaptcha(
  { onVerify, onExpire, onError, theme = 'light' },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [token, setToken] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const siteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    '1x00000000000000000000AA'; // Official Cloudflare Always-Pass Test Key

  // Render widget once script is loaded
  const renderWidget = () => {
    if (!window.turnstile || !containerRef.current) return;

    // Reset existing widget if rendered
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: theme,
        callback: (newToken) => {
          setToken(newToken);
          setIsVerified(true);
          if (onVerify) onVerify(newToken);
        },
        'expired-callback': () => {
          setToken('');
          setIsVerified(false);
          if (onExpire) onExpire();
        },
        'error-callback': (errCode) => {
          setToken('');
          setIsVerified(false);
          if (onError) onError(errCode);
        },
      });
      widgetIdRef.current = widgetId;
      setIsLoaded(true);
    } catch (err) {
      console.warn('Turnstile render warning:', err.message);
    }
  };

  useEffect(() => {
    // 1. If script already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // 2. Load script dynamically
    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(renderWidget, 100);
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setTimeout(renderWidget, 100));
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, theme]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getToken: () => token,
    reset: () => {
      setToken('');
      setIsVerified(false);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    },
    isVerified: () => !!token,
  }));

  return (
    <div style={{ margin: '14px 0', padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 650, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={16} color="var(--color-primary)" />
          <span>Human Verification (Security Check)</span>
          <span className="required" aria-hidden="true">*</span>
        </span>

        {isVerified ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
            <CheckCircle2 size={13} /> Verified
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            Protected by Cloudflare
          </span>
        )}
      </div>

      {/* Cloudflare Turnstile Widget Target */}
      <div
        ref={containerRef}
        style={{
          minHeight: 65,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: 6,
          border: '1px dashed #cbd5e1',
          padding: 6,
        }}
      >
        {!isLoaded && (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} className="animate-spin" />
            <span>Loading security challenge…</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default TurnstileCaptcha;
