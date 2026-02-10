import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinicsData } from '../../../API/apiService';

function ServicesSection() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-scroll functionality for mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loading || clinics.length === 0) return;

    // Check if it's mobile device
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    let scrollInterval;
    let isScrolling = false;
    let scrollDirection = 1; // 1 for right, -1 for left

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (isScrolling) return;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const currentScroll = container.scrollLeft;

        // Change direction when reaching ends
        if (currentScroll >= maxScrollLeft) {
          scrollDirection = -1;
        } else if (currentScroll <= 0) {
          scrollDirection = 1;
        }

        // Smooth scroll
        container.scrollBy({
          left: scrollDirection * 320, // width of one card + gap
          behavior: 'smooth'
        });
      }, 4000); // Auto-scroll every 4 seconds
    };

    // Stop auto-scroll when user interacts
    const stopAutoScroll = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };

    // Resume auto-scroll after user stops interacting
    const resumeAutoScroll = () => {
      stopAutoScroll();
      setTimeout(startAutoScroll, 2000); // Resume after 2 seconds
    };

    // Event listeners
    container.addEventListener('touchstart', () => {
      isScrolling = true;
      stopAutoScroll();
    });

    container.addEventListener('touchend', () => {
      isScrolling = false;
      resumeAutoScroll();
    });

    container.addEventListener('scroll', () => {
      isScrolling = true;
      stopAutoScroll();
      // Resume after scroll ends
      setTimeout(() => {
        isScrolling = false;
        resumeAutoScroll();
      }, 1000);
    });

    // Start auto-scroll
    startAutoScroll();

    // Cleanup
    return () => {
      stopAutoScroll();
      if (container) {
        container.removeEventListener('touchstart', stopAutoScroll);
        container.removeEventListener('touchend', resumeAutoScroll);
        container.removeEventListener('scroll', stopAutoScroll);
      }
    };
  }, [loading, clinics]);

  // دالة للتوجيه إلى صفحة العروض
  const handleClinicClick = (clinicId) => {
    navigate('/Category', { state: { clinicId } });
  };

  // جلب بيانات العيادات من API
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await getClinicsData();
        if (response.status === 'success' && response.data.data) {
          // فلترة العيادات التي تظهر في الصفحة الرئيسية
          const homePageClinics = response.data.data
            .filter(clinic => clinic.show_in_home_page === 1)
            .map(clinic => ({
              id: clinic.id,
              title: clinic.clinic_name,
              image: clinic.owner_photo || clinic.images?.[0]?.image || '/placeholder.png',
              alt: clinic.clinic_name
            }));

          setClinics(homePageClinics);
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات العيادات:', error);
        // البيانات الافتراضية في حالة الخطأ
        setClinics([
          {
            id: 1,
            title: 'ليزر النساء',
            image: '/1.png',
            alt: 'ليزر النساء'
          },
          {
            id: 2,
            title: 'ليزر الرجال',
            image: '/2.png',
            alt: 'ليزر الرجال'
          },
          {
            id: 3,
            title: 'عيادة الجلدية',
            image: '/3.png',
            alt: 'عيادة الجلدية'
          },
          {
            id: 4,
            title: 'عيادة الأسنان',
            image: '/Group 4.png',
            alt: 'عيادة الأسنان'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  return (
    <section className="relative w-full pt-8 md:pt-12 pb-12 md:pb-16" dir="rtl">
  {/* الخلفية فقط */}
  <div 
  className="absolute inset-x-0 -top-20 h-[500px] bg-gradient-to-r from-[#0171bd]/10 via-[#a6c80d]/20 to-[#a6c80d]/5 -z-10" 
/>

      <div className="container mx-auto px-4">
        {/* العنوان والعنوان الفرعي */}
        <div className="mb-8 md:mb-12 text-center md:text-right">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 700
            }}
          >
            عياداتنا
          </h2>
          <p 
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            حلول طبية وجمالية متكاملة لراحة مرضانا
          </p>
        </div>

        {/* البطاقات */}
        <div 
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-4 overflow-x-auto md:overflow-visible gap-4 sm:gap-6 md:gap-8 pb-3" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {loading ? (
            // Loading placeholders
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse flex-shrink-0 w-[300px] sm:w-[340px] md:w-full h-[520px]"
              >
                {/* Placeholder for image */}
                <div className="w-full h-[430px] bg-gray-200 rounded-t-xl"></div>

                {/* Placeholder for title */}
                <div className="p-4 sm:p-5 text-center h-[90px] flex items-center justify-center">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : (
            clinics.map((clinic) => (
              <div
                key={clinic.id}
                onClick={() => handleClinicClick(clinic.id)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex-shrink-0 w-[300px] sm:w-[340px] md:w-full h-[520px]"
              >
                {/* الصورة */}
                <div className="relative w-full h-[430px] overflow-hidden bg-gray-100 rounded-t-xl">
                  <img
                    src={clinic.image}
                    alt={clinic.alt}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.src = '/placeholder.png'; // Fallback image
                    }}
                  />
                </div>

                {/* العنوان */}
                <div className="p-5 sm:p-6 text-center h-[90px] flex items-center justify-center">
                  <h3
                    className="text-xl sm:text-2xl font-bold text-gray-900"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700
                    }}
                  >
                    {clinic.title}
                  </h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;

