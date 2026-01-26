
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinicsData } from '../../../API/apiService';

// API Service functions for booking
const API_BASE_URL = 'https://ghaimcenter.com/laravel/api';

// Fetch clinics from API
const fetchClinics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/clinics`);
    const result = await response.json();
    if (result.status === 'success' && result.data?.data) {
      return result.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
};

// Fetch staff for selected clinic
const fetchStaffForClinic = async (clinicId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clinics/${clinicId}/staff`);
    const result = await response.json();
    if (result.status === 'success') {
      return result.data?.staff || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
};

function WelcomeSection() {
  const navigate = useNavigate();

  // Form data states
  const [formData, setFormData] = useState({
    clinic: '',
    doctor: '',
    date: ''
  });

  // API data states
  const [clinics, setClinics] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [heroData, setHeroData] = useState({
    hero_title_ar: '',
    hero_subtitle_ar: '',
    hero_button_text_ar: 'احجز الآن',
    two_image_in_hero_1: '',
    two_image_in_hero_2: '',
    url_before_image: ''
  });

  const [loading, setLoading] = useState(true);

  // جلب بيانات الـ hero section من API
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await getClinicsData();
        if (response.status === 'success' && response.data.home_page_setting) {
          setHeroData({
            hero_title_ar: response.data.home_page_setting.hero_title_ar || heroData.hero_title_ar,
            hero_subtitle_ar: response.data.home_page_setting.hero_subtitle_ar || heroData.hero_subtitle_ar,
            hero_button_text_ar: response.data.home_page_setting.hero_button_text_ar || heroData.hero_button_text_ar,
            two_image_in_hero_1: response.data.home_page_setting.two_image_in_hero_1 || '',
            two_image_in_hero_2: response.data.home_page_setting.two_image_in_hero_2 || '',
            url_before_image: response.data.url_before_image || ''
          });
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الـ hero section:', error);
        // البيانات الافتراضية تبقى كما هي في حالة الخطأ
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  // جلب العيادات عند تحميل المكون
  useEffect(() => {
    const loadClinics = async () => {
      const clinicsData = await fetchClinics();
      setClinics(clinicsData);
    };
    loadClinics();
  }, []);

  // تحديث الأطباء عند تغيير العيادة
  useEffect(() => {
    const loadDoctors = async () => {
      if (formData.clinic) {
        setLoadingStaff(true);
        const doctorsData = await fetchStaffForClinic(formData.clinic);
        setFilteredDoctors(doctorsData);
        setLoadingStaff(false);
      } else {
        setFilteredDoctors([]);
      }
    };
    loadDoctors();
  }, [formData.clinic]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Check if all data is selected (clinic, doctor, date)
    if (formData.clinic && formData.doctor && formData.date) {
      // Navigate directly to dashboard with booking data
      const bookingData = {
        doctorId: formData.doctor,
        clinicId: formData.clinic,
        date: formData.date
      };
      
      // Save booking data to localStorage for NewBookingFilter
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      
      // Navigate to dashboard with NewBooking filter
      navigate('/dashboard?filter=NewBooking', {
        state: bookingData
      });
    } else {
      // If not all data is selected, navigate to booking page
      navigate('/booking', {
        state: {
          clinicId: formData.clinic,
          doctorId: formData.doctor,
          date: formData.date
        }
      });
    }
  };

  const handleBookingClick = () => {
    navigate('/booking');
  };

  return (
    <>
      <section className="w-full bg-gradient-to-r from-[#0171bd]/10 to-[#a6c80d]/10 py-20 relative">
        {/* المحتوى */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 py-10">
          {/* الجزء الأيسر - الصور الدائرية (Ellipse 3 / Ellipse 4) */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start md:transform md:translate-x-20">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80">
              {/* الدائرة الكبيرة */}
              <div className="absolute bottom-20 left-4 md:top-0 md:left-2 w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-xl border-4 border-white">
                <img
                  src={heroData.url_before_image && heroData.two_image_in_hero_1 ? heroData.url_before_image + heroData.two_image_in_hero_1 : "/Ellipse 4.png"}
                  alt="خدمات مجمع غيم الطبي"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* الدائرة الصغيرة المتداخلة */}
              <div className="absolute bottom-2 right-0 md:bottom-0 md:right-0 w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-lg border-4 border-white">
                <img
                  src={heroData.url_before_image && heroData.two_image_in_hero_2 ? heroData.url_before_image + heroData.two_image_in_hero_2 : "/Ellipse 3.png"}
                  alt="ابتسامة وراحة المراجعين"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* دوائر ديكورية صغيرة - زرقاء */}
              <span className="hidden md:block absolute top-5 right-20 w-3.5 h-3.5 rounded-full bg-[#0171bd]" />
              <span className="absolute bottom-1 right-8 w-3 h-3 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute bottom-10 right-48 w-4 h-4 rounded-full bg-[#9bc115]" />
              <span className="hidden sm:block absolute top-8 left-12 w-3 h-3 rounded-full bg-[#0171bd]" />
              
              {/* دوائر ديكورية صغيرة - خضراء */}
              <span className="absolute bottom-5 right-3 w-6 h-6 rounded-full bg-[#9bc115]" />
              {/* الدائرة الخضراء الأكبر */}
              <span className="hidden md:block absolute top-8 right-16 w-6 h-6 rounded-full bg-[#9bc115]" />
              <span className="hidden sm:block absolute bottom-8 right-40 w-6 h-6 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute top-40 left-5 w-6 h-6 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute bottom-40 right-0 w-3 h-3 rounded-full bg-[#0171bd]" />
            </div>
          </div>

          {/* الجزء الأيمن - النص */}
          <div className="w-full md:w-1/2 text-center md:text-right md:mr-16" dir="rtl">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
              </div>
            ) : (
              <>
            <h2 className="mb-3 font-bold text-2xl sm:text-4xl md:text-[40px] text-center md:text-right">

            {heroData.hero_title_ar ? (
                    (() => {
                      const titleParts = heroData.hero_title_ar.split(' ');
                      const firstPart = titleParts[0] || '';
                      const restPart = titleParts.slice(1).join(' ') || '';
                      return (
                        <>
                          <span className="text-black">{firstPart} </span>
                          <span className="text-[#9bc115]">{restPart}</span>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <span className="text-black">مجمع </span>
                      <span className="text-[#9bc115]">غيم الطبي</span>
                    </>
                  )}
                </h2>
                <p className="text-gray-600 max-w-4xl mx-auto md:mx-0 text-sm sm:text-base md:text-[18px] text-center md:text-justify">
                {heroData.hero_subtitle_ar}
                </p>

                <button
                  onClick={handleBookingClick}
                  className="mt-6 inline-flex items-center justify-center px-8 py-2.5 text-sm sm:text-base font-semibold rounded-lg border border-[#0171bd] text-[#0171bd] bg-white hover:bg-[#0171bd] hover:text-white transition-colors shadow-sm cursor-pointer"
                >
                  {heroData.hero_button_text_ar}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* نموذج حجز الموعد - منفصل ومركب على السكشن */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="rounded-lg p-6 md:p-8 bg-white shadow-xl" dir="rtl">
          {/* العنوان */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-right">
            إحجز موعدك الآن
          </h2>

          {/* النموذج */}
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* حقل العيادة */}
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-[#0171bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <select
                name="clinic"
                value={formData.clinic}
                onChange={handleChange}
                className="w-full pr-12 pl-4 py-3 border border-[#0171bd] rounded-lg text-right appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#0171bd] focus:border-transparent"
                required
              >
                <option value="">اختر العيادة</option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.clinic_name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* حقل الطبيب */}
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-[#0171bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                className="w-full pr-12 pl-4 py-3 border border-[#0171bd] rounded-lg text-right appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#0171bd] focus:border-transparent"
                required
                disabled={!formData.clinic || loadingStaff}
              >
                <option value="">
                  {loadingStaff ? 'جاري تحميل الأطباء...' : 'اختر الطبيب'}
                </option>
                {filteredDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name_ar || doctor.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* حقل التاريخ */}
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-[#0171bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full pr-12 pl-4 py-3 border border-[#0171bd] rounded-lg text-right bg-white focus:outline-none focus:ring-2 focus:ring-[#0171bd] focus:border-transparent"
                required
                disabled={!formData.doctor}
                min={new Date().toISOString().split('T')[0]}
                placeholder="اختر التاريخ"
              />
            </div>

            {/* زر البحث */}
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-[#0171bd] text-white rounded-lg font-semibold hover:bg-[#015a99] transition-colors shadow-md"
              style={{ fontFamily: 'Almarai' }}
            >
              بحث
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default WelcomeSection;
