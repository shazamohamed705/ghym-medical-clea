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

  const handleBookingClick = (doctorId, clinicId) => {
    navigate('/booking', { state: { doctorId, clinicId } });
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
            clinicId: doctor.clinics_id
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

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default DoctorsSection;
