import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getDoctorsData } from '../../API/apiService';

const BASE_URL = 'https://ghaimcenter.com/laravel/storage/app/public';

function DoctorsSection() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(false);

  const handleBookingClick = (doctorId, clinicId) => {
    navigate('/booking', { state: { doctorId, clinicId } });
  };

  const handleInfoClick = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    
    // جلب معلومات العيادة
    if (doctor.clinicId) {
      setLoadingClinic(true);
      try {
        const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${doctor.clinicId}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          setClinicInfo(result.data);
        }
      } catch (error) {
        console.error('خطأ في جلب معلومات العيادة:', error);
      } finally {
        setLoadingClinic(false);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
    setClinicInfo(null);
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await getDoctorsData();

        if (response.status === 'success' && response.data) {
          // البيانات الآن تأتي مباشرة كـ array من الأطباء
          const doctorsArray = Array.isArray(response.data) ? response.data : [];
          
          // فلترة الأطباء النشطين فقط (status = 1) والذين يسمحون بالحجز الإلكتروني
          const activeDoctors = doctorsArray.filter(doctor => 
            doctor.status === 1 && 
            doctor.allow_online_booking === true &&
            doctor.type === 'doctor'
          );

          // تحويل البيانات للتنسيق المطلوب
          const formattedDoctors = activeDoctors.map(doctor => ({
            id: doctor.id,
            name: doctor.name_ar || doctor.name,
            specialty: doctor.classification || 'طبيب عام',
            image: doctor.photo || '/imge.png',
            alt: `${doctor.name_ar || doctor.name} - ${doctor.classification || 'طبيب عام'}`,
            rating: doctor.rating || 0,
            phone: doctor.phone,
            price: doctor.price,
            clinicId: doctor.clinics_id,
            // إضافة المعلومات الإضافية
            about_ar: doctor.about_ar,
            about_en: doctor.about_en,
            policy_ar: doctor.policy_ar,
            policy_en: doctor.policy_en,
            nationality: doctor.nationality,
            gender: doctor.gender,
            slot_duration: doctor.slot_duration,
            ghaim_price: doctor.ghaim_price
          }));

          console.log('Formatted doctors with prices:', formattedDoctors.map(d => ({ name: d.name, price: d.price })));
          setDoctors(formattedDoctors);
        } else {
          setError('فشل في جلب بيانات الأطباء');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('حدث خطأ في تحميل الأطباء');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
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
            أطباؤنا
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-600"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 400
            }}
          >
            فريق طبي متخصص ومتقدم لخدمتكم بأفضل الطرق العلاجية
          </p>
        </div>

        {/* حالة التحميل */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
            <span className="mr-3 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل الأطباء...</span>
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

        {/* حالة عدم وجود أطباء */}
        {!loading && !error && doctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
              لا يوجد أطباء متاحون حالياً
            </div>
          </div>
        )}

        {/* البطاقات */}
        {!loading && !error && doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  height: '500px'
                }}
              >
                {/* الصورة */}
                <div className="relative w-full h-80 overflow-hidden bg-gray-100 rounded-t-xl">
                  <img
                    src={doctor.image}
                    alt={doctor.alt}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/imge.png';
                    }}
                  />
                  
                  {/* زر المعلومات */}
                  <button
                    onClick={() => handleInfoClick(doctor)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
                    title="معلومات الطبيب"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>

                {/* المعلومات والزر */}
                <div className="p-4 sm:p-5 text-center">
                  <h3
                    className="text-lg sm:text-xl font-bold text-gray-900 mb-2"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700
                    }}
                  >
                    {doctor.name}
                  </h3>
                  <p
                    className="text-sm sm:text-base text-gray-600 mb-2"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 400
                    }}
                  >
                    {doctor.specialty}
                  </p>
                  
                  <button
                    onClick={() => handleBookingClick(doctor.id, doctor.clinicId)}
                    className="w-full py-3 px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-2xl font-bold text-lg hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mt-auto relative z-10 cursor-pointer"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    احجز الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal معلومات الطبيب */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Almarai' }}>
                معلومات الطبيب
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* معلومات أساسية */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedDoctor.image}
                  alt={selectedDoctor.name}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/imge.png';
                  }}
                />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Almarai' }}>
                    {selectedDoctor.name}
                  </h4>
                  <p className="text-blue-600 font-medium" style={{ fontFamily: 'Almarai' }}>
                    {selectedDoctor.specialty}
                  </p>
                  {selectedDoctor.phone && (
                    <p className="text-gray-600 text-sm flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {selectedDoctor.phone}
                    </p>
                  )}
                  {/* اسم العيادة فقط */}
                  {loadingClinic ? (
                    <p className="text-gray-500 text-sm" style={{ fontFamily: 'Almarai' }}>
                      جاري تحميل معلومات العيادة...
                    </p>
                  ) : clinicInfo ? (
                    <div className="mt-2">
                      <p className="font-medium text-sm flex items-center gap-1" style={{ fontFamily: 'Almarai', color: '#010101ff' }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H8v-2h2V9h4v2h2v2h-2v4z"/>
                        </svg>
                        {clinicInfo.clinic_name || clinicInfo.owner_name}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="space-y-4">
                {selectedDoctor.about_ar && (
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Almarai' }}>
                      نبذة عن الطبيب:
                    </h5>
                    <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Almarai' }}>
                      {selectedDoctor.about_ar}
                    </p>
                  </div>
                )}

                {selectedDoctor.policy_ar && (
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Almarai' }}>
                      سياسة الطبيب:
                    </h5>
                    <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Almarai' }}>
                      {selectedDoctor.policy_ar}
                    </p>
                  </div>
                )}

                {/* معلومات الحجز */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-bold text-blue-900 mb-3" style={{ fontFamily: 'Almarai' }}>
                    معلومات الحجز:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {selectedDoctor.slot_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600" style={{ fontFamily: 'Almarai' }}>مدة الجلسة:</span>
                        <span className="font-medium text-blue-900" style={{ fontFamily: 'Almarai' }}>
                          {selectedDoctor.slot_duration} دقيقة
                        </span>
                      </div>
                    )}
                    {selectedDoctor.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600" style={{ fontFamily: 'Almarai' }}>السعر:</span>
                        <span className="font-medium text-blue-900" style={{ fontFamily: 'Almarai' }}>
                          {selectedDoctor.price} ر.س
                        </span>
                      </div>
                    )}
                    {selectedDoctor.ghaim_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600" style={{ fontFamily: 'Almarai' }}>سعر غيم:</span>
                        <span className="font-medium text-green-600" style={{ fontFamily: 'Almarai' }}>
                          {selectedDoctor.ghaim_price} ر.س
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* زر الحجز */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    closeModal();
                    handleBookingClick(selectedDoctor.id, selectedDoctor.clinicId);
                  }}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300"
                  style={{ fontFamily: 'Almarai' }}
                >
                  احجز موعد مع {selectedDoctor.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default DoctorsSection;
