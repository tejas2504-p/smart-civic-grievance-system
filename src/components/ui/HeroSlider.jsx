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
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Start autoplay timer
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
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
    setCurrentIndex((prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
  };

  const handleDotClick = (index, e) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleSlideClick = () => {
    navigate('/complaints/new');
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSlideClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '420px',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        background: '#ffffff',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="hero-slider-container"
      role="region"
      aria-label="Government Grievance Highlights Carousel"
    >
      {/* Slides */}
      {sliderImages.map((image, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? 'auto' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
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
              }}
            />
          </div>
        );
      })}

      {/* Slide Counter Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}
      >
        <span
          style={{
            background: 'rgba(18, 59, 99, 0.85)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '16px',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {String(currentIndex + 1).padStart(2, '0')} / {String(sliderImages.length).padStart(2, '0')}
        </span>
      </div>

      {/* Left Navigation Arrow */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
          transition: 'all 0.2s ease',
          opacity: isHovered ? 1 : 0.75,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.92)';
          e.currentTarget.style.color = 'var(--color-primary)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
          transition: 'all 0.2s ease',
          opacity: isHovered ? 1 : 0.75,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.92)';
          e.currentTarget.style.color = 'var(--color-primary)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={22} />
      </button>

      {/* Indicator Navigation Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          padding: '5px 12px',
          borderRadius: '20px',
          background: 'rgba(18, 59, 99, 0.75)',
          backdropFilter: 'blur(6px)',
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
                width: isActive ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: isActive ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.65)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                padding: 0,
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
