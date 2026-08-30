import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sliderImages = [
  { url: '/slider1.jpg', alt: 'Bharat Civic Connect - Register Complaint' },
  { url: '/slider2.png', alt: 'Bharat Civic Connect - Track Complaint' },
  { url: '/slider3.jpg', alt: 'Bharat Civic Connect - Sashakt Nagarik' },
  { url: '/slider4.jpg', alt: 'Bharat Civic Connect - Quick Actions' }
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
    }, 5000); // Change slide every 5 seconds
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
    e.stopPropagation(); // Avoid triggering click on slide container
    setCurrentIndex((prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length);
  };

  const handleNext = (e) => {
    e.stopPropagation(); // Avoid triggering click on slide container
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
  };

  const handleDotClick = (index, e) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleSlideClick = () => {
    // Navigate to register page on slide click
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
        height: '380px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        background: '#0d2d4e', // Deep Navy fallback
        cursor: 'pointer',
        userSelect: 'none'
      }}
      className="hero-slider-container"
    >
      {/* Slides */}
      {sliderImages.map((image, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none'
            }}
          >
            <img
              src={image.url}
              alt={image.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transition: 'transform 6s ease'
              }}
              // Add simple Ken Burns zoom effect on active slide
              className={isActive ? "scale-up" : ""}
            />
            {/* Subtle Vignette Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0.45) 100%)',
                zIndex: 2
              }}
            />
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.45)';
          e.target.style.transform = 'translateY(-50%) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
          e.target.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.45)';
          e.target.style.transform = 'translateY(-50%) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
          e.target.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicator Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)'
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
                background: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={isActive ? 'true' : 'false'}
            />
          );
        })}
      </div>

      {/* Add Custom styles for Scale-Up animation */}
      <style>{`
        .hero-slider-container img.scale-up {
          transform: scale(1.04);
        }
        @media (max-width: 768px) {
          .hero-slider-container {
            height: 240px !important;
          }
        }
      `}</style>
    </div>
  );
}
