import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.getElementById('main-content');
      const scrollTop = mainEl ? Math.max(window.scrollY, mainEl.scrollTop) : window.scrollY;
      const scrollHeight = mainEl ? Math.max(document.documentElement.scrollHeight, mainEl.scrollHeight) : document.documentElement.scrollHeight;
      const clientHeight = mainEl ? Math.min(window.innerHeight, mainEl.clientHeight) : window.innerHeight;
      
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollProgress(progress);

      if (scrollTop > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '28px',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        title="Back to Top"
        style={{
          position: 'relative',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #123B63 0%, #09223e 100%)',
          color: '#ffffff',
          border: '2px solid rgba(255, 153, 51, 0.8)', // Indian saffron accent border
          boxShadow: '0 6px 18px rgba(9, 34, 62, 0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
          padding: 0,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
          e.currentTarget.style.boxShadow = '0 10px 24px rgba(9, 34, 62, 0.45), 0 0 12px rgba(255, 153, 51, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(9, 34, 62, 0.35)';
        }}
      >
        {/* Circular Progress Ring indicator */}
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            transform: 'rotate(-90deg)',
            pointerEvents: 'none',
          }}
        >
          <circle
            cx="23"
            cy="23"
            r="20"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2.5"
          />
          <circle
            cx="23"
            cy="23"
            r="20"
            fill="transparent"
            stroke="#FF9933"
            strokeWidth="2.5"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 * (1 - scrollProgress / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>

        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
