import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaHospital } from 'react-icons/fa';
import { createUniqueSlug } from '../../utils/slugUtils';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import Pagination from '../Pagination/Pagination';

function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const servicesGridRef = useRef(null);

  const searchQuery = searchParams.get('query');

  useEffect(() => {
    document.title = searchQuery ? `نتائج البحث: ${searchQuery} - مجمع غيم الطبي` : 'نتائج البحث - مجمع غيم الطبي';
  }, [searchQuery]);

  // وظيفة تمييز الكلمات المطابقة في النص
  const highlightSearchTerm = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fef3c7; padding: 1px 2px; border-radius: 2px;">$1</mark>');
  };

  const handleServiceClick = (service) => {
    const slug = createUniqueSlug(service.service, service.id);
    navigate(`/service/${slug}`);
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // البحث الأساسي من API
        const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/services?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        let apiResults = [];
        if (data.status === 'success' && data.data) {
          // التحقق من تنسيق البيانات المُرجعة
          if (Array.isArray(data.data)) {
            apiResults = data.data;
          } else if (data.data.services && Array.isArray(data.data.services)) {
            apiResults = data.data.services;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            apiResults = data.data.data;
          }
        }

        // البحث الموسع للحصول على نتائج أكثر
        const expandedResults = await expandSearchResults(searchQuery, apiResults);

        // تحويل البيانات للتنسيق المطلوب
        const formattedServices = expandedResults.map(service => {
          const discountPercentage = service.discount > 0 && service.price > 0
            ? Math.round((service.discount / service.price) * 100)
            : null;
          
          return {
            id: service.id,
            service: service.title_ar || service.title,
            oldPrice: service.price.toString(),
            newPrice: service.discount > 0 ?
              (service.price - service.discount).toString() :
              service.price.toString(),
            discount: discountPercentage ? `${discountPercentage}%` : null,
            image: service.images && service.images.length > 0 ?
              service.images[0].image :
              service.clinic?.owner_photo || '/placeholder.png',
            hasDiscount: Boolean(discountPercentage),
            about: service.about_ar || service.about,
            category: service.category,
            clinic: service.clinic,
            clinicId: service.clinic_id || service.clinics_id || service.clinic?.id
          };
        });

        setServices(formattedServices);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('حدث خطأ في البحث');
      } finally {
        setLoading(false);
      }
    };

    // وظيفة البحث الموسع
    const expandSearchResults = async (query, apiResults) => {
      try {
        // جلب جميع الخدمات للبحث المحلي
        const allServicesResponse = await fetch('https://ghaimcenter.com/laravel/api/clinics/services');
        const allServicesData = await allServicesResponse.json();
        
        if (allServicesData.status === 'success' && allServicesData.data?.services) {
          const allServices = allServicesData.data.services;
          const queryLower = query.toLowerCase().trim();
          
          // البحث الدقيق جداً - البحث عن النص الكامل فقط
          const exactMatches = allServices.filter(service => {
            const titleAr = (service.title_ar || '').toLowerCase();
            const titleEn = (service.title || '').toLowerCase();
            
            // البحث الدقيق في العنوان فقط
            return titleAr === queryLower || 
                   titleEn === queryLower ||
                   titleAr.includes(queryLower) ||
                   titleEn.includes(queryLower);
          });

          // إذا وُجدت نتائج دقيقة، ارجعها فقط
          if (exactMatches.length > 0) {
            return exactMatches.sort((a, b) => {
              const aTitle = (a.title_ar || a.title || '').toLowerCase();
              const bTitle = (b.title_ar || b.title || '').toLowerCase();
              
              // الأولوية للمطابقة التامة
              const aExactMatch = aTitle === queryLower || (a.title || '').toLowerCase() === queryLower;
              const bExactMatch = bTitle === queryLower || (b.title || '').toLowerCase() === queryLower;
              
              if (aExactMatch && !bExactMatch) return -1;
              if (!aExactMatch && bExactMatch) return 1;
              
              // ثم الأولوية للعناوين التي تحتوي على النص الكامل
              const aContains = aTitle.includes(queryLower);
              const bContains = bTitle.includes(queryLower);
              
              if (aContains && !bContains) return -1;
              if (!aContains && bContains) return 1;
              
              return 0;
            }).slice(0, 10); // حد أقصى 10 نتائج في صفحة البحث
          }

          // إذا لم توجد نتائج دقيقة، لا ترجع أي نتائج
          return [];
        }
        
        return apiResults;
      } catch (error) {
        console.error('خطأ في البحث الموسع:', error);
        return apiResults;
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

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
        {/* زر الرجوع */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#0171bd] hover:text-[#015a99] font-semibold text-lg transition-colors"
            style={{ fontFamily: 'Almarai' }}
          >
            ← العودة للرئيسية
          </Link>
        </div>

        {/* العنوان والعنوان الفرعي */}
        <div className="mb-8 md:mb-12 text-right">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 700
            }}
          >
            {searchQuery ? `نتائج البحث عن: "${searchQuery}"` : 'نتائج البحث'}
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            {loading ? 'جاري البحث...' : `تم العثور على ${services.length} نتيجة`}
          </p>
        </div>

        {/* حالة التحميل */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
            <span className="mr-3 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري البحث...</span>
          </div>
        )}

        {/* حالة الخطأ */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4" style={{ fontFamily: 'Almarai' }}>
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#0171bd] text-white rounded-lg hover:bg-[#015a99] transition-colors"
              style={{ fontFamily: 'Almarai' }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* حالة عدم وجود نتائج */}
        {!loading && !error && services.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4" style={{ fontFamily: 'Almarai' }}>
              لا توجد نتائج للبحث عن "{searchQuery}"
            </div>
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Almarai' }}>
              جرب البحث بكلمات مختلفة أو تصفح خدماتنا المتاحة
            </p>
          </div>
        )}

        {/* النتائج */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 place-items-center">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
                style={{
                  height: '480px',
                  width: '320px',
                  maxWidth: '100%'
                }}
                onClick={() => handleServiceClick(service)}
              >
                {/* الصورة */}
                <div className="relative w-full h-80 overflow-hidden bg-gray-100 rounded-t-xl">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.service}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <FaHospital className="text-blue-500 text-4xl" />
                    </div>
                  )}

                  {/* خصم - يظهر فقط لو في خصم حقيقي */}
                  {service.discount && service.hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
                      -{service.discount}
                    </div>
                  )}

                  {/* زر التفاصيل الثابت */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service);
                      }}
                      className="py-2 px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold text-sm hover:from-[#015a99] hover:to-[#013d73] shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300"
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
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(service.service, searchQuery)
                    }}
                  />

                  {/* اسم العيادة */}
                  {service.clinic && (
                    <p
                      className="text-xs text-blue-600 mb-1"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      {service.clinic.clinic_name}
                    </p>
                  )}

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
                  {service.about && (
                    <p
                      className="text-xs text-gray-600 mb-3 line-clamp-2"
                      style={{ fontFamily: 'Almarai' }}
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(
                          service.about.length > 80 ? `${service.about.substring(0, 80)}...` : service.about,
                          searchQuery
                        )
                      }}
                    />
                  )}

                  {/* الأسعار */}
                  <div className="flex items-center justify-center gap-2">
                    {/* السعر القديم المشطوب - يظهر فقط لو في خصم وسعر أكبر من 0 */}
                    {service.hasDiscount && Number(service.oldPrice) > 0 && (
                      <span
                        className="text-red-500 line-through text-sm flex items-center gap-1"
                        style={{
                          fontFamily: 'Almarai',
                          fontWeight: 400
                        }}
                      >
                        {service.oldPrice}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="10" height="11" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                      </span>
                    )}

                    {/* السعر الحالي - يظهر فقط لو أكبر من 0 */}
                    {Number(service.newPrice) > 0 && (
                      <span
                        className={`font-bold text-lg flex items-center gap-1 ${
                          service.hasDiscount ? 'text-green-600' : 'text-blue-600'
                        }`}
                        style={{
                          fontFamily: 'Almarai',
                          fontWeight: 700
                        }}
                      >
                        {service.newPrice}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="12" height="13" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* اقتراحات إضافية إذا لم توجد نتائج */}
        {!loading && !error && services.length === 0 && searchQuery && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Almarai' }}>
              جرب البحث عن:
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {['بوتوكس', 'فيلر', 'تنظيف أسنان', 'تبييض', 'ليزر'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => navigate(`/search?query=${encodeURIComponent(suggestion)}`)}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                  style={{ fontFamily: 'Almarai' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
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

export default SearchResults;