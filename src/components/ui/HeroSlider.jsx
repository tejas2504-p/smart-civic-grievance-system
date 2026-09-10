import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sliderImages = [
  {
    url: '/slider2.png',
    alt: 'Bharat Civic Connect - Aapli Takrar Aapli Jababdari',
  },
  {
    url: '/slider3.jpg',
    alt: 'Bharat Civic Connect - Sashakt Nagarik Sashakt Bharat',
  },
  {
    url: '/slider4.jpg',
    alt: 'Bharat Civic Connect - Quick Actions & Fast Resolution',
  },
  {
    url: '/slider1.jpg',
    alt: 'Bharat Civic Connect - Citizen Redressal Portal',
  }
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Start autoplay timer
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 5000); // 5 seconds per slide
  };

  // Stop autoplay timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (!isHovered) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [isHovered, currentIndex]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setDirection('prev');
    setCurrentIndex((prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setDirection('next');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
  };

  const handleDotClick = (index, e) => {
    e.stopPropagation();
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
  };

  const handleSlideClick = () => {
    navigate('/complaints/new');
  };

  // Interactive 3D mouse parallax tilt
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 5; // Max 5 deg tilt
    const tiltY = ((x - centerX) / centerX) * 7;  // Max 7 deg tilt
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleSlideClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 'clamp(240px, 45vw, 420px)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 20px 40px -10px rgba(9, 34, 62, 0.35), 0 0 20px rgba(255, 153, 51, 0.2)' 
          : '0 12px 28px rgba(0, 0, 0, 0.18)',
        background: '#ffffff',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isHovered 
          ? 'transform 0.1s ease-out, box-shadow 0.3s ease' 
          : 'transform 0.5s ease-out, box-shadow 0.3s ease',
      }}
      className="hero-slider-container"
      role="region"
      aria-label="Government Grievance Highlights Carousel"
    >
      {/* 3D Depth Backdrop Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(240,244,248,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 3D Carousel Slides */}
      {sliderImages.map((image, index) => {
        const isActive = index === currentIndex;
        const isPrev = (index === (currentIndex - 1 + sliderImages.length) % sliderImages.length);
        const isNext = (index === (currentIndex + 1) % sliderImages.length);

        let transformStyle = 'translate3d(0, 0, -200px) scale(0.8) rotateY(0deg)';
        let opacity = 0;
        let zIndex = 1;

        if (isActive) {
          transformStyle = 'translate3d(0, 0, 0) scale(1) rotateY(0deg)';
          opacity = 1;
          zIndex = 4;
        } else if (isPrev) {
          transformStyle = 'translate3d(-80px, 0, -120px) scale(0.88) rotateY(20deg)';
          opacity = 0;
          zIndex = 2;
        } else if (isNext) {
          transformStyle = 'translate3d(80px, 0, -120px) scale(0.88) rotateY(-20deg)';
          opacity = 0;
          zIndex = 2;
        }

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity,
              transform: transformStyle,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.55s ease',
              zIndex,
              pointerEvents: isActive ? 'auto' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              background: '#ffffff',
            }}
          >
            <img
              src={image.url}
              alt={image.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                filter: isActive ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' : 'none',
                transition: 'filter 0.5s ease',
              }}
            />
          </div>
        );
      })}

      {/* 3D Floating Slide Counter Badge */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 10,
          transform: 'translateZ(30px)',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, rgba(9, 34, 62, 0.9) 0%, rgba(18, 59, 99, 0.9) 100%)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 750,
            padding: '4px 10px',
            borderRadius: '16px',
            letterSpacing: '0.05em',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {String(currentIndex + 1).padStart(2, '0')} / {String(sliderImages.length).padStart(2, '0')}
        </span>
      </div>

      {/* 3D Interactive Left Navigation Arrow */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%) translateZ(35px)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(18, 59, 99, 0.15)',
          color: 'var(--color-primary)',
          borderRadius: '50%',
          width: 'clamp(34px, 8vw, 42px)',
          height: 'clamp(34px, 8vw, 42px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isHovered ? 1 : 0.85,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-50%) translateZ(45px) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.color = 'var(--color-primary)';
          e.currentTarget.style.transform = 'translateY(-50%) translateZ(35px) scale(1)';
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      {/* 3D Interactive Right Navigation Arrow */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%) translateZ(35px)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(18, 59, 99, 0.15)',
          color: 'var(--color-primary)',
          borderRadius: '50%',
          width: 'clamp(34px, 8vw, 42px)',
          height: 'clamp(34px, 8vw, 42px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isHovered ? 1 : 0.85,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-50%) translateZ(45px) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.color = 'var(--color-primary)';
          e.currentTarget.style.transform = 'translateY(-50%) translateZ(35px) scale(1)';
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={22} strokeWidth={2.5} />
      </button>

      {/* 3D Indicator Navigation Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%) translateZ(35px)',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(9, 34, 62, 0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
      >
        {sliderImages.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={index}
              onClick={(e) => handleDotClick(index, e)}
              style={{
                border: 'none',
                width: isActive ? '26px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: isActive ? '#FF9933' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
                boxShadow: isActive ? '0 0 8px rgba(255, 153, 51, 0.8)' : 'none',
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={isActive ? 'true' : 'false'}
            />
          );
        })}
      </div>

      <style>{`
        @media (max-width: 992px) {
          .hero-slider-container {
            min-height: 320px !important;
          }
        }
        @media (max-width: 600px) {
          .hero-slider-container {
            min-height: 220px !important;
          }
        }
      `}</style>
    </div>
  );
}
