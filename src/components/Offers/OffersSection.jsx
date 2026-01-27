import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHospital } from 'react-icons/fa';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsData, getOffersDataDirect } from '../../API/apiService';

function OffersSection() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBookingClick = useCallback(() => {
    navigate('/booking');
  }, [navigate]);

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
            const hasDiscount = service.discount && service.discount > 0;
            const discountPercentage = hasDiscount ? Math.round((service.discount / service.price) * 100) : 0;

            allOffers.push({
              id: service.id,
              service: service.title_ar || service.title || service.title_en || 'خدمة غير محددة',
              oldPrice: service.price.toString(),
              newPrice: hasDiscount ? (service.price - service.discount).toString() : service.price.toString(),
              discount: hasDiscount && discountPercentage > 0 ? `${discountPercentage}%` : null,
              clinicName: clinic.clinic_name || 'عيادة غير محددة',
              clinicId: clinic.id, // إضافة clinicId
              clinicImage: clinic.owner_photo,
              serviceTime: service.service_time,
              category: service.category_id,
              hasDiscount: hasDiscount && discountPercentage > 0 // لمعرفة إذا كان في خصم أم لا
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
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 place-items-center">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                style={{
                  height: '420px',
                  width: '320px',
                  maxWidth: '100%'
                }}
              >
                {/* الصورة */}
                <div className="relative w-full h-80 overflow-hidden bg-gray-100 rounded-t-xl">
                  {offer.clinicImage ? (
                    <>
                      {console.log('صورة العرض:', offer.clinicImage, 'للعيادة:', offer.clinicName)}
                      <img
                        src={offer.clinicImage}
                        alt={offer.clinicName}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.src = '/placeholder-clinic.jpg';
                        }}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <FaHospital className="text-blue-500 text-4xl" />
                    </div>
                  )}

                  {/* خصم - يظهر فقط لو في خصم حقيقي */}
                  {offer.discount && offer.discount !== '0%' && offer.hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
                      -{offer.discount}
                    </div>
                  )}

                  {/* زر التفاصيل الثابت */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => navigate(`/service/${offer.clinicId}/${offer.id}`)}
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
                  >
                    {offer.service}
                  </h3>

                  {/* اسم العيادة */}
                  <p
                    className="text-xs text-gray-600 mb-3"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    {offer.clinicName}
                  </p>

                  {/* الأسعار */}
                  <div className="flex items-center justify-center gap-2">
                    {/* السعر القديم المشطوب - يظهر فقط لو في خصم */}
                    {offer.hasDiscount && (
                      <span
                        className="text-red-500 line-through text-sm flex items-center gap-1"
                        style={{
                          fontFamily: 'Almarai',
                          fontWeight: 400
                        }}
                      >
                        {offer.oldPrice}
                        <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', fontSize: '0.8em', fontWeight: '600'}}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="15" height="15" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg></span>
                      </span>
                    )}

                    {/* السعر الحالي */}
                    <span
                      className={`font-bold text-lg flex items-center gap-1 ${
                        offer.hasDiscount ? 'text-green-600' : 'text-blue-600'
                      }`}
                      style={{
                        fontFamily: 'Almarai',
                        fontWeight: 700
                      }}
                    >
                      {offer.newPrice}
                      <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', fontSize: '0.9em', fontWeight: '600'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="15" height="15" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                      </span>
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

export default React.memo(OffersSection);