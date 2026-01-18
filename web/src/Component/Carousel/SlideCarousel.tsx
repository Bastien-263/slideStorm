import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface Slide {
  id: number;
  image: string;
  title: string;
}

interface SlideCarouselProps {
  slides: Slide[];
  onSlideChange?: (index: number) => void;
}

const SlideCarousel = ({ slides }: SlideCarouselProps) => {

  return (
    <Swiper spaceBetween={50} slidesPerView={1}>
      {slides.map((slide, index) => (
        <SwiperSlide key={slide.id || index}>
          <img 
            src={slide.image} 
            alt={slide.title}
            style={{ 
              width: '100%', 
              height: 'auto',
              objectFit: 'contain' 
            }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SlideCarousel;