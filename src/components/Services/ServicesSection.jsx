import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsServices } from '../../API/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastManager';

function ServicesSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [clinics, setClinics] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});

  // دالة للتوجيه إلى صفحة التفاصيل
  const handleServiceClick = (clinicId, serviceId) => {
    navigate(`/service/${clinicId}/${serviceId}`);
  };

  // دالة لإضافة خدمة للسلة
  const handleAddToCart = async (e, service) => {
    e.stopPropagation();
    
    if (!isAuthenticated()) {
      showError('يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [service.id]: true }));

    try {
      // إضافة للسلة بدون staff_id (اختياري)
      const cartData = {
        service_id: service.id
      };

      const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cartData)
      });

      const result = await response.json();
      console.log('🛒 Add to cart response:', result);
      console.log('🛒 Response status:', result.status, 'Type:', typeof result.status);

      if (response.ok && (result.status === true || result.status === 'success')) {
        console.log('✅ Calling showSuccess');
        showSuccess('تم إضافة الخدمة للسلة بنجاح');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        console.log('❌ Calling showError');
        showError(result.message || 'حدث خطأ أثناء إضافة الخدمة للسلة');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setAddingToCart(prev => ({ ...prev, [service.id]: false }));
    }
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

          // تعيين الفلتر الافتراضي لعرض كل الخدمات
          setActiveFilter('الكل');
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
    <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      {/* Banner Section */}
      <section className="w-full">
        <BannerCarousel />
      </section>

      <div className="container mx-auto px-4 pt-8 md:pt-12 pb-12 md:pb-16" dir="rtl">
        {/* العنوان والعنوان الفرعي */}
        <div className="mb-8 md:mb-12 text-right">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 700
            }}
          >
            خدماتنا الطبية
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            تصفح جميع الخدمات الطبية والتجميلية المتاحة في مجمع غيم الطبي
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

        {/* حالة التحميل */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9bc115]"></div>
            <span className="mr-3 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل الخدمات...</span>
          </div>
        )}

        {/* حالة عدم وجود خدمات */}
        {!loading && filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
              لا توجد خدمات متاحة لهذه العيادة حالياً
            </div>
          </div>
        )}

        {/* الكروت */}
        {!loading && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 place-items-center">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.clinics_id, service.id)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
                style={{
                  height: '480px',
                  width: '320px',
                  maxWidth: '100%'
                }}
              >
                {/* الصورة */}
                <div className="relative w-full h-80 overflow-hidden bg-gray-100 rounded-t-xl">
                  <img
                    src={service.images && service.images.length > 0 ? service.images[0].image : '/1.png'}
                    alt={service.title_ar || service.title}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = '/1.png';
                    }}
                  />

                  {/* أيقونة السلة */}
                  <button
                    onClick={(e) => handleAddToCart(e, service)}
                    disabled={addingToCart[service.id]}
                    className="absolute top-3 left-3 w-10 h-10 bg-white hover:bg-blue-50 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-20"
                    title="أضف للسلة"
                  >
                    {addingToCart[service.id] ? (
                      <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </button>

                  {/* زر التفاصيل الثابت */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/service/${service.clinics_id}/${service.id}`);
                      }}
                      className="py-2 px-6 bg-gradient-to-r from-[#9bc115] to-[#7a9c0f] text-white rounded-lg font-bold text-sm hover:from-[#7a9c0f] hover:to-[#5d7a0b] shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>

                {/* المعلومات */}
                <div className="p-4 text-center">
                  <h3
                    className="text-sm sm:text-base font-bold text-gray-900 mb-2"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700
                    }}
                  >
                    {service.title_ar || service.title}
                  </h3>

                  {/* اسم العيادة */}
                  <p
                    className="text-xs text-blue-600 mb-1"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    {service.clinic?.clinic_name || `عيادة ${service.clinics_id}`}
                  </p>

                  {/* اسم الكاتيجوري */}
                  {service.category && (
                    <p
                      className="text-xs text-green-600 mb-2"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      {service.category.title_ar || service.category.title}
                    </p>
                  )}

                  {/* وصف الخدمة */}
                  {service.about_ar && (
                    <p
                      className="text-xs text-gray-600 mb-3 line-clamp-2"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      {service.about_ar.length > 80 ? `${service.about_ar.substring(0, 80)}...` : service.about_ar}
                    </p>
                  )}

                  {/* السعر */}
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="font-bold text-lg flex items-center gap-1 text-[#9bc115]"
                      style={{
                        fontFamily: 'Almarai',
                        fontWeight: 700
                      }}
                    >
                      {service.price}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="15" height="15" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                        <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                        <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default ServicesSection;