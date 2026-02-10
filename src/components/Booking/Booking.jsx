import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();

  // Form data states
  const [formData, setFormData] = useState({
    clinic: '',
    doctor: '',
    date: ''
  });

  // API data states
  const [clinics, setClinics] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // UI states
  const [showDoctors, setShowDoctors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [hasPreloadedData, setHasPreloadedData] = useState(false);

  // Add custom animations CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      .animate-slide-up {
        animation: slide-up 0.4s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Filter states for the filter component
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch clinics on component mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Load data from navigation state if available
  useEffect(() => {
    const state = location.state;
    if (state && (state.clinicId || state.doctorId || state.date)) {
      setFormData({
        clinic: state.clinicId || '',
        doctor: state.doctorId || '',
        date: state.date || ''
      });
      setHasPreloadedData(true);

      // If we have clinicId, load doctors for that clinic
      if (state.clinicId) {
        fetchStaffForClinic(state.clinicId).then(doctors => {
          setFilteredDoctors(doctors);
          setLoadingStaff(false);
          setShowDoctors(true); // Show doctors after loading
          // Show doctors if we have all required data
          if (state.doctorId && state.date) {
            setShowDoctors(true);
          }
        });
      } else {
        // If no clinicId in state, load all doctors
        fetchAllDoctors();
      }
    } else {
      // If no state at all, load all doctors on initial load
      fetchAllDoctors();
    }
  }, [location.state]);

  // Update filtered doctors when clinic changes
  useEffect(() => {
    if (formData.clinic) {
      // If clinic is selected, show only doctors from that clinic
      fetchStaffForClinic(formData.clinic);
    } else {
      // If no clinic selected, show all doctors
      fetchAllDoctors();
    }
  }, [formData.clinic]);

  // Filter doctors based on selected doctor
  const displayedDoctors = formData.doctor 
    ? (filteredDoctors || []).filter(doctor => doctor.id == formData.doctor)
    : (filteredDoctors || []);

  // Fetch clinics from API
  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://ghaimcenter.com/laravel/api/clinics');
      const result = await response.json();

      if (result.status === 'success' && result.data?.data) {
        setClinics(result.data.data);
      } else {
        setClinics([]);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch staff for selected clinic
  const fetchStaffForClinic = async (clinicId) => {
    try {
      setLoadingStaff(true);
      
      // Get clinic info first
      const clinicResponse = await fetch(`https://ghaimcenter.com/laravel/api/clinics`);
      const clinicResult = await clinicResponse.json();
      const clinic = clinicResult.data?.data?.find(c => c.id == clinicId);
      
      // Get staff for the clinic
      const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${clinicId}/staff`);
      const result = await response.json();

      if (result.status === 'success') {
        const staff = result.data?.staff || [];
        // Add clinic info to each doctor
        const doctorsWithClinicInfo = staff.map(doctor => ({
          ...doctor,
          clinic_name: clinic?.clinic_name || clinic?.owner_name,
          clinic_id: clinicId,
          clinic_address: clinic?.clinic_address,
          clinic_phone: clinic?.clinic_phone
        }));
        
        setFilteredDoctors(doctorsWithClinicInfo);
        setShowDoctors(true); // Show doctors after loading
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setFilteredDoctors([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch all doctors from all clinics
  const fetchAllDoctors = async () => {
    try {
      setLoadingStaff(true);
      console.log('🔍 جاري جلب جميع الأطباء من جميع العيادات...');

      // First fetch all clinics
      const clinicsResponse = await fetch('https://ghaimcenter.com/laravel/api/clinics');
      const clinicsResult = await clinicsResponse.json();

      if (clinicsResult.status === 'success' && clinicsResult.data?.data) {
        const allClinics = clinicsResult.data.data;
        console.log('🏥 تم العثور على', allClinics.length, 'عيادة');

        // Fetch staff for all clinics in parallel
        const staffPromises = allClinics.map(async (clinic) => {
          try {
            const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${clinic.id}/staff`);
            const result = await response.json();
            if (result.status === 'success') {
              const staff = result.data?.staff || [];
              // Add clinic info to each doctor
              return staff.map(doctor => ({
                ...doctor,
                clinic_name: clinic.clinic_name || clinic.owner_name,
                clinic_id: clinic.id,
                clinic_address: clinic.clinic_address,
                clinic_phone: clinic.clinic_phone
              }));
            }
            return [];
          } catch (error) {
            console.error(`خطأ في جلب أطباء العيادة ${clinic.id}:`, error);
            return [];
          }
        });

        const allStaffArrays = await Promise.all(staffPromises);
        const allDoctors = allStaffArrays.flat();

        console.log('👨‍⚕️ تم العثور على', allDoctors.length, 'طبيب إجمالي');
        setFilteredDoctors(allDoctors);
        setShowDoctors(true); // Show doctors immediately
      }
    } catch (error) {
      console.error('خطأ في جلب جميع الأطباء:', error);
      setFilteredDoctors([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Handle booking click
  const handleBookingClick = (doctorId = null, clinicId = null, date = null) => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      // Show login popup if not logged in
      setShowLoginPopup(true);
    } else {
      // Use provided doctor/clinic/date or fall back to formData
      const bookingData = {
        doctorId: doctorId || formData.doctor,
        clinicId: clinicId || formData.clinic,
        date: date || formData.date
      };

      // Navigate to new booking page with booking data
      navigate('/dashboard?filter=NewBooking', {
        state: bookingData
      });
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    setShowLoginPopup(false);
    navigate('/login');
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowDoctors(false);

    // Simulate search delay for UX
    setTimeout(() => {
      setIsLoading(false);
      setShowDoctors(true);
    }, 1000);
  };



  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      {/* Banner Section */}
      <section className="w-full ">
        <BannerCarousel />
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="rounded-lg p-6 md:p-8 bg-white shadow-2xl" dir="rtl"
             style={{
               boxShadow: '0 10px 25px rgba(0, 113, 189, 0.3), 0 4px 10px rgba(0, 113, 189, 0.2)'
             }}>
          {/* العنوان */}
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-right"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 700
            }}
          >
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
                {clinics && clinics.map(clinic => (
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
                {filteredDoctors && filteredDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
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
              disabled={isLoading}
              className="w-full md:w-auto px-8 py-3 bg-[#0171bd] text-white rounded-lg font-semibold hover:bg-[#015a99] transition-colors shadow-md disabled:opacity-50"
              style={{ fontFamily: 'Almarai' }}
            >
              {isLoading ? 'جاري البحث...' : 'بحث'}
            </button>
          </form>
        </div>
      </div>

      {/* Doctors Cards Section */}
      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container mx-auto px-4">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center"
            style={{
              fontFamily: 'Almarai',
              fontWeight: 700
            }}
          >
            الأطباء المتاحون
          </h2>

          {/* Main Content Layout with Filter on Right */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Doctors Cards */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  </div>
                  <p className="mt-4 text-blue-600 font-semibold" style={{ fontFamily: 'Almarai' }}>
                    جاري البحث عن الأطباء...
                  </p>
                </div>
              ) : showDoctors ? (
                displayedDoctors && displayedDoctors.length > 0 ? (
                  <div className={`
                    grid
                    ${displayedDoctors.length === 1 ? 'grid-cols-1 justify-items-center' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}
                    gap-8
                    items-stretch
                  `} dir="rtl">
                    {displayedDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className="bg-white rounded-2xl
                          shadow-2xl shadow-blue-200/40 hover:shadow-blue-300/60
                          transition-all duration-500
                          border border-gray-100
                          flex flex-col
                          w-80
                          h-[480px]"
                        >
                        {/* Header + Image */}
                        <div className="relative h-44 bg-gradient-to-r from-[#0171bd]/10 to-[#a6c80d]/10 flex justify-center">
                          <img
                            src={doctor.photo || '/default-doctor.png'}
                            alt={doctor.name}
                          className="w-32 h-32 rounded-full object-contain
                          border-4 border-white
                          shadow-xl
                          -mt-8"
                          />
                        </div>

                      {/* Content */}
                      <div className="p-4 text-center flex flex-col h-full relative" dir="rtl">
                        {/* Doctor Name */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Almarai' }}>
                          {doctor.name_ar || doctor.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex justify-center mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 mx-0.5 ${star <= (doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>

                        {/* Clinic Info Separator */}
                        <div className="border-t border-dotted border-gray-300 my-3"></div>

                        {/* Clinic Information */}
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">العيادة:</span>
                            <span>{doctor.clinic_name || 'غير محدد'}</span>
                          </div>
                          {doctor.clinic_address && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">العنوان:</span>
                              <span>{doctor.clinic_address}</span>
                            </div>
                          )}
                          {doctor.clinic_phone && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">الهاتف:</span>
                              <span>{doctor.clinic_phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Doctor Info Separator */}
                        <div className="border-t border-dotted border-gray-300 my-3"></div>

                        {/* Doctor Information */}
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          {doctor.slot_duration && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">مدة الجلسة:</span>
                              <span>{doctor.slot_duration} دقيقة</span>
                            </div>
                          )}
                          {doctor.ghaim_price && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">السعر:</span>
                              <span className="flex items-center gap-1">
                                {doctor.ghaim_price}
                                <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', fontSize: '0.9em', fontWeight: '600'}}>ر.س</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Book Button */}
                        <button
                          onClick={() => handleBookingClick(
                            doctor.id,
                            doctor.clinic_id || formData.clinic,
                            formData.date
                          )}
                          className="w-full py-3 px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-md hover:shadow-lg mt-6"
                          style={{ fontFamily: 'Almarai' }}
                        >
                          احجز الآن
                        </button>
                        </div>
                      </div>
                    ))
                  }
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p
                      className="text-gray-600 text-lg"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      لا يوجد أطباء متاحون لهذا التخصص حالياً
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p
                    className="text-gray-600 text-lg"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    اضغط على "بحث" لرؤية الأطباء المتاحين
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - Filters */}
            
          </div>
        </div>
      </section>

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" dir="rtl">
          <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-blue-200 transform transition-all duration-300 scale-100 animate-slide-up">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 left-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="mb-4">
                {/* Animated Icon */}
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: 'Almarai' }}>
                  تسجيل الدخول مطلوب
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: 'Almarai' }}>
                  يرجى تسجيل الدخول أولاً لإمكانية الحجز وإدارة مواعيدك
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleLoginRedirect}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  style={{ fontFamily: 'Almarai' }}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    سجل الدخول
                  </span>
                </button>
                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  style={{ fontFamily: 'Almarai' }}
                >
                  ربما لاحقاً
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Almarai' }}>
                  احجز موعدك بسهولة! ⏰
                </p>
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

export default Booking;