import "@/index.css";

import { mountWidget } from "skybridge/web";

import SlideCarousel from "../Component/Carousel/SlideCarousel";

function CarouselTest() {

  const presentationData = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=675&fit=crop",
        title: "Welcome to Our Presentation",
        description: "This is the introduction slide. Here you can provide an overview of what will be covered in this presentation. The carousel allows you to navigate through different slides easily."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=675&fit=crop",
        title: "Our Team",
        description: "Meet our talented team of professionals. We bring together diverse skills and experiences to deliver exceptional results. Collaboration and innovation are at the heart of everything we do."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop",
        title: "Key Insights",
        description: "Here are the main takeaways from our analysis. These insights drive our strategy and help us make informed decisions. Data-driven approaches lead to better outcomes."
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop",
        title: "Next Steps",
        description: "Moving forward, we will focus on implementing these strategies. Our roadmap is designed to achieve our goals efficiently while maintaining flexibility for adjustments."
    }
    ];

  return (
    <div className="bg-background py-12 px-4" style={{ minHeight: '600px', maxHeight: '80vh' }}>
        <SlideCarousel slides={presentationData}></SlideCarousel>
    </div>
    
  );
}

export default CarouselTest;
mountWidget(<CarouselTest />);
