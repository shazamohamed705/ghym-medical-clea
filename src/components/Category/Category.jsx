import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsServices, getClinicsCategories } from '../../API/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastManager';

function Category() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [services, setServices] = useState([]);
  const [clinic, setClinic] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  const clinicId = location.state?.clinicId;
  const categoryId = location.state?.categoryId;
  const searchQuery = searchParams.get('query'); // جلب query من URL
  const laserClinicIds = location.state?.laserClinicIds; // جلب clinic IDs من إرشادات الليزر
  const isLaserBooking = location.state?.isLaserBooking; // علامة أن هذا من إرشادات الليزر

  const handleBookingClick = (serviceId, serviceClinicId) => {
    navigate(`/service/${serviceClinicId || clinicId}/${serviceId}`);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // إذا كان هناك searchQuery، نبحث في الخدمات
        if (searchQuery) {
          const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/services?search=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          
          console.log('🔍 Category Search API Response:', data); // للتشخيص
          console.log('🔍 Full Response Structure:', JSON.stringify(data, null, 2));
          
          if (data.status === 'success' && data.data) {
            // التحقق من تنسيق البيانات المُرجعة
            let servicesArray = [];
            if (Array.isArray(data.data)) {
              servicesArray = data.data;
            } else if (data.data.services && Array.isArray(data.data.services)) {
              servicesArray = data.data.services;
            } else if (data.data.data && Array.isArray(data.data.data)) {
              servicesArray = data.data.data;
            }

            // تحويل البيانات للتنسيق المطلوب
            const formattedServices = servicesArray.map(service => {
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
            setClinic({ isSearch: true, searchQuery }); // تعيين حالة البحث
            
            console.log('✅ Formatted Search Services:', formattedServices);
            console.log('✅ Search Services Count:', formattedServices.length);
          } else {
            setServices([]);
            setClinic({ isSearch: true, searchQuery });
          }
        } else {
          // المنطق الأصلي للكاتيجوري والعيادات
          const [servicesResponse, categoriesResponse] = await Promise.all([
            getClinicsServices(),
            getClinicsCategories()
          ]);

          console.log('🏥 Services Response:', servicesResponse);
          console.log('🏥 Full Services Structure:', JSON.stringify(servicesResponse, null, 2));
          console.log('📂 Categories Response:', categoriesResponse);
          console.log('📂 Full Categories Structure:', JSON.stringify(categoriesResponse, null, 2));

          if (servicesResponse.status === 'success' && servicesResponse.data && servicesResponse.data.services) {
            const allServices = servicesResponse.data.services;
            
            console.log('📊 Total services from API:', allServices.length);
            console.log('📊 Sample service structure:', allServices[0]);
            console.log('📊 All clinic IDs in services:', [...new Set(allServices.map(s => s.clinics_id || s.clinic_id || s.clinic?.id))]);

            // إذا كان لدينا categoryId، نعرض خدمات هذه الكاتيجوري فقط
            let filteredServices = allServices;
            let selectedCategory = null;

            if (categoryId) {
              // فلترة الخدمات حسب categoryId
              filteredServices = allServices.filter(service =>
                service.category_id === categoryId
              );
              console.log('🔍 Filtering by categoryId:', categoryId);
              console.log('🔍 All services before filter:', allServices.length);
              console.log('🔍 Filtered services by category:', filteredServices.length);
              
              // العثور على الكاتيجوري المحددة
              if (categoriesResponse.status === 'success' && categoriesResponse.data) {
                selectedCategory = categoriesResponse.data.find(cat => cat.id === categoryId);
              }
            } else if (laserClinicIds && Array.isArray(laserClinicIds) && laserClinicIds.length > 0) {
              // فلترة الخدمات حسب laserClinicIds (من إرشادات الليزر)
              console.log('💎 Filtering by laser clinic IDs:', laserClinicIds);
              const numericIds = laserClinicIds.map(id => parseInt(id));
              filteredServices = allServices.filter(service => {
                const serviceClinicId = service.clinics_id || service.clinic_id || service.clinic?.id;
                return numericIds.includes(serviceClinicId);
              });
              console.log('💎 Filtered services for laser clinics:', filteredServices.length);
            } else if (clinicId) {
              // فلترة الخدمات حسب clinicId (المنطق القديم)
              console.log('🏥 Filtering by clinicId:', clinicId);
              console.log('🏥 All services before filter:', allServices.length);
              
              // جرب كل الطرق الممكنة للفلترة
              const filterByClinicsId = allServices.filter(service => service.clinics_id === clinicId);
              const filterByClinicId = allServices.filter(service => service.clinic_id === clinicId);
              const filterByClinicObject = allServices.filter(service => service.clinic?.id === clinicId);
              
              console.log('🏥 Filter by clinics_id:', filterByClinicsId.length);
              console.log('🏥 Filter by clinic_id:', filterByClinicId.length);
              console.log('🏥 Filter by clinic.id:', filterByClinicObject.length);
              
              // استخدم الفلتر اللي يرجع أكتر نتائج
              if (filterByClinicsId.length > 0) {
                filteredServices = filterByClinicsId;
                console.log('✅ Using clinics_id filter');
              } else if (filterByClinicId.length > 0) {
                filteredServices = filterByClinicId;
                console.log('✅ Using clinic_id filter');
              } else if (filterByClinicObject.length > 0) {
                filteredServices = filterByClinicObject;
                console.log('✅ Using clinic.id filter');
              } else {
                console.log('❌ No services found for clinic:', clinicId);
                // جرب تحويل clinicId لرقم
                const numericClinicId = parseInt(clinicId);
                const filterByNumericClinicsId = allServices.filter(service => service.clinics_id === numericClinicId);
                const filterByNumericClinicId = allServices.filter(service => service.clinic_id === numericClinicId);
                
                console.log('🔢 Filter by numeric clinics_id:', filterByNumericClinicsId.length);
                console.log('🔢 Filter by numeric clinic_id:', filterByNumericClinicId.length);
                
                if (filterByNumericClinicsId.length > 0) {
                  filteredServices = filterByNumericClinicsId;
                  console.log('✅ Using numeric clinics_id filter');
                } else if (filterByNumericClinicId.length > 0) {
                  filteredServices = filterByNumericClinicId;
                  console.log('✅ Using numeric clinic_id filter');
                }
              }
              
              console.log('🏥 Final filtered services:', filteredServices.length);
            }

            // تحويل البيانات للتنسيق المطلوب
            const formattedServices = filteredServices.map(service => {
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

            console.log('✅ Formatted Category/Clinic Services:', formattedServices);
            console.log('✅ Category/Clinic Services Count:', formattedServices.length);
            console.log('✅ Selected Category:', selectedCategory);
            console.log('✅ Clinic Data:', filteredServices.length > 0 ? filteredServices[0].clinic : 'No clinic data');

            // تعيين العيادة أو الكاتيجوري المحددة
            if (selectedCategory) {
              setClinic({ ...selectedCategory, isCategory: true });
            } else if (isLaserBooking) {
              setClinic({ isLaserBooking: true, clinicCount: laserClinicIds?.length || 0 });
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
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        console.error('❌ Error details:', err.message);
        console.error('❌ Error stack:', err.stack);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    // تشغيل الجلب إذا كان لدينا clinicId أو categoryId أو searchQuery
    if (clinicId || categoryId || searchQuery) {
      fetchData();
    } else {
      // إذا لم يكن لدينا معرف محدد، نعرض جميع الكاتيجوري مع خدماتها
      fetchData();
    }
  }, [clinicId, categoryId, searchQuery]);

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
            {clinic && clinic.isSearch ?
              `نتائج البحث عن: ${clinic.searchQuery}` :
              (clinic && clinic.isLaserBooking ?
                'خدمات الليزر المتاحة' :
                (clinic && clinic.isCategory ?
                  (clinic.title_ar || clinic.title) :
                  (clinic ? clinic.clinic_name : 'الخدمات والعيادات')
                )
              )
            }
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            {clinic && clinic.isSearch ?
              `تم العثور على ${services.length} نتيجة` :
              (clinic && clinic.isLaserBooking ?
                `استعرض جميع خدمات الليزر المتاحة في ${clinic.clinicCount} عيادة` :
                (clinic && clinic.isCategory ?
                  `استعرض جميع الخدمات والعيادات في قسم ${clinic.title_ar || clinic.title}` :
                  (clinic ? `استعرض جميع الخدمات المتاحة في ${clinic.clinic_name}` : 'استعرض جميع الخدمات والعيادات المتاحة')
                )
              )
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
                  {service.discount && service.hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
                      -{service.discount}
                    </div>
                  )}

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
                      onClick={() => handleBookingClick(service.id, service.clinicId || service.clinic?.id)}
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