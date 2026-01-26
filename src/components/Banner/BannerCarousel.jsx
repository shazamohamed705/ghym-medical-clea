import React, { useState, useEffect, useMemo } from 'react';

function BannerCarousel() {
  const banners = useMemo(() => [
    '/Property 1=banner 1 1.png',
    '/Property 1=banner 2.png',
    '/Property 1=banner 3.png',
    '/Property 1=Banner 4 1.png'
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="relative w-full overflow-hidden" dir="ltr">
      <div 
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ 
          width: `${banners.length * 100}%`,
          transform: `translateX(-${currentIndex * (100 / banners.length)}%)`
        }}
      >
        {banners.map((banner, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[420px]"
            style={{ width: `${100 / banners.length}%` }}
          >
            <img 
              src={banner} 
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default BannerCarousel;