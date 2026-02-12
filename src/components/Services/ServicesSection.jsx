import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUniqueSlug } from '../../utils/slugUtils';
import { addToLocalCart } from '../../utils/cartUtils';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import Pagination from '../Pagination/Pagination';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const servicesGridRef = useRef(null);

  // دالة للتوجيه إلى صفحة التفاصيل
  const handleServiceClick = (service) => {
    const slug = createUniqueSlug(service.title_ar || service.title, service.id);
    navigate(`/service/${slug}`);
  };

  // دالة لإضافة خدمة للسلة
  const handleAddToCart = async (e, service, imageElement) => {
    e.stopPropagation();

    const token = localStorage.getItem('authToken');

    setAddingToCart(prev => ({ ...prev, [service.id]: true }));

    try {
      // Create flying image animation
      if (imageElement) {
        const imageRect = imageElement.getBoundingClientRect();
        
        // Find cart icon in navbar
        const cartIcon = document.querySelector('[data-cart-icon]');
        const cartRect = cartIcon ? cartIcon.getBoundingClientRect() : { top: 0, left: window.innerWidth };

        // Create flying image clone
        const flyingImage = imageElement.cloneNode(true);
        flyingImage.style.position = 'fixed';
        flyingImage.style.top = `${imageRect.top}px`;
        flyingImage.style.left = `${imageRect.left}px`;
        flyingImage.style.width = `${imageRect.width}px`;
        flyingImage.style.height = `${imageRect.height}px`;
        flyingImage.style.zIndex = '10000';
        flyingImage.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImage.style.pointerEvents = 'none';
        flyingImage.style.borderRadius = '1rem';
        
        document.body.appendChild(flyingImage);

        // Trigger animation
        setTimeout(() => {
          flyingImage.style.top = `${cartRect.top}px`;
          flyingImage.style.left = `${cartRect.left}px`;
          flyingImage.style.width = '50px';
          flyingImage.style.height = '50px';
          flyingImage.style.opacity = '0.3';
        }, 50);

        // Remove flying image after animation
        setTimeout(() => {
          document.body.removeChild(flyingImage);
        }, 900);
      }

      // Get service image
      const serviceImage = service.images?.[0]?.image || service.image || '/1.png';

      // إذا لم يكن هناك token، احفظ في localStorage
      if (!token) {
        addToLocalCart({
          service_id: service.id,
          title_ar: service.title_ar || service.title || service.service,
          title: service.title,
          price: service.price,
          image: serviceImage,
          images: service.images,
          about_ar: service.about_ar
        });

        // Show custom cart success toast
        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: serviceImage,
            title: service.title_ar || service.title || service.service,
            price: service.price,
            id: service.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/login')
        });

        setAddingToCart(prev => ({ ...prev, [service.id]: false }));
        return;
      }

      // إضافة للسلة عبر API
      const cartData = {
        carts: [{ service_id: service.id }]
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

      if (response.ok && (result.status === true || result.status === 'success')) {
        // Show custom cart success toast
        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: serviceImage,
            title: service.title_ar || service.title || service.service,
            price: service.price,
            id: service.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/dashboard?filter=NewBooking')
        });
        
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        showError(result.message || 'حدث خطأ أثناء إضافة الخدمة للسلة');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setAddingToCart(prev => ({ ...prev, [service.id]: false }));
    }
  };

  useEffect(() => {
    document.title = 'خدماتنا الطبية - مجمع غيم الطبي';
  }, []);

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
                  onClick={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1); // Reset pagination when filter changes
                  }}
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
        {!loading && filteredServices.length > 0 && (() => {
          // حساب pagination
          const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentServices = filteredServices.slice(startIndex, endIndex);
          
          return (
            <>
              <div ref={servicesGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 place-items-center">
                {currentServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
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
                    ref={(el) => {
                      if (el) el.dataset.serviceId = service.id;
                    }}
                    src={service.images && service.images.length > 0 ? service.images[0].image : '/1.png'}
                    alt={service.title_ar || service.title}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = '/1.png';
                    }}
                  />

                  {/* أيقونة السلة */}
                  <button
                    onClick={(e) => {
                      const img = e.currentTarget.parentElement.querySelector('img');
                      handleAddToCart(e, service, img);
                    }}
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
                        const slug = createUniqueSlug(service.title_ar || service.title, service.id);
                        navigate(`/service/${slug}`);
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
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredServices.length}
            scrollToRef={servicesGridRef}
          />
        </>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default ServicesSection;