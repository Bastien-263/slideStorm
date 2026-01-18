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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Version normale */}
      {!isExpanded && (
        <div 
          style={{ 
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            height: '600px',
            margin: '0 auto'
          }}
        >
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              padding: '12px 24px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)'
            }}
          >
            ⛶ Agrandir
          </button>

          <Swiper 
            spaceBetween={50} 
            slidesPerView={1}
            style={{ height: '100%', width: '100%' }}
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            onSlideChange={(swiper) => onSlideChange?.(swiper.activeIndex)}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={slide.id || index}>
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Version agrandie (overlay) */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            margin: 0
          }}
        >
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10000,
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✕ Fermer
          </button>

          <Swiper 
            spaceBetween={50} 
            slidesPerView={1}
            style={{ height: '100%', width: '100%' }}
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
                  padding: '40px'
                }}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    style={{
                      maxWidth: '95%',
                      maxHeight: '80vh',
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '20px',
                    maxWidth: '900px'
                  }}>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>
                      {slide.title}
                    </h2>
                    {slide.description && (
                      <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </>
  );
};

export default SlideCarousel;