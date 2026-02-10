import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHospital } from 'react-icons/fa';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsData, getOffersDataDirect } from '../../API/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastManager';

function OffersSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  // وظيفة للحصول على أفضل صورة متاحة للخدمة
  const getServiceImage = useCallback((offer) => {
    // أولوية لصور الخدمة
    if (offer.serviceImages && offer.serviceImages.length > 0) {
      const firstImage = offer.serviceImages[0];
      if (firstImage && firstImage.image) {
        return firstImage.image;
      }
    }
    
    // إذا لم توجد صورة خدمة، استخدم صورة العيادة كبديل
    if (offer.clinicImage) {
      return offer.clinicImage;
    }
    
    // لا توجد صورة متاحة
    return null;
  }, []);

  // استخراج العروض من بيانات API - مع memoization
  const extractOffersFromData = useCallback((clinicsData) => {
    const allOffers = [];

    // التأكد من أن البيانات مصفوفة
    const dataArray = Array.isArray(clinicsData) ? clinicsData :
                     (clinicsData && Array.isArray(clinicsData.data)) ? clinicsData.data :
                     (clinicsData && clinicsData.data && Array.isArray(clinicsData.data.data)) ? clinicsData.data.data :
                     [];

    console.log('API Response structure:', clinicsData);
    console.log('Data array:', dataArray);

    if (!Array.isArray(dataArray)) {
      console.error('Expected array but got:', typeof dataArray, dataArray);
      return allOffers;
    }

    dataArray.forEach(clinic => {
      if (clinic && clinic.services && Array.isArray(clinic.services) && clinic.services.length > 0) {
        clinic.services.forEach(service => {
          // عرض جميع الخدمات النشطة كعروض
          if (service && service.status === 1 && service.price > 0) {
            const discountPercentage = service.discount > 0 && service.price > 0
              ? Math.round((service.discount / service.price) * 100)
              : null;

            allOffers.push({
              id: service.id,
              service: service.title_ar || service.title || service.title_en || 'خدمة غير محددة',
              oldPrice: service.price.toString(),
              newPrice: service.discount > 0 ? (service.price - service.discount).toString() : service.price.toString(),
              discount: discountPercentage ? `${discountPercentage}%` : null,
              clinicName: clinic.clinic_name || 'عيادة غير محددة',
              clinicId: clinic.id, // إضافة clinicId
              serviceImages: service.images || [], // صور الخدمة
              clinicImage: clinic.owner_photo, // صورة العيادة كبديل
              serviceTime: service.service_time,
              category: service.category_id,
              hasDiscount: Boolean(discountPercentage), // لمعرفة إذا كان في خصم أم لا
              updated_at: service.updated_at,
              created_at: service.created_at
            });
          }
        });
      }
    });

    return allOffers;
  }, []);

  // Memoized offers count for performance
  const offersCount = useMemo(() => offers.length, [offers.length]);

  // Memoized loading states
  const shouldShowLoading = useMemo(() => loading, [loading]);
  const shouldShowError = useMemo(() => error && !loading, [error, loading]);
  const shouldShowNoOffers = useMemo(() => !loading && !error && offersCount === 0, [loading, error, offersCount]);
  const shouldShowOffers = useMemo(() => !loading && !error && offersCount > 0, [loading, error, offersCount]);

  // دالة لإضافة خدمة للسلة
  const handleAddToCart = async (e, offer) => {
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

    setAddingToCart(prev => ({ ...prev, [offer.id]: true }));

    try {
      // إضافة للسلة بدون staff_id (اختياري)
      const cartData = {
        service_id: offer.id
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
      setAddingToCart(prev => ({ ...prev, [offer.id]: false }));
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);

        // جلب البيانات من {{baseUrl}}/offers
        console.log('جاري جلب البيانات من {{baseUrl}}/offers...');
        const offersData = await getOffersDataDirect();

        // طباعة البيانات المسترجعة
        console.log('البيانات المسترجعة من {{baseUrl}}/offers:', offersData);

        // إذا لم تكن هناك بيانات في offers، استخدم getClinicsData كبديل
        let dataToProcess = offersData;
        if (!offersData || !offersData.data || offersData.data.length === 0) {
          console.log('لا توجد بيانات في {{baseUrl}}/offers، جاري جلب البيانات من العيادات...');
          dataToProcess = await getClinicsData();
        }

        const extractedOffers = extractOffersFromData(dataToProcess);
        setOffers(extractedOffers);
        setError(null);

        console.log('العروض المستخرجة:', extractedOffers);

      } catch (err) {
        setError('حدث خطأ في تحميل العروض');
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [extractOffersFromData]);

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
            عروضنا
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            استمتع بأفضل العروض والتخفيضات على خدماتنا الطبية والتجميلية
          </p>
        </div>

        {/* حالة التحميل */}
        {shouldShowLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
            <span className="mr-3 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل العروض...</span>
          </div>
        )}

        {/* حالة الخطأ */}
        {shouldShowError && (
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

        {/* حالة عدم وجود عروض */}
        {shouldShowNoOffers && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
              لا توجد عروض متاحة حالياً
            </div>
          </div>
        )}

        {/* الكروت */}
        {shouldShowOffers && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group w-full"
                style={{
                  minHeight: '400px',
                  maxWidth: '100%'
                }}
              >
                {/* الصورة */}
                <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden bg-gray-100 rounded-t-xl">
                  {(() => {
                    const displayImage = getServiceImage(offer);
                    
                    if (displayImage) {
                      return (
                        <img
                          src={displayImage}
                          alt={offer.service}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <FaHospital className="text-blue-500 text-4xl" />
                        </div>
                      );
                    }
                  })()}

                  {/* خصم - يظهر فقط لو في خصم حقيقي */}
                  {offer.discount && offer.hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
                      -{offer.discount}
                    </div>
                  )}

                  {/* أيقونة السلة */}
                  <button
                    onClick={(e) => handleAddToCart(e, offer)}
                    disabled={addingToCart[offer.id]}
                    className="absolute top-3 left-3 w-10 h-10 bg-white hover:bg-blue-50 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-20"
                    title="أضف للسلة"
                  >
                    {addingToCart[offer.id] ? (
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
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => navigate(`/service/${offer.clinicId}/${offer.id}`)}
                      className="py-1.5 px-3 sm:py-2 sm:px-4 md:py-2 md:px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold text-xs sm:text-sm hover:from-[#015a99] hover:to-[#013d73] shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>

                {/* المعلومات */}
                <div className="p-3 sm:p-4 text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2"
                      style={{
                        fontFamily: 'Almarai',
                        fontWeight: 700,
                        lineHeight: '1.3',
                        minHeight: '2.6em'
                      }}
                    >
                      {offer.service}
                    </h3>

                    {/* اسم العيادة */}
                    <p
                      className="text-xs sm:text-sm text-blue-600 mb-2 truncate"
                      style={{ fontFamily: 'Almarai' }}
                      title={offer.clinicName}
                    >
                      {offer.clinicName}
                    </p>
                  </div>

                  {/* الأسعار */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mt-auto">
                    {/* السعر القديم المشطوب - يظهر فقط لو في خصم وسعر أكبر من 0 */}
                    {offer.hasDiscount && Number(offer.oldPrice) > 0 && (
                      <span
                        className="text-red-500 line-through text-xs sm:text-sm flex items-center gap-1"
                        style={{
                          fontFamily: 'Almarai',
                          fontWeight: 400
                        }}
                      >
                        {offer.oldPrice}
                        <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px', fontSize: '0.7em', fontWeight: '600'}}> 
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="10" height="10" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                            <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                            <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                          </svg>
                        </span>
                      </span>
                    )}

                    {/* السعر الحالي - يظهر فقط لو أكبر من 0 */}
                    {Number(offer.newPrice) > 0 && (
                      <span
                        className={`font-bold text-sm sm:text-base md:text-lg flex items-center gap-1 ${
                          offer.hasDiscount ? 'text-green-600' : 'text-blue-600'
                        }`}
                        style={{
                          fontFamily: 'Almarai',
                          fontWeight: 700
                        }}
                      >
                        {offer.newPrice}
                        <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px', fontSize: '0.8em', fontWeight: '600'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="12" height="12" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                            <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                            <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                          </svg>
                        </span>
                      </span>
                    )}
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

export default React.memo(OffersSection);