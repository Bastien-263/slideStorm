import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import des styles
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
  return (
    <div style={{ 
      width: '100%', 
      maxHeight: '80vh', 
      overflow: 'hidden' 
    }}>
      <span>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</span>
      <Swiper 
        spaceBetween={50} 
        slidesPerView={1}
        modules={[Navigation, Pagination]} // 👈 Active les modules
        navigation
        pagination={{ clickable: true }}
        onSlideChange={(swiper) => onSlideChange?.(swiper.activeIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id || index}>
            <div className="slide-content">
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
              />
              <h3>{slide.title}</h3>
              {slide.description && <p>{slide.description}</p>}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
    
  );
};

export default SlideCarousel;