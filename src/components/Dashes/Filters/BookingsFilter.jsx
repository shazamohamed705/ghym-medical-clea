import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  FaStethoscope, 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle,
  FaEye,
  FaTrash,
  FaSync
} from 'react-icons/fa';

// Bookings filter component - User's bookings history
const BookingsFilter = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [staffData, setStaffData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // OTP state for verification
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [bookingToVerify, setBookingToVerify] = useState(null);

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      if (!isAuthenticated()) {
        console.error('User not authenticated');
        return;
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setBookings(data.data.bookings);
        // Fetch staff data for each unique clinic in parallel for performance
        const uniqueClinicIds = [...new Set(data.data.bookings.map(booking => booking.clinics_id).filter(Boolean))];
        const fetches = uniqueClinicIds.map((clinicId) => fetchClinicData(clinicId));
        await Promise.all(fetches);

        // إرسال حدث تحديث عدد الحجوزات
        window.dispatchEvent(new CustomEvent('bookingsCountUpdated', {
          detail: { count: data.data.bookings.length }
        }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff data by clinic ID
  const fetchClinicData = async (clinicId) => {
    try {
      if (!isAuthenticated()) return;

      const token = localStorage.getItem('authToken');
      if (!token || !clinicId) return;

      const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${clinicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const clinicData = await response.json();
        setStaffData(prev => ({
          ...prev,
          [clinicId]: clinicData.data
        }));
      }
    } catch (error) {
      console.error('Error fetching clinic data:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  // Handle view booking details
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  // Delete booking
  const handleDeleteBooking = async (booking) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!booking?.id) return;
      const res = await fetch(`https://ghaimcenter.com/laravel/api/user/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        // Update UI optimistically
        setBookings(prev => prev.filter(b => b.id !== booking.id));
        if (selectedBooking?.id === booking.id) {
          setShowModal(false);
          setSelectedBooking(null);
        }
      } else {
        console.error('Failed to delete booking');
      }
    } catch (e) {
      console.error('Error deleting booking:', e);
    }
  };

  // Open OTP popup for verification
  const handleOpenVerify = (booking) => {
    setBookingToVerify(booking);
    setOtpCode('');
    setOtpError('');
    setShowOtpPopup(true);
  };

  const handleCloseVerify = () => {
    setShowOtpPopup(false);
    setOtpCode('');
    setOtpError('');
    setBookingToVerify(null);
  };

  const handleSubmitVerify = async () => {
    if (!otpCode || !bookingToVerify) {
      setOtpError('يرجى إدخال كود التحقق');
      return;
    }
    try {
      setOtpSubmitting(true);
      setOtpError('');
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/bookings/complete-book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ booking_id: bookingToVerify.id, completion_otp: otpCode })
      });

      if (response.ok) {
        await fetchBookings();
        handleCloseVerify();
      } else {
        const data = await response.json().catch(() => ({}));
        setOtpError(data?.message || 'فشل التحقق من الكود');
      }
    } catch (error) {
      setOtpError('حدث خطأ أثناء التحقق. حاول مرة أخرى');
    } finally {
      setOtpSubmitting(false);
    }
  };

  // Get doctor name from staff data
  const getDoctorName = (booking) => {
    const clinicInfo = staffData[booking.clinics_id];
    if (!clinicInfo) return 'الطبيب';

    if (clinicInfo.staff && Array.isArray(clinicInfo.staff) && booking.staff_id) {
      const selectedStaff = clinicInfo.staff.find(s => s.id === booking.staff_id);
      if (selectedStaff) {
        return selectedStaff.name || selectedStaff.staff_name || selectedStaff.full_name || 'الطبيب';
      }
    }

    return clinicInfo.owner_name || 'الطبيب';
  };

  // Get clinic name
  const getClinicName = (clinicId) => {
    const clinicInfo = staffData[clinicId];
    return clinicInfo?.name || clinicInfo?.clinic_name || clinicInfo?.owner_name || 'عيادة غير محددة';
  };

  // Resolve service name from booking using clinic services by ID
  const getServiceName = (booking) => {
    const clinicInfo = staffData[booking.clinics_id];
    const serviceId = booking.service_id || booking.serviceId;
    if (clinicInfo?.services && Array.isArray(clinicInfo.services) && serviceId) {
      const svc = clinicInfo.services.find((s) => s.id === serviceId);
      if (svc) return svc.title_ar || svc.title || svc.name || 'الخدمة';
    }
    return booking.services || booking.service_name || 'الخدمة';
  };

  // Get status info
  const getStatusInfo = (status) => {
    if (status === 1) {
      return { text: 'مؤكد', color: 'green' };
    } else {
      return { text: 'معلق', color: 'yellow' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'غير محدد';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="bookings-container">
        <div className="bookings-header">
          <h2 className="bookings-title">حجوزاتي</h2>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>جاري تحميل الحجوزات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      {/* Header */}
      <div className="bookings-header">
        <div className="bookings-title-section">
          <h2 className="bookings-title">حجوزاتي</h2>
          <span className="bookings-count">{bookings.length} حجز</span>
        </div>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSync className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
          {refreshing ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      {/* Bookings Cards */}
      <div className="bookings-cards-list">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-content">
                  <div className="booking-service-section">
                    <div className="service-icon">
                      <FaStethoscope />
                    </div>
                    <div className="service-details">
                      <h4 className="clinic-name">{getClinicName(booking.clinics_id)}</h4>
                      <p className="service-name">{getServiceName(booking)}</p>
                    </div>
                  </div>
                  
                  <div className="booking-datetime">
                    <div className="date-info">
                      <FaCalendarAlt className="date-icon" />
                      <span className="date-text">{formatDate(booking.date)}</span>
                    </div>
                    <div className="time-info">
                      <FaClock className="time-icon" />
                      <span className="time-text">{formatTime(booking.time)}</span>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  <button 
                    className="view-btn-white"
                    onClick={() => handleViewBooking(booking)}
                  >
                    <FaEye />
                    عرض
                  </button>
                  <button 
                    className="verify-btn-dashboard"
                    onClick={() => handleOpenVerify(booking)}
                  >
                    <FaCheckCircle />
                    تحقق
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteBooking(booking)}
                  >
                    <FaTrash />
                    حذف
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-content">
            <FaCalendarAlt className="empty-icon" />
            <div className="empty-text">
              <div className="empty-title">لا توجد حجوزات حالياً</div>
              <div className="empty-subtitle">ستظهر حجوزاتك هنا عند إنشائها</div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details - Desktop Modal */}
      {showModal && selectedBooking && (
        <div className="hidden md:fixed md:inset-0 md:bg-black md:bg-opacity-50 md:flex md:items-center md:justify-center md:z-50 md:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 font-['IBM_Plex_Sans_Arabic']">تفاصيل الحجز</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTrash size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaStethoscope className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-600 font-semibold">الخدمة</div>
                    <div className="text-gray-900 font-medium break-words text-sm">{selectedBooking.services}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-600 font-semibold">الطبيب</div>
                    <div className="text-gray-900 font-medium break-words text-sm">{getDoctorName(selectedBooking)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <FaStethoscope className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-600 font-semibold">العيادة</div>
                    <div className="text-gray-900 font-medium break-words text-sm">{getClinicName(selectedBooking.clinics_id)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <FaCalendarAlt className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-600 font-semibold">التاريخ والوقت</div>
                    <div className="text-gray-900 font-medium break-words text-sm">{formatDate(selectedBooking.date)} - {formatTime(selectedBooking.time)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getStatusInfo(selectedBooking.status).color === 'green' ? 'bg-green-500' :
                    getStatusInfo(selectedBooking.status).color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}>
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-600 font-semibold">الحالة</div>
                    <div className="text-gray-900 font-medium break-words text-sm">{getStatusInfo(selectedBooking.status).text}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold font-['IBM_Plex_Sans_Arabic']"
              >
                إغلاق
              </button>
              <button
                onClick={() => handleDeleteBooking(selectedBooking)}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold font-['IBM_Plex_Sans_Arabic'] active:scale-95"
              >
                <FaTrash className="inline ml-2" />
                حذف الحجز
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details - Mobile Inline */}
      {showModal && selectedBooking && (
        <div className="md:hidden w-full mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['IBM_Plex_Sans_Arabic']">تفاصيل الحجز</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTrash size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl min-h-[80px]">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaStethoscope className="text-white text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 font-semibold">الخدمة</div>
                  <div className="text-gray-900 font-medium break-words text-sm leading-tight">{selectedBooking.services}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl min-h-[80px]">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-white text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 font-semibold">الطبيب</div>
                  <div className="text-gray-900 font-medium break-words text-sm leading-tight">{getDoctorName(selectedBooking)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl min-h-[80px]">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaStethoscope className="text-white text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 font-semibold">العيادة</div>
                  <div className="text-gray-900 font-medium break-words text-sm leading-tight">{getClinicName(selectedBooking.clinics_id)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl min-h-[80px]">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCalendarAlt className="text-white text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 font-semibold">التاريخ والوقت</div>
                  <div className="text-gray-900 font-medium break-words text-sm leading-tight">{formatDate(selectedBooking.date)} - {formatTime(selectedBooking.time)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl min-h-[80px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  getStatusInfo(selectedBooking.status).color === 'green' ? 'bg-green-500' :
                  getStatusInfo(selectedBooking.status).color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  <FaCheckCircle className="text-white text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 font-semibold">الحالة</div>
                  <div className="text-gray-900 font-medium break-words text-sm leading-tight">{getStatusInfo(selectedBooking.status).text}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => handleDeleteBooking(selectedBooking)}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold font-['IBM_Plex_Sans_Arabic'] active:scale-95"
              >
                <FaTrash className="inline ml-2" />
                حذف الحجز
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold font-['IBM_Plex_Sans_Arabic']"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification - Desktop Popup */}
      {showOtpPopup && (
        <div className="hidden md:fixed md:inset-0 md:bg-black md:bg-opacity-50 md:flex md:items-center md:justify-center md:z-50 md:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 font-['IBM_Plex_Sans_Arabic']">إدخال كود التحقق</h3>
              <button
                onClick={handleCloseVerify}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTrash size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-3 mb-6">
                <label className="text-sm font-semibold text-gray-900 font-['IBM_Plex_Sans_Arabic']">
                  الرجاء إدخال كود التحقق المرسل إليك
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="أدخل الكود هنا"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-semibold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-['IBM_Plex_Sans_Arabic']"
                />
                {otpError && (
                  <div className="text-red-500 font-semibold text-sm">{otpError}</div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseVerify}
                  disabled={otpSubmitting}
                  className="flex-1 px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold font-['IBM_Plex_Sans_Arabic']"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmitVerify}
                  disabled={otpSubmitting || !otpCode}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold font-['IBM_Plex_Sans_Arabic'] active:scale-95"
                >
                  {otpSubmitting ? 'جاري التحقق...' : 'تحقق'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification - Mobile Inline */}
      {showOtpPopup && (
        <div className="md:hidden w-full mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['IBM_Plex_Sans_Arabic']">إدخال كود التحقق</h3>
              <button
                onClick={handleCloseVerify}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTrash size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <label className="text-sm font-semibold text-gray-900 font-['IBM_Plex_Sans_Arabic']">
                الرجاء إدخال كود التحقق المرسل إليك
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="أدخل الكود هنا"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-semibold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-['IBM_Plex_Sans_Arabic']"
              />
              {otpError && (
                <div className="text-red-500 font-semibold text-sm">{otpError}</div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmitVerify}
                disabled={otpSubmitting || !otpCode}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold font-['IBM_Plex_Sans_Arabic'] active:scale-95"
              >
                {otpSubmitting ? 'جاري التحقق...' : 'تحقق'}
              </button>
              <button
                onClick={handleCloseVerify}
                disabled={otpSubmitting}
                className="w-full px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold font-['IBM_Plex_Sans_Arabic']"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsFilter;

