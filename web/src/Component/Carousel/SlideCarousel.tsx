import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useRef, useState, useEffect } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Slide {
  id: number;
  image: string;
  title: string;
  description?: string;
}

interface SlideCarouselProps {
  slides: Slide[];
  onSlideChange?: (index: number) => void;
}

const SlideCarousel = ({ slides, onSlideChange }: SlideCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fonction pour activer/désactiver le plein écran
  const toggleFullscreen = () => {
    if (!carouselRef.current) return;

    if (!document.fullscreenElement) {
      // Entrer en plein écran
      carouselRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Erreur plein écran:', err);
      });
    } else {
      // Sortir du plein écran
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Écouter les changements de plein écran (ex: touche ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={carouselRef}
      style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: isFullscreen ? '100%' : '1200px',
        height: isFullscreen ? '100vh' : '600px',
        margin: '0 auto',
        backgroundColor: isFullscreen ? '#000' : 'transparent',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Bouton plein écran */}
      <button
        onClick={toggleFullscreen}
        className="fullscreen-btn"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          backgroundColor: isFullscreen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isFullscreen ? '✕ Quitter le plein écran' : '⛶ Plein écran'}
      </button>

      <Swiper 
        spaceBetween={50} 
        slidesPerView={1}
        style={{ 
          height: '100%',
          width: '100%' 
        }}
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        onSlideChange={(swiper) => onSlideChange?.(swiper.activeIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id || index}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}>
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: isFullscreen ? '85vh' : '500px',
                  objectFit: 'contain'
                }}
              />
              {isFullscreen && (
                <div style={{
                  color: 'white',
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>
                    {slide.title}
                  </h2>
                  {slide.description && (
                    <p style={{ fontSize: '1.2rem', maxWidth: '800px' }}>
                      {slide.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SlideCarousel;