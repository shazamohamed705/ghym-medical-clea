import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinicsServices } from '../../../API/apiService';

function OffersSection() {
  const navigate = useNavigate();

  // إضافة CSS لإخفاء scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [clinics, setClinics] = useState([]);

  // دالة للتوجيه إلى صفحة التفاصيل
  const handleServiceClick = (clinicId, serviceId) => {
    navigate(`/service/${clinicId}/${serviceId}`);
  };

  // دالة للتوجيه عند النقر على زر الحجز
  const handleBookingClick = (e, clinicId, serviceId) => {
    e.stopPropagation();
    navigate(`/service/${clinicId}/${serviceId}`);
  };

  // جلب البيانات من API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await getClinicsServices();

        if (response.status === 'success' && response.data.services) {
          setServices(response.data.services);

          // استخراج أسماء العيادات الفريدة
          const uniqueClinicNames = [...new Set(response.data.services.map(service => service.clinic?.clinic_name || `عيادة ${service.clinics_id}`))];
          setClinics(uniqueClinicNames);

          // تعيين الفلتر الافتراضي للعيادة الأولى
          if (uniqueClinicNames.length > 0) {
            setActiveFilter(uniqueClinicNames[0]);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب الخدمات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // تحديث الخدمات المفلترة عند تغيير الفلتر
  useEffect(() => {
    if (activeFilter === 'الكل') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => service.clinic?.clinic_name === activeFilter);
      setFilteredServices(filtered);
    }
  }, [activeFilter, services]);

  // إنشاء فلاتر ديناميكية بناءً على العيادات
  const filters = ['الكل', ...clinics];

  return (
    <section className="py-12 bg-white" dir="rtl">

      <div className="container mx-auto px-4">
        {/* عنوان القسم */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700
              }}
            >
              أحدث <span className="text-[#9bc115]">عروض</span> مجمع غيم الطبي
            </h2>
            <p
              className="text-gray-600 text-sm mt-2"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 400
              }}
            >
              خصومات مميزة على خدمات طبية مختارة لفترة محدودة
            </p>

            {/* الفلاتر */}
            <div className="flex flex-wrap gap-3 mt-6" dir="rtl">
              {loading ? (
                // عرض مؤشر تحميل للفلاتر
                <div className="flex gap-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="px-4 py-2 bg-gray-200 rounded-lg animate-pulse w-20 h-8"></div>
                  ))}
                </div>
              ) : (
                filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    activeFilter === filter
                      ? 'bg-[#9bc115] text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-[#9bc115] hover:text-white hover:border-[#9bc115]'
                  }`}
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 400
                  }}
                >
                  {filter}
                </button>
                ))
              )}
            </div>
          </div>
          <button
            className="text-xs sm:text-sm text-blue-500 border border-blue-200 px-2 sm:px-3 py-1 rounded whitespace-nowrap"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            تعرف على المزيد
          </button>
        </div>

        {/* الكروت */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
          {loading ? (
            // عرض مؤشر تحميل للكروت
            [...Array(5)].map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse flex-shrink-0 scroll-snap-align-start flex flex-col" style={{ width: '280px', height: '380px' }}>
                <div className="w-full h-48 bg-gray-200 flex-shrink-0"></div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.clinics_id, service.id)}
                className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 scroll-snap-align-start cursor-pointer flex flex-col"
                style={{ width: '280px', height: '360px' }}
              >
              {/* الصورة */}
                <div className="w-full h-48 overflow-hidden flex-shrink-0">
                  <img
                    src={service.images && service.images.length > 0 ? service.images[0].image : '/1.png'}
                    alt={service.title_ar || service.title}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.src = '/1.png'; // صورة افتراضية عند فشل التحميل
                    }}
                  />
              </div>

              {/* محتوى الكارت */}
                <div className="p-3 text-center flex-1 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                        className="text-gray-900 font-bold flex-1 text-right text-sm leading-tight"
                      style={{
                        fontFamily: 'Almarai',
                        fontWeight: 700,
                        minHeight: '40px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                        {service.title_ar || service.title}
                    </h3>
                    <span
                      className="text-gray-500 text-xs mt-1 mr-2 flex-shrink-0"
                      style={{
                        fontFamily: 'Almarai',
                        fontWeight: 400
                      }}
                    >
                        {service.service_time} دقيقة
                    </span>
                  </div>
                  <p
                      className="text-gray-700 text-xs mb-3 text-right leading-tight"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 500,
                      minHeight: '32px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                      {service.about_ar || service.about}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span
                      className="text-[#9bc115] font-bold text-sm"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700
                    }}
                  >
                      {service.price}
                    <svg className="inline w-4 h-4 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 12h8"/>
                      <path d="M8 9h8"/>
                    </svg>
                  </span>
                  <button
                      onClick={(e) => handleBookingClick(e, service.clinics_id, service.id)}
                      className="text-blue-500 border border-blue-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors font-bold"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700
                    }}
                  >
                    احجز الآن
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p
                className="text-gray-600 text-lg"
                style={{ fontFamily: 'Almarai' }}
              >
                لا توجد خدمات متاحة لهذه العيادة حالياً
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default OffersSection;
