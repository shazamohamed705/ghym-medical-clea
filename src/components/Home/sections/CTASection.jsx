import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClinicsData } from '../../../API/apiService';

function CTASection() {
  const [doctorImages, setDoctorImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  const [doctorTitle, setDoctorTitle] = useState('');
  const [doctorDescription, setDoctorDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const data = await getClinicsData();
        if (data.status === 'success' && data.data?.home_page_setting?.doctors) {
          const doctorsData = JSON.parse(data.data.home_page_setting.doctors);
          if (doctorsData.images && doctorsData.images.length > 0) {
            setDoctorImages(doctorsData.images);
          }
          if (doctorsData.words && doctorsData.words.length > 0) {
            const firstWord = doctorsData.words[0];
            setDoctorTitle(firstWord.title_ar);
            setDoctorDescription(firstWord.description_ar);
          }
          setBaseUrl(data.data.url_before_image || '');
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الدكتور:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  // تأثير تغيير الصور تلقائياً زي البنر
  useEffect(() => {
    if (doctorImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % doctorImages.length);
      }, 4000); // تغيير كل 4 ثواني

      return () => clearInterval(interval);
    }
  }, [doctorImages.length]);

  if (isLoading) {
    return (
      <section className="relative w-full pt-20 md:pt-24 pb-12 md:pb-16" dir="rtl">
        <div className="container mx-auto px-4 relative min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd] mx-auto"></div>
            <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري التحميل...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
<section className="relative w-full pt-20 md:pt-24 pb-12 md:pb-16 overflow-hidden" dir="rtl">
  {/* الخلفية */}
  <div className="absolute inset-x-0 top-16 h-[350px] bg-gradient-to-r from-[#0171bd]/10 via-[#a6c80d]/20 to-[#a6c80d]/5 -z-10" />

      <div className="container mx-auto px-4 relative min-h-[400px]">
        {/* الصورة كخلفية للموبايل */}
        {doctorImages.length > 0 && (
          <div className="block md:hidden absolute inset-0 opacity-15">
            <img
              src={baseUrl + doctorImages[currentImageIndex]}
              alt="دكتور"
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
          </div>
        )}

        {/* النص */}
        <div className="absolute right-20 top-8 z-20 text-right max-w-md">
          {doctorTitle && (
            <h2
              className="text-2xl md:text-3xl mb-4 text-gray-900"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700
              }}
            >
              {doctorTitle}
            </h2>
          )}
          {doctorDescription && (
            <p
              className="text-base md:text-3xl mb-6 text-gray-600 leading-relaxed"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 400,
                fontSize: '19px',
                lineHeight: '27px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}
            >
              {doctorDescription}
            </p>
          )}
          <Link
            to="/booking"
            className="inline-block px-8 py-3 bg-white text-[#0171bd] border-2 border-[#0171bd] rounded-lg font-semibold hover:bg-[#0171bd] hover:text-white transition-colors shadow-md"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            احجز استشارتك الآن
          </Link>
        </div>

        {/* الصور للديسكتوب مع تأثير الـ carousel */}
        {doctorImages.length > 0 && (
          <div
            className="
              absolute
              hidden md:block
              right-4 md:right-[420px] lg:right-[750px]
              top-1/2
              -translate-y-1/2
              z-10
            "
          >
            <div className="relative">
              {doctorImages.map((image, index) => (
                <img
                  key={index}
                  src={baseUrl + image}
                  alt={`دكتور ${index + 1}`}
                  className={`
                    w-[220px]
                    sm:w-[260px]
                    md:w-[320px]
                    lg:w-[450px]
                    rounded-lg
                    transition-opacity duration-1000 ease-in-out
                    ${index === currentImageIndex ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'}
                  `}
                  style={{
                    transform: 'translateY(-100px)'
                  }}
                />
              ))}

              {/* النقاط المؤشرة على الصورة */}
              {doctorImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
                  {doctorImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`عرض الصورة ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>


          </div>
        )}
      </div>
</section>
  );
}

export default CTASection;