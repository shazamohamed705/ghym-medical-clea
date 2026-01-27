import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ServiceDetails.css';
import { getClinicsServices } from '../../API/apiService';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

const ServiceDetails = () => {
  const { clinicId, serviceId } = useParams();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState(null);
  const [salonData, setSalonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Choose Doctor, 2: Date & Time
  const [staffData, setStaffData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableTimes, setAvailableTimes] = useState({});
  const [availableTimesError, setAvailableTimesError] = useState('');

  // Normalize any date-like input to YYYY-MM-DD (hoisted as function to be usable before declarations)
  function normalizeDateYMD(dateInput) {
    if (!dateInput) return '';
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput; // already YYYY-MM-DD
      const m = dateInput.match(/^\s*(\d{2})[/-](\d{2})[/-](\d{4})\s*$/);
      if (m) {
        const [, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`;
      }
      const digitsOnly = dateInput.replace(/[^0-9]/g, '');
      if (digitsOnly.length === 8) {
        let yyyy, mm, dd;
        if (/^(19|20)/.test(digitsOnly)) {
          yyyy = digitsOnly.slice(0, 4);
          mm = digitsOnly.slice(4, 6);
          dd = digitsOnly.slice(6, 8);
        } else {
          dd = digitsOnly.slice(0, 2);
          mm = digitsOnly.slice(2, 4);
          yyyy = digitsOnly.slice(4, 8);
        }
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Format date for UI as MM-DD-YYYY (month first)
  function formatDateMDY(dateInput) {
    const ymd = normalizeDateYMD(dateInput);
    if (!ymd) return '';
    const [yyyy, mm, dd] = ymd.split('-');
    return `${mm}-${dd}-${yyyy}`;
  }

  const minDate = useMemo(() => normalizeDateYMD(new Date()), []);

  const [addresses, setAddresses] = useState([]);
  const [bookingData, setBookingData] = useState({
    staff_id: null,
    date: '',
    time: '', // legacy field (not used for POST)
    timeCode: '', // HHmm format required by API
    timeLabel: '', // HH:MM for UI
    address: '',
    notes: ''
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessId, setBookingSuccessId] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

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

  // Saudi Riyal Text Symbol Component
  const SaudiRiyalIcon = () => (
    <span 
      style={{
        display: 'inline-block', 
        verticalAlign: 'middle', 
        marginRight: '4px',
        fontSize: '0.9em',
        fontWeight: '600'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="15" height="15" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
    </span>
  );

  // Fetch service and salon details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching service details for clinic ${clinicId}, service ${serviceId}`);
        const result = await getClinicsServices();
        console.log('Clinics Services Response:', result);

        if (result.status === 'success' && result.data && result.data.services) {
          // Find the service by serviceId
          const service = result.data.services.find(s => s.id === parseInt(serviceId));

          if (service) {
            setServiceData(service);
            setSalonData(service.clinic); // Set clinic data from service.clinic
            console.log('✅ Service found:', service);
            console.log('✅ Clinic data:', service.clinic);
          } else {
            setError('الخدمة المطلوبة غير موجودة');
            console.error('❌ Service not found');
          }
        } else {
          setError('فشل تحميل بيانات الخدمة');
        }
      } catch (error) {
        setError('حدث خطأ في الاتصال بالخادم');
        console.error('❌ Error fetching service details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchServiceDetails();
    }
  }, [clinicId, serviceId]);

  // Fetch staff data
  const fetchStaffData = async () => {
    try {
      console.log(`Fetching staff for clinic ID: ${clinicId}`);
      const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${clinicId}/staff`);
      const result = await response.json();
      console.log('Staff API response:', result);
      
      if (result.status === 'success' && result.data) {
        // البيانات الآن تأتي في result.data.staff كـ array
        const staffArray = Array.isArray(result.data.staff) ? result.data.staff : [];
        // فلترة الأطباء النشطين فقط (status = 1) والذين يسمحون بالحجز الإلكتروني
        const activeStaff = staffArray.filter(staff => 
          staff.status === 1 && 
          staff.allow_online_booking === true &&
          staff.is_deleted === 0
        );
        setStaffData(activeStaff);
        console.log(`✅ Active staff found for clinic ${clinicId}:`, activeStaff);
        console.log(`✅ Total staff count: ${staffArray.length}, Active staff count: ${activeStaff.length}`);
      } else {
        console.log(`❌ No staff found for clinic ${clinicId}`);
        setStaffData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
      setStaffData([]);
    }
  };

  // Fetch available times
  const fetchAvailableTimes = async (staffId, date) => {
    try {
      const safeDate = normalizeDateYMD(date);
      const url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${clinicId}?staff_id=${staffId}&date=${safeDate}&service_id=${serviceId}`;
      console.log('⏰ Fetching available times...', { staffId, date, safeDate, serviceId, url });
      const response = await fetch(url);
      console.log('⏰ Available times response status:', response.status);
      const rawText = await response.clone().text().catch(() => '');
      let result = {};
      try {
        result = await response.json();
      } catch (e) {
        console.warn('⏰ Failed to parse JSON, raw:', rawText);
      }
      console.log('⏰ Available times JSON:', result);
      if (!response.ok) {
        if (response.status === 422) {
          console.warn('⏰ 422 Unprocessable Entity for available_times', { staffId, safeDate, serviceId, url, rawText, result });
          setAvailableTimesError(result?.message || 'لا توجد أوقات متاحة لهذا اليوم');
        }
        setAvailableTimes({});
        return;
      }
      if (result && result.status === 'success') {
        setAvailableTimes(result.data || {});
        setAvailableTimesError('');
      } else {
        setAvailableTimes({});
        setAvailableTimesError(result?.message || 'لا توجد أوقات متاحة لهذا اليوم');
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes({});
      setAvailableTimesError('تعذر جلب الأوقات. حاول مرة أخرى.');
    }
  };

  // Fetch user addresses (requires auth token)
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No user token found, skipping user addresses fetch');
        setAddresses([]);
        return;
      }

      const response = await fetch('https://ghaimcenter.com/laravel/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        const normalized = result.data.map((addr, idx) => {
          const label = addr.full_address || addr.address || [addr.city, addr.district, addr.street].filter(Boolean).join(' - ');
          return { id: addr.id ?? idx, label };
        });
        setAddresses(normalized);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      setAddresses([]);
    }
  };

  const handleBookNow = async () => {
    // Check booking cycle first
    if (serviceData.booking_cycle !== 1) {
      // Redirect to WhatsApp booking
      try {
        const response = await fetch('https://ghaimcenter.com/laravel/api/contact-data');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const contactData = result.data.find(item => item.prefix === 'contact_data');
          if (contactData && contactData.data.whats_app_number) {
            const whatsappNumber = contactData.data.whats_app_number;
            const serviceName = serviceData.title_ar || serviceData.title;
            const message = `مرحباً، أريد حجز موعد لخدمة: ${serviceName}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            
            // Use window.location.href for better mobile compatibility
            window.location.href = whatsappUrl;
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
      
      // Fallback if WhatsApp data not available
      alert('يرجى التواصل معنا عبر الهاتف لحجز هذه الخدمة');
      return;
    }

    // Normal booking process for booking_cycle = 1
    const token = localStorage.getItem('authToken');
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    setShowBookingForm(true);
    setBookingStep(1);
    fetchStaffData();
    fetchAddresses();
  };

  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    setBookingData(prev => ({ ...prev, staff_id: staff.id }));
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedStaff) {
      setBookingStep(2);
    }
  };

  const handleDateChange = (date) => {
    const safeDate = normalizeDateYMD(date);
    setBookingData(prev => ({ ...prev, date: safeDate }));
    if (selectedStaff && safeDate) {
      setAvailableTimes({});
      setAvailableTimesError('');
      fetchAvailableTimes(selectedStaff.id, safeDate);
    }
  };

  const handleTimeSelect = (label, code) => {
    setBookingData(prev => ({ ...prev, time: label, timeLabel: label, timeCode: String(code) }));
  };

  const handleLoginRedirect = () => {
    setShowLoginPopup(false);
    navigate('/login');
  };

  const handleConfirmBooking = async () => {
    try {
      setBookingError('');
      setIsSubmittingBooking(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setBookingError('يرجى تسجيل الدخول أولاً');
        setIsSubmittingBooking(false);
        return;
      }

      const payload = {
        clinics_id: Number(clinicId),
        service_id: Number(serviceId),
        staff_id: Number(bookingData.staff_id || selectedStaff?.id),
        date: normalizeDateYMD(bookingData.date),
        time: bookingData.timeCode
      };

      // إضافة العنوان فقط إذا تم اختياره
      if (bookingData.address && bookingData.address !== '') {
        payload.address_id = Number(bookingData.address);
      }

      // إضافة الملاحظات فقط إذا كانت موجودة
      if (bookingData.notes && bookingData.notes.trim() !== '') {
        payload.notes = bookingData.notes.trim();
      }

      // Basic validation
      if (!payload.clinics_id || !payload.service_id || !payload.staff_id || !payload.date || !payload.time) {
        setBookingError('يرجى اختيار الطبيب، التاريخ، والوقت');
        setIsSubmittingBooking(false);
        return;
      }

      console.log('📝 Creating booking with payload:', payload);
      console.log('📝 Payload details:');
      console.log('- clinics_id:', payload.clinics_id);
      console.log('- service_id:', payload.service_id);
      console.log('- staff_id:', payload.staff_id);
      console.log('- date:', payload.date);
      console.log('- time:', payload.time);
      console.log('- address_id:', payload.address_id || 'غير محدد');
      console.log('- notes:', payload.notes || 'غير محدد');
      const res = await fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const raw = await res.clone().text().catch(() => '');
      let json = {};
      try { json = await res.json(); } catch {}
      console.log('📝 Create booking status:', res.status, 'json:', json, 'raw:', raw);

      if (!res.ok) {
        setBookingError(json?.message || 'فشل إنشاء الحجز');
        setIsSubmittingBooking(false);
        return;
      }

      const createdId = json?.data?.id || json?.booking_id;
      setBookingSuccessId(createdId || null);
      // Navigate to dashboard bookings after success
      navigate('/dashboard/bookings');
    } catch (e) {
      console.error('Create booking error:', e);
      setBookingError('حدث خطأ أثناء إنشاء الحجز. حاول مرة أخرى.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="service-details-page">
        <div className="service-details-container">
          <div className="service-details-loading">
            <div className="loading-spinner"></div>
            <p>جاري تحميل تفاصيل الخدمة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !serviceData) {
    return (
      <div className="service-details-page">
        <div className="service-details-container">
          <div className="service-details-error">
            <h2>خطأ في تحميل الخدمة</h2>
            <p>{error || 'الخدمة غير موجودة'}</p>
            <button 
              onClick={() => navigate('/offers')}
              className="back-to-services-btn"
            >
              العودة للخدمات
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use owner_photo as the main service image (fallback to service images)
  const serviceImage = salonData?.owner_photo || 
    (serviceData.images && serviceData.images.length > 0 
      ? serviceData.images[0].image 
      : '/imge.png');

  const hasPrice = serviceData.price && Number(serviceData.price) > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      <div className="service-details-page">
        <div className="service-details-container">

        <div className="service-details-content">
          {/* Left Side - Service Information */}
          <div className="service-details-info">
            {/* Service Title */}
            <h1 className="service-details-title">
              {serviceData.title_ar || serviceData.title}
            </h1>

            {/* Service Description */}
            <p className="service-details-description">
              {serviceData.about_ar || serviceData.about || 'خدمة متميزة بأحدث التقنيات'}
            </p>

            {/* Service Details Boxes */}
            <div className="service-details-boxes">
              {/* Duration Box */}
              <div className="service-detail-box compact-duration">
                <div className="service-detail-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="service-detail-content">
                  <span className="service-detail-inline">
                  <span className="service-detail-unit">دقيقة</span>

                    <span className="service-detail-value">{serviceData.service_time}</span>
                  </span>
                </div>
              </div>

              {/* Price Box */}
              <div className="service-detail-box vertical-price">
                <div className="service-detail-icon">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="20" height="20" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                </div>
                <div className="service-detail-content">
                  <span className="service-detail-inline">
                    <span className="service-detail-label">السعر</span>
                    <span className="service-detail-value">{hasPrice ? serviceData.price : '0'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <button 
              className="service-book-btn"
              onClick={handleBookNow}
            >
              احجز الآن ←
            </button>
          </div>

          {/* Right Side - Service Image with Overlay */}
          <div className="service-details-image">
            <div className="service-image-container">
              <img 
                src={serviceImage} 
                alt={serviceData.title_ar || serviceData.title}
                className="service-main-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/imge.png';
                }}
              />
              {/* Salon Name Overlay */}
              <div className="salon-name-overlay">
                <div className="salon-name-content">
                  <h2 className="overlay-salon-name">
                    {salonData?.salon_name || 'اسم العيادة'}
                  </h2>
                  <div className="overlay-salon-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Salon Information or Booking Form */}
        {!showBookingForm && salonData && (
          <div className="salon-info-section">
            <h3 className="salon-info-title">معلومات العيادة</h3>
            <div className="salon-info-content">
              {/* Salon Basic Info without large photo */}
              <div className="salon-header">
                <div className="salon-basic-info">
                  <h4 className="salon-name">{salonData.salon_name}</h4>
                  <p className="salon-owner">{salonData.owner_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div className="salon-rating">
                    </div>
                    <div className="salon-price-inline">
                      {serviceData.price && Number(serviceData.price) > 0 ? (
                        <>
                          <span>{serviceData.price}</span>
                          <SaudiRiyalIcon />
                        </>
                      ) : (
                        <span>اتصل للسعر</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Salon Details */}
              <div className="salon-details">
                <div className="salon-info-item">
                  <strong>العنوان:</strong> {salonData.salon_address}
                </div>
                <div className="salon-info-item">
                  <strong>الهاتف:</strong> {salonData.salon_phone}
                </div>
                <div className="salon-info-item">
                  <strong>ساعات العمل:</strong>
                  <div className="salon-hours">
                    <span>الأحد - الخميس: {salonData.mon_fri_from?.slice(0,2)}:{salonData.mon_fri_from?.slice(2,4)} - {salonData.mon_fri_to?.slice(0,2)}:{salonData.mon_fri_to?.slice(2,4)}</span>
                    <span>الجمعة - السبت: {salonData.sat_sun_from?.slice(0,2)}:{salonData.sat_sun_from?.slice(2,4)} - {salonData.sat_sun_to?.slice(0,2)}:{salonData.sat_sun_to?.slice(2,4)}</span>
                  </div>
                </div>
                {salonData.salon_about && (
                  <div className="salon-info-item">
                    <strong>عن العيادة:</strong>
                    <p className="salon-about">{salonData.salon_about}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Section */}
        {showBookingForm && (
          <div className="booking-form-section">
            {/* Progress Indicator */}
            <div className="booking-progress" dir="rtl">
              <div className={`progress-step ${bookingStep >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">الطبيب</div>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${bookingStep >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">التاريخ والوقت</div>
              </div>
            </div>

            {/* Step 1: Choose Doctor */}
            {bookingStep === 1 && (
              <div className="booking-step-content" dir="rtl">
                <div className="step-header">
                  <h3>اختر الطبيب</h3>
                </div>
                
                <div className="staff-list" dir="rtl">
                  {staffData.map((staff) => (
                    <div 
                      key={staff.id} 
                      className={`staff-card ${selectedStaff?.id === staff.id ? 'selected' : ''}`}
                      onClick={() => handleStaffSelect(staff)}
                      dir="rtl"
                    >
                      <img src={staff.photo || '/imge.png'} alt={staff.name} className="staff-photo" />
                      <div className="staff-info">
                        <h4>{staff.name_ar || staff.name}</h4>
                        <p>{staff.classification || 'طبيب عام'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="step-actions" dir="rtl">
                  <button 
                    className="next-btn"
                    onClick={handleNextStep}
                    disabled={!selectedStaff}
                  >
                    ← التالي
                  </button>
                  <button 
                    className="back-btn"
                    onClick={() => setShowBookingForm(false)}
                  >
                    رجوع ←
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {bookingStep === 2 && (
              <div className="booking-step-content" dir="rtl">
                {/* Selected Doctor Info */}
                <div className="selected-doctor-info">
                  <div className="doctor-info-card">
                    <img src={selectedStaff?.photo || '/imge.png'} alt={selectedStaff?.name} className="doctor-photo" />
                    <div className="doctor-details">
                      <div className="doctor-label">الطبيب</div>
                      <div className="doctor-name">{selectedStaff?.name_ar || selectedStaff?.name}</div>
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="date-selection">
                  <label className="section-label">
                    التاريخ
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </label>
                  <input 
                    type="date" 
                    dir="ltr"
                    value={bookingData.date}
                    min={minDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="date-input"
                  />
                  {bookingData.date && (
                    <div className="date-display-mdy">{formatDateMDY(bookingData.date)}</div>
                  )}
                  {/* Quick date chips removed as requested */}
                </div>

                {/* Available Times */}
                {bookingData.date && (
                  <div className="available-times">
                    <label className="section-label">
                      الأوقات المتاحة
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                    </label>
                    {availableTimesError ? (
                      <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                        {availableTimesError}
                      </div>
                    ) : (
                      <div className="time-slots">
                        {Object.entries(availableTimes)
                          .sort((a, b) => Number(a[1]) - Number(b[1]))
                          .map(([label, code]) => (
                            <button
                              key={code}
                              className={`time-slot ${bookingData.timeLabel === label ? 'selected' : ''}`}
                              onClick={() => handleTimeSelect(label, code)}
                            >
                              {label}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Address Selection */}
                <div className="address-selection">
                  <label className="section-label">
                    العنوان
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </label>
                  <select 
                    value={bookingData.address}
                    onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
                    className="address-select"
                  >
                    <option value="">اختر العنوان</option>
                    {addresses.map((addr, idx) => (
                      <option key={`${addr.id}-${idx}`} value={addr.id}>{addr.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="notes-section">
                  <label className="section-label">ملاحظات (اختياري)</label>
                  <textarea 
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="أضف أي ملاحظات...."
                    className="notes-textarea"
                  />
                </div>

                {bookingError && (
                  <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {bookingError}
                  </div>
                )}
                <div className="step-actions" dir="rtl">
                  <button className="confirm-btn" disabled={isSubmittingBooking} onClick={handleConfirmBooking}>
                    {isSubmittingBooking ? '... جاري إنشاء الحجز' : '✓ تأكيد الحجز'}
                  </button>
                  <button 
                    className="back-btn"
                    onClick={() => setBookingStep(1)}
                  >
                    رجوع ←
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>

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
    </div>
  );
};

export default ServiceDetails;