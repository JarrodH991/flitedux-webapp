import React, { useState, useEffect, useCallback } from 'react';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  autoPlayInterval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  const totalSlides = images.length;

  // --- Navigation ---

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === totalSlides - 1 ? 0 : prevIndex + 1));
  }, [totalSlides]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalSlides - 1 : prevIndex - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // --- Auto-play ---

  useEffect(() => {
    if (totalSlides <= 1) return;
    const slideInterval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(slideInterval);
  }, [goToNext, autoPlayInterval, totalSlides]);

  if (!images || totalSlides === 0) {
    return <div>No images to display</div>;
  }

  // --- Styles (Updated to be edge-to-edge and fully transparent) ---

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '420px', // Adjusted height for a more immersive widescreen view
    overflow: 'hidden',
    borderRadius: '16px',
    backgroundColor: 'transparent',
  };

  const slideStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundImage: `url(${images[currentIndex]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'background-image 0.5s ease-in-out',
  };

  const indicatorContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '25px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    zIndex: 10,
  };

  const indicatorStyle = (isActive: boolean): React.CSSProperties => ({
    width: '60px',
    height: '5px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  });

  const hitBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: '80px',
    width: '50%',
    cursor: 'pointer',
    zIndex: 5,
  };

  const shadowOverlayStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    background: side === 'left' 
      ? 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' 
      : 'linear-gradient(to left, rgba(0,0,0,0.4), transparent)',
    opacity: hoverSide === side ? 1 : 0,
  });

  return (
    <div style={containerStyle}>
      {/* The Image Slide */}
      <div style={slideStyle} />

      {/* Left Hover Area & Shadow */}
      <div 
        style={{ ...hitBoxStyle, left: 0 }}
        onMouseEnter={() => setHoverSide('left')}
        onMouseLeave={() => setHoverSide(null)}
        onClick={goToPrevious}
      >
        <div style={shadowOverlayStyle('left')} />
      </div>

      {/* Right Hover Area & Shadow */}
      <div 
        style={{ ...hitBoxStyle, right: 0 }}
        onMouseEnter={() => setHoverSide('right')}
        onMouseLeave={() => setHoverSide(null)}
        onClick={goToNext}
      >
        <div style={shadowOverlayStyle('right')} />
      </div>

      {/* Line Indicators: ____ */}
      <div style={indicatorContainerStyle}>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={indicatorStyle(index === currentIndex)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};