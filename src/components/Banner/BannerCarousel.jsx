import React, { useState, useEffect } from 'react';
import { getBannersData } from '../../API/apiService';

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await getBannersData();
        
        if (response.status && response.data && Array.isArray(response.data)) {
          setBanners(response.data);
        } else {
          console.error('Invalid banners data structure:', response);
          setError('فشل في تحميل البنرات');
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        setError('فشل في تحميل البنرات');
        // Fallback to static banners if API fails
        setBanners([
          { id: 1, image: '/Property 1=banner 1 1.png' },
          { id: 2, image: '/Property 1=banner 2.png' },
          { id: 3, image: '/Property 1=banner 3.png' },
          { id: 4, image: '/Property 1=Banner 4 1.png' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (loading) {
    return (
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[750px] lg:h-[800px] xl:h-[850px] bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-500 font-['Almarai']">جاري تحميل البنرات...</div>
      </div>
    );
  }

  if (error && banners.length === 0) {
    return (
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[750px] lg:h-[800px] xl:h-[850px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 font-['Almarai'] text-center">
          <p>{error}</p>
          <p className="text-sm mt-2">يرجى المحاولة مرة أخرى لاحقاً</p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

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
            key={banner.id || index} 
            className="flex-shrink-0 h-[250px] sm:h-[350px] md:h-[650px] lg:h-[700px] xl:h-[750px]"
            style={{ width: `${100 / banners.length}%` }}
          >
            <img 
              src={banner.image} 
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                console.error('Error loading banner image:', banner.image);
                e.target.style.display = 'none';
              }}
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