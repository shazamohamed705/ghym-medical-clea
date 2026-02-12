import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { useToast } from '../Toast/ToastManager';

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const doctorsSectionRef = useRef(null);

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
  
  // Booking popup states
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loadingTimes, setLoadingTimes] = useState(false);
  
  // OTP booking states
  const [bookingStep, setBookingStep] = useState(1); // 1: calendar/time, 2: phone/name, 3: OTP
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']); // Array of 6 digits
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [phoneError, setPhoneError] = useState('');

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
  const [selectedClassification, setSelectedClassification] = useState(''); // فلتر التصنيف
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // حقل البحث الجديد
  const [currentPage, setCurrentPage] = useState(1);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (showBookingPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showBookingPopup]);

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

  // Auto-scroll to doctors section when coming from Dashboard
  useEffect(() => {
    const state = location.state;
    // Check if we came from Dashboard (حجز جديد button)
    if (state && state.fromDashboard && doctorsSectionRef.current) {
      // Wait a bit for doctors to load and render
      const scrollTimer = setTimeout(() => {
        doctorsSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 500);

      return () => clearTimeout(scrollTimer);
    }
  }, [location.state, showDoctors]);

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

  // Auto-select classification when doctor is selected
  useEffect(() => {
    if (formData.doctor) {
      const selectedDoctor = filteredDoctors.find(d => d.id == formData.doctor);
      if (selectedDoctor && selectedDoctor.classification) {
        setSelectedClassification(selectedDoctor.classification);
      }
    } else {
      // Reset classification when no doctor is selected
      setSelectedClassification('');
    }
  }, [formData.doctor, filteredDoctors]);

  // Filter doctors based on selected doctor, classification, and search query
  const displayedDoctors = filteredDoctors.filter(doctor => {
    // فلتر حسب الطبيب المحدد
    if (formData.doctor && doctor.id != formData.doctor) {
      return false;
    }
    
    // فلتر حسب التصنيف
    if (selectedClassification && doctor.classification !== selectedClassification) {
      return false;
    }
    
    // فلتر حسب البحث (اسم الدكتور أو اسم العيادة)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const doctorName = (doctor.name_ar || doctor.name || '').toLowerCase();
      const clinicName = (doctor.clinic_name || '').toLowerCase();
      
      if (!doctorName.includes(query) && !clinicName.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination
  const itemsPerPage = 8;
  const totalPages = Math.ceil(displayedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = displayedDoctors.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [formData.clinic, formData.doctor, selectedClassification, searchQuery]);

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
      // Find the doctor
      const doctor = filteredDoctors.find(d => d.id === doctorId);
      if (doctor) {
        setBookingDoctor(doctor);
        
        // If date is provided in formData, set it in the calendar
        if (formData.date) {
          const selectedDate = new Date(formData.date);
          const day = selectedDate.getDate();
          const month = selectedDate.getMonth() + 1;
          const year = selectedDate.getFullYear();
          
          setCurrentMonth(month);
          setCurrentYear(year);
          setBookingDate(day);
          
          // Fetch available times for the selected date
          fetchAvailableTimes(day, doctor.id, doctor.clinic_id);
        }
        
        setShowBookingPopup(true);
      }
    }
  };
  
  const closeBookingPopup = () => {
    setShowBookingPopup(false);
    setBookingDoctor(null);
    setBookingDate(null);
    setSelectedTime(null);
    setAvailableTimes([]);
    setBookingStep(1);
    setUserName('');
    setUserPhone('');
    setOtpCode(['', '', '', '', '', '']);
    setPhoneError('');
  };
  
  // Fetch available times when date is selected
  const fetchAvailableTimes = async (date, doctorId, clinicId) => {
    setLoadingTimes(true);
    try {
      const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${clinicId}?staff_id=${doctorId}&date=${formattedDate}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const timesArray = Object.entries(result.data).map(([time, value]) => ({
            time: time,
            value: value
          }));
          setAvailableTimes(timesArray);
        } else {
          setAvailableTimes([]);
        }
      } else {
        setAvailableTimes([]);
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };
  
  const handleDateSelect = (day) => {
    setBookingDate(day);
    setSelectedTime(null);
    if (bookingDoctor) {
      fetchAvailableTimes(day, bookingDoctor.id, bookingDoctor.clinic_id);
    }
  };
  
  // Validate phone number
  const validatePhone = (phone) => {
    if (!phone.startsWith('05')) {
      return 'رقم الهاتف يجب أن يبدأ بـ 05';
    }
    if (phone.length !== 10) {
      return 'رقم الهاتف يجب أن يكون 10 أرقام';
    }
    return '';
  };
  
  // Handle phone input
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      setUserPhone(value);
      setPhoneError('');
    }
  };
  
  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpCode(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  
  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };
  
  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtpCode(newOtp);
    
    // Focus last filled input or first empty
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const input = document.getElementById(`otp-${focusIndex}`);
    if (input) input.focus();
  };
  
  // Send OTP
  const handleSendOtp = async () => {
    // Validate inputs
    if (!userName.trim()) {
      setPhoneError('الرجاء إدخال الاسم');
      return;
    }
    
    const phoneValidation = validatePhone(userPhone);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }
    
    setSendingOtp(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/bookings/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone_number: userPhone
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setBookingStep(3);
        setPhoneError('');
      } else {
        setPhoneError(result.message || 'فشل إرسال رمز التحقق');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setPhoneError('حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setSendingOtp(false);
    }
  };
  
  // Confirm booking with OTP
  const handleConfirmBooking = async () => {
    const otpString = otpCode.join('');
    if (!otpString || otpString.length !== 6) {
      setPhoneError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    
    setConfirmingBooking(true);
    try {
      const token = localStorage.getItem('authToken');
      const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(bookingDate).padStart(2, '0')}`;
      
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: userName,
          phone: userPhone,
          otp: otpString,
          clinics_id: bookingDoctor.clinic_id,
          staff_id: bookingDoctor.id,
          date: formattedDate,
          time: selectedTime
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Success - show success toast and close popup
        showSuccess(`تم الحجز بنجاح! رقم الحجز: ${result.data.booking_id}`);
        closeBookingPopup();
        // Optionally navigate to bookings page
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setPhoneError(result.message || 'فشل تأكيد الحجز');
        showError(result.message || 'فشل تأكيد الحجز');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      setPhoneError('حدث خطأ أثناء تأكيد الحجز');
    } finally {
      setConfirmingBooking(false);
    }
  };
  
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setBookingDate(null);
    setAvailableTimes([]);
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setBookingDate(null);
    setAvailableTimes([]);
  };
  
  const getMonthName = (month) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1];
  };
  
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
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

            {/* حقل التصنيف */}
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-[#0171bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-[#0171bd] rounded-lg text-right appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#0171bd] focus:border-transparent"
              >
                <option value="">جميع التصنيفات</option>
                <option value="طبيب">طبيب</option>
                <option value="أخصائي">أخصائي</option>
                <option value="دكتور">دكتور</option>
                <option value="استشاري">استشاري</option>
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

            {/* حقل البحث */}
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-[#0171bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الدكتور أو العيادة"
                className="w-full pr-12 pl-4 py-3 border border-[#0171bd] rounded-lg text-right bg-white focus:outline-none focus:ring-2 focus:ring-[#0171bd] focus:border-transparent"
                style={{ fontFamily: 'Almarai' }}
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
      <section ref={doctorsSectionRef} className="py-16 bg-gray-50 flex-grow">
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
                  <>
                  <div className="flex justify-center" dir="rtl">
                    <div className={`
                      grid
                      ${paginatedDoctors.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}
                      gap-8
                      items-stretch
                    `}>
                    {paginatedDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className="bg-white rounded-2xl
                          shadow-2xl shadow-blue-200/40 hover:shadow-blue-300/60
                          transition-all duration-500
                          border border-gray-100
                          flex flex-col
                          w-80
                          h-[480px]
                          mx-auto"
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
                        {/* Doctor Name with Flag */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {doctor.nationality && doctor.type !== 'consultant' && (
                            <ReactCountryFlag
                              countryCode={doctor.nationality}
                              svg
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              title={doctor.nationality}
                            />
                          )}
                          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Almarai' }}>
                            {doctor.name_ar || doctor.name}
                          </h3>
                        </div>

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
                          {doctor.classification && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">التصنيف:</span>
                              <span className="text-blue-600 font-semibold">{doctor.classification}</span>
                            </div>
                          )}
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
                        {doctor.type === 'consultant' ? (
                          // زر واتساب للأجهزة (consultant)
                          <a
                            href={`https://wa.me/${doctor.phone?.replace(/^0/, '966')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg mt-6 flex items-center justify-center gap-2"
                            style={{ fontFamily: 'Almarai' }}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            اتصل للحجز
                          </a>
                        ) : (
                          // زر الحجز العادي للأطباء
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
                        )}
                        </div>
                      </div>
                    ))
                  }
                  </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8" dir="rtl">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ fontFamily: 'Almarai' }}
                      >
                        السابق
                      </button>
                      
                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-[#0171bd] text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            style={{ fontFamily: 'Almarai' }}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ fontFamily: 'Almarai' }}
                      >
                        التالي
                      </button>
                    </div>
                  )}
                  </>
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

      {/* Booking Popup */}
      {showBookingPopup && bookingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999] p-3 overflow-y-auto" onClick={closeBookingPopup}>
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50/50 to-sky-50/50">
              <div className="flex items-center gap-2">
                <img
                  src={bookingDoctor.photo || '/imge.png'}
                  alt={bookingDoctor.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                  onError={(e) => {
                    e.target.src = '/imge.png';
                  }}
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Almarai' }}>
                    احجز موعد
                  </h3>
                  <p className="text-xs text-blue-600 font-medium" style={{ fontFamily: 'Almarai' }}>
                    مع {bookingDoctor.name_ar || bookingDoctor.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeBookingPopup}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Two Columns */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {bookingStep === 1 ? (
                <>
                {/* Step 1: Calendar and Time Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Right Column - Calendar */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5" style={{ fontFamily: 'Almarai' }}>
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    اختر التاريخ
                  </h4>
                  
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-2 bg-blue-50/70 p-1.5 rounded-lg">
                    <button
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs font-bold text-gray-900" style={{ fontFamily: 'Almarai' }}>
                      {getMonthName(currentMonth)} {currentYear}
                    </span>
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-white rounded-lg border border-gray-100 p-2">
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((day, index) => (
                        <div key={index} className="text-center text-[10px] font-bold text-gray-500 py-0.5" style={{ fontFamily: 'Almarai' }}>
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, index) => (
                        <div key={`empty-${index}`} className="aspect-square"></div>
                      ))}
                      
                      {/* Actual days */}
                      {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, index) => {
                        const day = index + 1;
                        const today = new Date();
                        const isToday = day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
                        const isPast = new Date(currentYear, currentMonth - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isSelected = bookingDate === day;
                        
                        return (
                          <button
                            key={day}
                            onClick={() => !isPast && handleDateSelect(day)}
                            disabled={isPast}
                            className={`
                              aspect-square rounded-md flex items-center justify-center text-[11px] font-medium transition-all
                              ${isPast ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50 cursor-pointer'}
                              ${isSelected ? 'bg-blue-400 text-white hover:bg-blue-500 shadow-sm' : ''}
                              ${isToday && !isSelected ? 'border border-blue-400 text-blue-600 bg-blue-50/50' : ''}
                              ${!isSelected && !isToday && !isPast ? 'text-gray-700 bg-white hover:border hover:border-blue-200' : ''}
                            `}
                            style={{ fontFamily: 'Almarai' }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Left Column - Available Times */}
                <div className="flex flex-col h-full">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5" style={{ fontFamily: 'Almarai' }}>
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    الأوقات المتاحة
                  </h4>
                  
                  {/* Match calendar height: month nav (28px) + calendar grid */}
                  <div className="flex-1">
                    {!bookingDate ? (
                      <div className="flex flex-col items-center justify-center h-full bg-blue-50/50 rounded-lg p-4">
                        <svg className="w-10 h-10 text-blue-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-center text-xs" style={{ fontFamily: 'Almarai' }}>
                          اختر تاريخاً من التقويم
                        </p>
                      </div>
                    ) : loadingTimes ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-2"></div>
                        <span className="text-gray-500 text-xs" style={{ fontFamily: 'Almarai' }}>جاري التحميل...</span>
                      </div>
                    ) : availableTimes.length > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-100 p-2 h-full overflow-y-auto">
                        <div className="grid grid-cols-3 gap-1.5">
                          {availableTimes
                            .sort((a, b) => Number(a.value) - Number(b.value))
                            .map((timeSlot) => (
                              <button
                                key={timeSlot.value}
                                onClick={() => setSelectedTime(timeSlot.value)}
                                className={`
                                  py-2 px-2 rounded-md font-medium text-xs transition-all
                                  ${selectedTime === timeSlot.value 
                                    ? 'bg-blue-400 text-white shadow-sm scale-105' 
                                    : 'bg-blue-50/70 text-gray-700 hover:bg-blue-100 hover:text-blue-600 border border-blue-100/50'
                                  }
                                `}
                                style={{ fontFamily: 'Almarai' }}
                              >
                                {timeSlot.time}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-4">
                        <svg className="w-10 h-10 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 text-center text-xs" style={{ fontFamily: 'Almarai' }}>
                          لا توجد أوقات متاحة
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5 text-center" style={{ fontFamily: 'Almarai' }}>
                          جرب يوم آخر
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
              ) : bookingStep === 2 ? (
                /* Step 2: Name and Phone */
                <div className="py-6 px-4">
                  <div className="w-full max-w-2xl mx-auto space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-right" style={{ fontFamily: 'Almarai' }}>
                      معلومات الحجز
                    </h3>
                    
                    {/* Name Input */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 text-right" style={{ fontFamily: 'Almarai' }}>
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
                        style={{ fontFamily: 'Almarai' }}
                      />
                    </div>
                    
                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 text-right" style={{ fontFamily: 'Almarai' }}>
                        رقم الجوال
                      </label>
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={handlePhoneChange}
                        placeholder="05xxxxxxxx"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style={{ fontFamily: 'Almarai', direction: 'ltr', textAlign: 'right' }}
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-right" style={{ fontFamily: 'Almarai' }}>
                        يجب أن يبدأ الرقم بـ 05 ويكون 10 أرقام
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 3: OTP Verification */
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Almarai' }}>
                    تأكيد رقم الجوال
                  </h3>
                  <p className="text-sm text-gray-600 text-center mb-6" style={{ fontFamily: 'Almarai' }}>
                    تم إرسال رمز التحقق إلى {userPhone}
                  </p>
                  
                  <div className="w-full max-w-md">
                    <label className="block text-sm font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: 'Almarai' }}>
                      أدخل رمز التحقق
                    </label>
                    
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2 mb-4" dir="ltr">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="w-full mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      إعادة إرسال الرمز
                    </button>
                  </div>
                </div>
              )}
              
              {phoneError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 text-center" style={{ fontFamily: 'Almarai' }}>
                    {phoneError}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 px-4 py-3 border-t bg-gray-50/50">
              {bookingStep === 1 ? (
                <>
                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={!bookingDate || !selectedTime}
                    className={`
                      flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
                      ${bookingDate && selectedTime
                        ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white hover:from-blue-500 hover:to-sky-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }
                    `}
                    style={{ fontFamily: 'Almarai' }}
                  >
                    التالي
                  </button>
                  <button
                    onClick={closeBookingPopup}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    إلغاء
                  </button>
                </>
              ) : bookingStep === 2 ? (
                <>
                  <button
                    onClick={handleSendOtp}
                    disabled={!userName.trim() || !userPhone || sendingOtp}
                    className={`
                      flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
                      ${userName.trim() && userPhone && !sendingOtp
                        ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white hover:from-blue-500 hover:to-sky-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }
                    `}
                    style={{ fontFamily: 'Almarai' }}
                  >
                    {sendingOtp ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                  </button>
                  <button
                    onClick={() => setBookingStep(1)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    رجوع
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={otpCode.join('').length !== 6 || confirmingBooking}
                    className={`
                      flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
                      ${otpCode.join('').length === 6 && !confirmingBooking
                        ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white hover:from-blue-500 hover:to-sky-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }
                    `}
                    style={{ fontFamily: 'Almarai' }}
                  >
                    {confirmingBooking ? 'جاري التأكيد...' : 'تأكيد الحجز'}
                  </button>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    رجوع
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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