import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsServices, getClinicsCategories } from '../../API/apiService';

function Category() {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [clinic, setClinic] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clinicId = location.state?.clinicId;
  const categoryId = location.state?.categoryId;

  const handleBookingClick = (serviceId, serviceClinicId) => {
    navigate(`/service/${serviceClinicId || clinicId}/${serviceId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب الكاتيجوري والخدمات معاً
        const [servicesResponse, categoriesResponse] = await Promise.all([
          getClinicsServices(),
          getClinicsCategories()
        ]);

        if (servicesResponse.status === 'success' && servicesResponse.data && servicesResponse.data.services) {
          const allServices = servicesResponse.data.services;

          // إذا كان لدينا categoryId، نعرض خدمات هذه الكاتيجوري فقط
          let filteredServices = allServices;
          let selectedCategory = null;

          if (categoryId) {
            // فلترة الخدمات حسب categoryId
            filteredServices = allServices.filter(service =>
              service.category_id === categoryId
            );
            // العثور على الكاتيجوري المحددة
            if (categoriesResponse.status === 'success' && categoriesResponse.data) {
              selectedCategory = categoriesResponse.data.find(cat => cat.id === categoryId);
            }
          } else if (clinicId) {
            // فلترة الخدمات حسب clinicId (المنطق القديم)
            filteredServices = allServices.filter(service =>
              service.clinics_id === clinicId
            );
          }

          // تحويل البيانات للتنسيق المطلوب
          const formattedServices = filteredServices.map(service => {
            const hasDiscount = service.discount && service.discount > 0;
            const discountPercentage = hasDiscount ? Math.round((service.discount / service.price) * 100) : 0;
            
            return {
              id: service.id,
              service: service.title_ar || service.title,
              oldPrice: service.price.toString(),
              newPrice: hasDiscount ?
                (service.price - service.discount).toString() :
                service.price.toString(),
              discount: hasDiscount && discountPercentage > 0 ?
                `${discountPercentage}%` : null,
              image: service.images && service.images.length > 0 ?
                service.images[0].image :
                service.clinic?.owner_photo || '/placeholder.png',
              hasDiscount: hasDiscount && discountPercentage > 0,
              about: service.about_ar || service.about,
              category: service.category,
              clinic: service.clinic
            };
          });

          setServices(formattedServices);

          // تعيين العيادة أو الكاتيجوري المحددة
          if (selectedCategory) {
            setClinic({ ...selectedCategory, isCategory: true });
          } else if (filteredServices.length > 0) {
            setClinic(filteredServices[0].clinic);
          } else {
            setClinic(null);
          }

          // حفظ جميع الكاتيجوري للعرض
          if (categoriesResponse.status === 'success' && categoriesResponse.data) {
            setCategories(categoriesResponse.data);
          }
        } else {
          setError('فشل في جلب بيانات الخدمات');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    // تشغيل الجلب إذا كان لدينا clinicId أو categoryId
    if (clinicId || categoryId) {
      fetchData();
    } else {
      // إذا لم يكن لدينا معرف محدد، نعرض جميع الكاتيجوري مع خدماتها
      fetchData();
    }
  }, [clinicId, categoryId]);

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
            {clinic && clinic.isCategory ?
              (clinic.title_ar || clinic.title) :
              (clinic ? clinic.clinic_name : 'الخدمات والعيادات')
            }
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            {clinic && clinic.isCategory ?
              `استعرض جميع الخدمات والعيادات في قسم ${clinic.title_ar || clinic.title}` :
              (clinic ? `استعرض جميع الخدمات المتاحة في ${clinic.clinic_name}` : 'استعرض جميع الخدمات والعيادات المتاحة')
            }
          </p>
        </div>

        {/* حالة التحميل */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
            <span className="mr-3 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل الخدمات...</span>
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

        {/* حالة عدم وجود خدمات */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
              لا توجد خدمات متاحة لهذه العيادة حالياً
            </div>
          </div>
        )}

        {/* الكروت */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 place-items-center">
            {services.map((service) => {
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                  style={{
                    height: '480px',
                    width: '320px',
                    maxWidth: '100%'
                  }}
                >
                {/* الصورة */}
                <div className="relative w-full h-80 overflow-hidden bg-gray-100 rounded-t-xl">
                  <img
                    src={service.image}
                    alt={service.service}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />

                  {/* خصم - يظهر فقط لو في خصم حقيقي */}
                  {service.hasDiscount && service.discount && service.discount !== '0%' && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
                      -{service.discount}
                    </div>
                  )}

                  {/* زر التفاصيل الثابت */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => handleBookingClick(service.id, service.clinic?.id)}
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
                    {service.service}
                  </h3>

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
                    >
                      {service.about.length > 80 ? `${service.about.substring(0, 80)}...` : service.about}
                    </p>
                  )}

                  {/* الأسعار */}
                  <div className="flex items-center justify-center gap-2">
                    {/* السعر القديم المشطوب - يظهر فقط لو في خصم */}
                    {service.hasDiscount && (
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

                    {/* السعر الحالي */}
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
                  </div>
                </div>
              </div>
            );
          })}
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

export default Category;