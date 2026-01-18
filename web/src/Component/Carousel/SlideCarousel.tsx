import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useDisplayMode } from "skybridge/web"; // 👈 Import du hook
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
  const [displayMode, setDisplayMode] = useDisplayMode(); // 👈 Utilise le hook

  const isFullscreen = displayMode === 'fullscreen';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isFullscreen ? '100%' : '1200px',
        height: isFullscreen ? '100vh' : '600px',
        margin: '0 auto',
        backgroundColor: isFullscreen ? '#000' : 'transparent',
        padding: isFullscreen ? '20px' : '0'
      }}
    >
      {/* Bouton plein écran */}
      <button
        onClick={() => setDisplayMode(isFullscreen ? 'inline' : 'fullscreen')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '12px 24px',
          backgroundColor: isFullscreen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
      >
        {isFullscreen ? '✕ Fermer' : '⛶ Plein écran'}
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
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: isFullscreen ? '40px' : '20px'
              }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  maxWidth: '95%',
                  maxHeight: isFullscreen ? '75vh' : '500px',
                  objectFit: 'contain'
                }}
              />
              {isFullscreen && (
                <div
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '20px',
                    maxWidth: '900px'
                  }}
                >
                  <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>
                    {slide.title}
                  </h2>
                  {slide.description && (
                    <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
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