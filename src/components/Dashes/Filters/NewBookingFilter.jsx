import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getSavedLocation, sortClinicsByDistance } from '../../../utils/locationUtils';
import { useToast } from '../../Toast/ToastManager';
import useGeolocation from '../../../hooks/useGeolocation';
import { 
  FaCalendarAlt, 
  FaStethoscope, 
  FaHeadphones, 
  FaUser, 
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClock,
  FaMapPin,
  FaStar,
  FaCheck,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import profileImage from '../../../assets/photo/service.png';
import { hasAvailableStaff, getSalonStatusMessage, validateSalonForBooking } from '../../../utils/clinicChecker';
import './AddressCards.css';
import './SimpleProgressBar.css';

// New booking filter component - Multi-step booking process
const NewBookingFilter = ({ 
  currentBookingStep, 
  setCurrentBookingStep,
  selectedClinic,
  setSelectedClinic,
  selectedDate,
  setSelectedDate,
  currentMonth,
  currentYear,
  goToPreviousMonth,
  goToNextMonth,
  getMonthName,
  showConfirmationModal,
  setShowConfirmationModal,
  setActiveFilter
}) => {
  const { isAuthenticated } = useAuth();
  const { latitude, longitude, address } = useGeolocation();
  const { showSuccess, showError, showWarning } = useToast();

  // Clinics data fetched from API
  const [clinics, setClinics] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const selectedServiceIdsRef = useRef([]);
  
  // Update ref whenever selectedServiceIds changes
  useEffect(() => {
    selectedServiceIdsRef.current = selectedServiceIds;
  }, [selectedServiceIds]);
  
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [clinicStaff, setClinicStaff] = useState([]);
  const [clinicData, setClinicData] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [timesLoading, setTimesLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState({}); // Store availability for each day
  const [daysLoading, setDaysLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [completionOtp, setCompletionOtp] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  
  // User info state
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Pagination state for services
  const [currentServicePage, setCurrentServicePage] = useState(1);
  const servicesPerPage = 10;
  
  // Pagination state for clinics
  const [currentClinicPage, setCurrentClinicPage] = useState(1);
  const clinicsPerPage = 10;
  
  // Pagination state for doctors
  const [currentDoctorPage, setCurrentDoctorPage] = useState(1);
  const doctorsPerPage = 10;

  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      try {
        const res = await fetch('https://ghaimcenter.com/laravel/api/clinics');
        const json = await res.json();
        if (isMounted && json && json.status === 'success' && json.data && Array.isArray(json.data.data)) {
          // Map clinics to clinics structure used by UI
          let mapped = json.data.data.map((clinic) => ({
            // Use clinic_name as the selection key as requested
            id: clinic.clinic_name,
            name: clinic.clinic_name,
            nameEn: clinic.owner_name,
            location: clinic.clinic_address,
            // Keep numeric id for future payload mapping if needed
            clinicId: clinic.id,
            // إضافة إحداثيات العيادة
            latitude: clinic.clinic_lat,
            longitude: clinic.clinic_long
          }));

          // فلترة العيادات حسب allowedClinicIds من localStorage
          const allowedClinicIdsStr = localStorage.getItem('allowedClinicIds');
          if (allowedClinicIdsStr) {
            try {
              const allowedClinicIds = JSON.parse(allowedClinicIdsStr);
              if (Array.isArray(allowedClinicIds) && allowedClinicIds.length > 0) {
                console.log('🔒 Filtering clinics by allowed IDs from localStorage:', allowedClinicIds);
                // تحويل IDs إلى أرقام للمقارنة
                const allowedIds = allowedClinicIds.map(id => parseInt(id));
                mapped = mapped.filter(clinic => allowedIds.includes(clinic.clinicId));
                console.log('🔒 Filtered clinics count:', mapped.length);
                
                // مسح الـ IDs بعد الاستخدام
                localStorage.removeItem('allowedClinicIds');
              }
            } catch (e) {
              console.error('Error parsing allowedClinicIds:', e);
              localStorage.removeItem('allowedClinicIds');
            }
          }

          // ترتيب العيادات حسب المسافة من موقع المستخدم
          const userLocation = getSavedLocation();
          if (userLocation) {
            console.log('🗺️ ترتيب العيادات حسب المسافة من موقع المستخدم');
            mapped = sortClinicsByDistance(mapped, userLocation.latitude, userLocation.longitude);
            
            // إضافة معلومات المسافة للعرض
            mapped = mapped.map(clinic => ({
              ...clinic,
              distanceText: clinic.distance !== undefined && clinic.distance !== Infinity 
                ? `${clinic.distance} كم` 
                : 'غير محدد'
            }));
          }

          setClinics(mapped);
        }
      } catch (e) {
        // Silent fail keeps UI functional with empty list
        console.error('Failed to load clinics', e);
      }
    };
    fetchClinics();
    return () => { isMounted = false; };
  }, []);

  // Load booking data from localStorage and set clinic/doctor automatically
  useEffect(() => {
    if (clinics.length > 0) {
      const bookingDataStr = localStorage.getItem('bookingData');
      if (bookingDataStr) {
        try {
          const bookingData = JSON.parse(bookingDataStr);
          const { doctorId, clinicId, date } = bookingData;
          
          // Find clinic by numeric ID and set it
          if (clinicId) {
            const clinic = clinics.find((c) => c.clinicId === parseInt(clinicId));
            if (clinic) {
              setSelectedClinic(clinic.id); // Set clinic name as selectedClinic uses clinic name
              
              // Fetch staff for the clinic
              if (clinic.clinicId) {
                fetch(`https://ghaimcenter.com/laravel/api/clinics/${clinic.clinicId}/staff`)
                  .then(res => res.json())
                  .then(json => {
                    if (json.status === 'success' && json.data?.staff) {
                      setClinicStaff(json.data.staff);
                      
                      // Set doctor if doctorId is provided
                      if (doctorId) {
                        const doctor = json.data.staff.find((d) => d.id === parseInt(doctorId));
                        if (doctor) {
                          setSelectedDoctorId(doctor.id);
                          setSelectedDoctorName(doctor.name_ar || doctor.name);
                          // Move to step 3 (service selection) since clinic and doctor are selected
                          setCurrentBookingStep(3);
                        }
                      }
                    }
                  })
                  .catch(err => console.error('Error fetching staff:', err));
              }
            }
          }
          
          // Clear booking data from localStorage after using it
          localStorage.removeItem('bookingData');
        } catch (error) {
          console.error('Error parsing booking data:', error);
          localStorage.removeItem('bookingData');
        }
      }
    }
  }, [clinics]);

  // Resolve selected clinic name -> numeric clinicId
  const selectedClinicId = useMemo(() => {
    if (!selectedClinic) return null;
    const match = clinics.find((c) => c.id === selectedClinic);
    return match ? match.clinicId : null;
  }, [selectedClinic, clinics]);

  const completeBooking = useCallback(async () => {
    console.log('🚀 completeBooking called!');
    
    // Use ref to get the latest value
    const currentIds = selectedServiceIdsRef.current;
    console.log('🚀 selectedServiceIds from ref:', currentIds);
    
    try {
      if (!isAuthenticated()) {
        showError('يرجى تسجيل الدخول أولاً');
        return;
      }

      const token = localStorage.getItem('authToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');

      if (!token) {
        showError('يرجى تسجيل الدخول أولاً');
        return;
      }

      // Validate required fields
      if (!userName.trim()) {
        showError('يرجى إدخال الاسم');
        return;
      }

      if (!userPhone.trim()) {
        showError('يرجى إدخال رقم الهاتف');
        return;
      }

      if (!selectedClinicId) {
        showError('يرجى اختيار عيادة صحيحة');
        return;
      }

      console.log('🔍 Selected Service IDs:', currentIds);
      console.log('🔍 Selected Service IDs length:', currentIds.length);

      if (currentIds.length === 0) {
        showError('يرجى اختيار خدمة واحدة على الأقل');
        return;
      }

      // الدكتور اختياري - لا نحتاج للتحقق منه
      // if (!selectedDoctorId) {
      //   showError('يرجى اختيار طبيب');
      //   return;
      // }

      // التاريخ اختياري - لا نحتاج للتحقق منه
      // if (!selectedDate) {
      //   showError('يرجى اختيار تاريخ');
      //   return;
      // }

      // First, create the booking - Match API expectations
      const formattedDate = selectedDate 
        ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
        : null;

      console.log('📊 Booking details:');
      console.log('- selectedClinicId:', selectedClinicId);
      console.log('- selectedServiceIds:', currentIds);
      console.log('- selectedDoctorId:', selectedDoctorId);
      console.log('- currentYear:', currentYear);
      console.log('- currentMonth:', currentMonth);
      console.log('- selectedDate:', selectedDate);
      console.log('- selectedTime:', selectedTime);
      console.log('- formattedDate:', formattedDate);

      // Create multiple bookings - one for each service with the selected doctor (if selected)
      const bookingPromises = [];
      
      for (const serviceId of currentIds) {
        const bookingData = {
          clinics_id: selectedClinicId,
          service_id: serviceId
        };

        // إضافة الاسم ورقم الهاتف
        if (userName.trim()) {
          bookingData.full_name = userName.trim();
        }
        
        if (userPhone.trim()) {
          bookingData.phone = userPhone.trim();
        }

        // إضافة staff_id فقط إذا تم اختيار دكتور
        if (selectedDoctorId) {
          bookingData.staff_id = selectedDoctorId;
        }

        // إضافة التاريخ فقط إذا تم اختياره
        if (formattedDate) {
          bookingData.date = formattedDate;
        }

        // إضافة services_ids فقط إذا كان هناك أكثر من خدمة (الخدمات الإضافية بعد الأولى)
        if (currentIds.length > 1) {
          const remainingServices = currentIds.slice(1);
          bookingData.services_ids = remainingServices;
        }

        // إضافة الوقت فقط إذا تم اختياره
        if (selectedTime) {
          bookingData.time = selectedTime;
        }

        // إضافة معلومات العنوان إذا تم اختياره
        if (selectedAddressId === 'current_location' && latitude && longitude) {
          bookingData.address = address || `${latitude}, ${longitude}`;
          bookingData.latitude = latitude;
          bookingData.longitude = longitude;
        } else if (selectedAddressId && selectedAddressId !== 'current_location') {
          const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId);
          if (selectedAddress) {
            bookingData.address = selectedAddress.address || selectedAddress.title || selectedAddress.name;
          }
        }

        console.log('📤 Creating booking with:', bookingData);

        const bookingPromise = fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });

        bookingPromises.push(bookingPromise);
      }

      // Wait for all bookings to complete
      const responses = await Promise.all(bookingPromises);
      
      // Check if all bookings were successful
      const results = [];
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        console.log(`📥 Booking ${i + 1} response status:`, response.status);

        if (!response.ok) {
          const error = await response.json();
          showError(`خطأ في إنشاء الحجز ${i + 1}: ${error.message || 'حدث خطأ غير متوقع'}`);
          return;
        }

        const result = await response.json();
        results.push(result);
      }

      // Get the first booking ID for display
      const firstBookingId = results[0]?.data?.id || results[0]?.booking_id;

      if (!firstBookingId) {
        showError('لم يتم إنشاء رقم الحجز بشكل صحيح');
        return;
      }

      // Booking created successfully, show success screen
      console.log('✅ Multiple bookings created successfully. Total:', results.length);
      
      // عرض إشعار نجاح
      const successMessage = currentIds.length > 1 
        ? `تم إنشاء ${currentIds.length} حجوزات بنجاح!`
        : 'تم إنشاء الحجز بنجاح!';
      
      showSuccess(successMessage, {
        duration: 6000
      });
      
      // Store doctor name before resetting
      console.log('🔍 Debugging doctor name retrieval:');
      console.log('🔍 selectedDoctorId:', selectedDoctorId);
      console.log('🔍 selectedDoctorId type:', typeof selectedDoctorId);
      console.log('🔍 clinicStaff array:', clinicStaff);
      console.log('🔍 clinicStaff length:', clinicStaff.length);
      console.log('🔍 clinicData:', clinicData);

      // Try to find selected staff with different approaches
      let selectedStaff = null;

      if (clinicStaff.length > 0 && selectedDoctorId) {
        // Try exact match first
        selectedStaff = clinicStaff.find(s => s.id === selectedDoctorId);
        console.log('🔍 Exact match result:', selectedStaff);

        // If no exact match, try string comparison
        if (!selectedStaff) {
          selectedStaff = clinicStaff.find(s => s.id == selectedDoctorId);
          console.log('🔍 String comparison result:', selectedStaff);
        }

        // If still no match, try with different field names
        if (!selectedStaff) {
          selectedStaff = clinicStaff.find(s => s.staff_id === selectedDoctorId);
          console.log('🔍 staff_id field result:', selectedStaff);
        }
      }

      console.log('🔍 Final selectedStaff found:', selectedStaff);

      // Determine doctor name
      let doctorName = 'الطبيب';

      if (selectedStaff) {
        // Doctor was selected from staff list
        doctorName = selectedStaff.name || selectedStaff.staff_name || selectedStaff.full_name || 'الطبيب';
        console.log('👨‍⚕️ Using selected staff name:', doctorName);
      } else if (clinicData?.owner_name) {
        // No staff available, use owner name
        doctorName = clinicData.owner_name;
        console.log('👨‍⚕️ Using owner name as fallback:', doctorName);
      } else {
        console.log('👨‍⚕️ Using default name');
      }
      
      console.log('👨‍⚕️ Final doctor name determined:', doctorName);
      
      setBookingId(firstBookingId);
      setSelectedDoctorName(doctorName);
      setBookingSuccess(true);
      
      // Reset all booking data
      setCurrentBookingStep(1);
      setSelectedClinic(null);
      setSelectedServiceIds([]);
      setSelectedDoctorId(null);
      setSelectedAddressId(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
      setAvailableDays({});
    } catch (error) {
      console.error('Error completing booking:', error);
      showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    }
  }, [selectedClinicId, selectedDoctorId, selectedDate, currentYear, currentMonth, selectedTime, selectedAddressId, userAddresses, clinicStaff, clinicData, isAuthenticated, showError, showSuccess, setBookingId, setSelectedDoctorName, setBookingSuccess, setCurrentBookingStep, setSelectedClinic, setSelectedServiceIds, setSelectedDoctorId, setSelectedAddressId, setSelectedDate, setSelectedTime, setAvailableTimes, setAvailableDays]);

  // Fetch services and staff when clinic changes
  useEffect(() => {
    const loadClinicData = async () => {
      if (!selectedClinicId) {
        setServices([]);
        return;
      }
      try {
        setServicesLoading(true);

        // Fetch clinic data with services and staff in one call
        const res = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${selectedClinicId}`);
        const json = await res.json();

        if (json && json.status === 'success' && json.data) {
          const clinicData = json.data;
          setClinicData(clinicData);

          // Set services from clinic data
          if (clinicData.services && Array.isArray(clinicData.services)) {
            setServices(clinicData.services);
          } else {
            setServices([]);
          }

          // Set staff data
          if (clinicData.staff && Array.isArray(clinicData.staff)) {
            setClinicStaff(clinicData.staff);
            console.log(`Clinic ${selectedClinicId} staff:`, clinicData.staff);
          } else {
            setClinicStaff([]);
            console.log(`Clinic ${selectedClinicId} has no staff members`);
          }
        } else {
          setServices([]);
          setClinicData(null);
        }
      } catch (e) {
        console.error('Failed to load clinic data', e);
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };
    loadClinicData();
  }, [selectedClinicId]);

  // Clear selected services when doctor changes to ensure compatibility (only in step 2)
  useEffect(() => {
    if (selectedDoctorId && currentBookingStep === 2) {
      // Clear selected services when doctor changes (only during service selection step)
      console.log('🔄 Clearing selected services because doctor changed in step 2');
      setSelectedServiceIds([]);
      // Reset to first page when doctor changes
      setCurrentServicePage(1);
    }
  }, [selectedDoctorId, currentBookingStep]);

  // Fetch user addresses
  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        if (!isAuthenticated()) {
          console.log('User not authenticated, skipping addresses fetch');
          return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, skipping addresses fetch');
          return;
        }

        const response = await fetch('https://ghaimcenter.com/laravel/api/user/addresses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data) {
            setUserAddresses(result.data);
            console.log('User addresses loaded:', result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching user addresses:', error);
      }
    };

    fetchUserAddresses();
  }, []);

  // Add new address function
  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      showWarning('يرجى إدخال العنوان');
      return;
    }

    if (!newCity.trim()) {
      showWarning('يرجى إدخال المدينة');
      return;
    }

    if (!isAuthenticated()) {
      showError('يرجى تسجيل الدخول أولاً');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('يرجى تسجيل الدخول أولاً');
      return;
    }

    setAddingAddress(true);
    try {
      // Prepare address payload with dummy data for name and mobile
      const addressPayload = {
        name: 'مستخدم',
        mobile: '0500000000',
        address: newAddress.trim(),
        city: newCity.trim()
      };

      console.log('📤 Sending address payload:', addressPayload);

      // Send address to addresses endpoint (same as ProfileFilter)
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressPayload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Refresh addresses list
          const addressesResponse = await fetch('https://ghaimcenter.com/laravel/api/user/addresses', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (addressesResponse.ok) {
            const addressesResult = await addressesResponse.json();
            if (addressesResult.status === 'success' && addressesResult.data) {
              setUserAddresses(addressesResult.data);
              // Select the newly added address if it's the first one
              if (addressesResult.data.length > 0) {
                // Find the newly added address (last one or match by address text)
                const newAddr = addressesResult.data.find(addr => 
                  addr.address === newAddress.trim() || 
                  addr.title === newAddress.trim() ||
                  addr.name === newAddress.trim()
                ) || addressesResult.data[addressesResult.data.length - 1];
                if (newAddr) {
                  setSelectedAddressId(newAddr.id);
                }
              }
            }
          }

          // Reset form
          setNewAddress('');
          setNewCity('');
          setShowAddAddressForm(false);
          showSuccess('تم إضافة العنوان بنجاح');
        } else {
          showError(result.message || 'حدث خطأ أثناء إضافة العنوان');
        }
      } else {
        const error = await response.json().catch(() => ({ message: 'حدث خطأ أثناء إضافة العنوان' }));
        showError(error.message || 'حدث خطأ أثناء إضافة العنوان');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setAddingAddress(false);
    }
  };

  // Function to check availability for a specific day
  const checkDayAvailability = async (day, month, year, clinicId, doctorId, servicesIds) => {
    try {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let url;
      if (servicesIds.length === 1) {
        // Single service - use service_id parameter
        url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${clinicId}?staff_id=${doctorId}&date=${dateString}&service_id=${servicesIds[0]}`;
      } else {
        // Multiple services - use first service as service_id and rest as services_ids
        const firstServiceId = servicesIds[0];
        const remainingServices = servicesIds.slice(1).join(',');
        url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${clinicId}?staff_id=${doctorId}&date=${dateString}&service_id=${firstServiceId}&services_ids=${remainingServices}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && Object.keys(result.data).length > 0) {
          return true; // Day has available times
        }
      } else if (response.status === 422) {
        // 422 means the date is invalid or not available - treat as unavailable
        return false;
      } else {
        return false;
      }
      return false; // Day has no available times
    } catch (error) {
      console.error(`Error checking availability for day ${day}:`, error);
      return false;
    }
  };

  // Fetch availability for all days in current month when doctor and service are selected
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      if (!selectedDoctorId || selectedServiceIds.length === 0 || !selectedClinic) {
        setAvailableDays({});
        return;
      }

      setDaysLoading(true);
      try {
        const selectedClinicId = clinics.find(clinic => clinic.id === selectedClinic)?.clinicId;
        if (!selectedClinicId) {
          setAvailableDays({});
          return;
        }

        // Check availability only for valid days in current month starting from today
        const availabilityPromises = [];
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Get actual days in month
        const today = new Date();
        const currentDate = new Date(currentYear, currentMonth - 1, 1); // Month is 0-indexed

        // Start from today if current month, otherwise from day 1
        const startDay = (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear())
          ? today.getDate()
          : 1;

        for (let day = startDay; day <= daysInMonth; day++) {
          // Check availability for the selected doctor and all selected services
          
          availabilityPromises.push(
            checkDayAvailability(day, currentMonth, currentYear, selectedClinicId, selectedDoctorId, selectedServiceIds)
          );
        }

        const results = await Promise.all(availabilityPromises);
        const availabilityMap = {};

        results.forEach((isAvailable, index) => {
          const day = startDay + index;
          availabilityMap[day] = isAvailable;
        });

        setAvailableDays(availabilityMap);
      } catch (error) {
        console.error('Error fetching month availability:', error);
        setAvailableDays({});
      } finally {
        setDaysLoading(false);
      }
    };

    fetchMonthAvailability();
  }, [selectedDoctorId, selectedServiceIds, selectedClinic, currentMonth, currentYear, clinics]);

  // Fetch available times when date, doctor, and service are selected
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      // Check if all required data is available
      if (!selectedDate || !selectedDoctorId || selectedServiceIds.length === 0 || !selectedClinic) {
        setAvailableTimes([]);
        setSelectedTime(null);
        return;
      }

      setTimesLoading(true);
      try {
        // Format date as YYYY-MM-DD
        const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        
        // Get the numeric clinic ID from the selected clinic name
        const selectedClinicId = clinics.find(clinic => clinic.id === selectedClinic)?.clinicId;

        if (!selectedClinicId) {
          setAvailableTimes([]);
          return;
        }

        // Use all selected services for time availability
        let url;
        if (selectedServiceIds.length === 1) {
          // Single service - use service_id parameter
          url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${selectedClinicId}?staff_id=${selectedDoctorId}&date=${dateString}&service_id=${selectedServiceIds[0]}`;
        } else {
          // Multiple services - use first service as service_id and rest as services_ids
          const firstServiceId = selectedServiceIds[0];
          const remainingServices = selectedServiceIds.slice(1).join(',');
          url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${selectedClinicId}?staff_id=${selectedDoctorId}&date=${dateString}&service_id=${firstServiceId}&services_ids=${remainingServices}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'success' && result.data) {
            // Convert the times object to array format
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
        setTimesLoading(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedDoctorId, selectedServiceIds, selectedClinic, currentMonth, currentYear, clinics]);

  // Handle service selection with booking_cycle check
  const handleServiceSelection = async (service) => {
    console.log('🔵 handleServiceSelection called for service:', service.id, service.name);
    console.log('🔵 Current selectedServiceIds:', selectedServiceIds);
    
    // Check booking_cycle first
    if (service.booking_cycle !== 1) {
      // Redirect to WhatsApp booking
      try {
        const response = await fetch('https://ghaimcenter.com/laravel/api/contact-data');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const contactData = result.data.find(item => item.prefix === 'contact_data');
          if (contactData && contactData.data.whats_app_number) {
            const whatsappNumber = contactData.data.whats_app_number;
            const serviceName = service.title_ar || service.title || service.name;
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
      showWarning('يرجى التواصل معنا عبر الهاتف لحجز هذه الخدمة');
      return;
    }

    // Normal service selection for booking_cycle = 1
    const isSelected = selectedServiceIds.includes(service.id);
    console.log('🔵 isSelected:', isSelected);
    
    if (isSelected) {
      // Remove from selection
      console.log('🔴 Removing service from selection');
      setSelectedServiceIds(prev => {
        const newIds = prev.filter(id => id !== service.id);
        console.log('🔴 New selectedServiceIds after removal:', newIds);
        return newIds;
      });
    } else {
      // Add to selection
      console.log('🟢 Adding service to selection');
      setSelectedServiceIds(prev => {
        const newIds = [...prev, service.id];
        console.log('🟢 New selectedServiceIds after addition:', newIds);
        return newIds;
      });
    }
  };
  
  // Filter doctors based on available services
  const availableDoctors = useMemo(() => {
    if (!clinicStaff || clinicStaff.length === 0) return [];
    if (!services || services.length === 0) return clinicStaff;
    
    // إذا تم اختيار خدمات، نفلتر الدكاترة بناءً على الخدمات المختارة
    if (selectedServiceIds.length > 0) {
      const staffIdsForSelectedServices = new Set();
      
      // نجمع IDs الدكاترة من الخدمات المختارة فقط
      services.forEach(service => {
        // نتحقق إذا كانت الخدمة من الخدمات المختارة
        if (selectedServiceIds.includes(service.id)) {
          if (service.staffs && service.staffs !== null && service.staffs !== '') {
            // If staffs is a string, parse it as comma-separated or dash-separated IDs
            if (typeof service.staffs === 'string') {
              const separator = service.staffs.includes(',') ? ',' : '-';
              const staffIds = service.staffs.split(separator).map(id => parseInt(id.trim()));
              staffIds.forEach(id => staffIdsForSelectedServices.add(id));
            }
            // If staffs is a number
            else if (typeof service.staffs === 'number') {
              staffIdsForSelectedServices.add(service.staffs);
            }
            // If staffs is an array
            else if (Array.isArray(service.staffs)) {
              service.staffs.forEach(staff => {
                const staffId = typeof staff === 'object' ? staff.id : staff;
                staffIdsForSelectedServices.add(parseInt(staffId));
              });
            }
          }
        }
      });
      
      // نرجع فقط الدكاترة اللي بيقدموا الخدمات المختارة
      return clinicStaff.filter(staff => staffIdsForSelectedServices.has(staff.id));
    }
    
    // إذا لم يتم اختيار خدمات، نعرض كل الدكاترة المتاحين في أي خدمة
    const staffIdsInServices = new Set();
    
    services.forEach(service => {
      if (service.staffs && service.staffs !== null && service.staffs !== '') {
        // If staffs is a string, parse it as comma-separated or dash-separated IDs
        if (typeof service.staffs === 'string') {
          const separator = service.staffs.includes(',') ? ',' : '-';
          const staffIds = service.staffs.split(separator).map(id => parseInt(id.trim()));
          staffIds.forEach(id => staffIdsInServices.add(id));
        }
        // If staffs is a number
        else if (typeof service.staffs === 'number') {
          staffIdsInServices.add(service.staffs);
        }
        // If staffs is an array
        else if (Array.isArray(service.staffs)) {
          service.staffs.forEach(staff => {
            const staffId = typeof staff === 'object' ? staff.id : staff;
            staffIdsInServices.add(parseInt(staffId));
          });
        }
      }
    });
    
    // Filter clinic staff to only include doctors that are in services
    return clinicStaff.filter(staff => staffIdsInServices.has(staff.id));
  }, [clinicStaff, services, selectedServiceIds]);
  
  const bookingServicesFromApi = useMemo(() => {
    if (!services || services.length === 0) return [];
    
    // Filter services based on selected doctor
    let filteredServices = services;
    
    if (selectedDoctorId) {
      filteredServices = services.filter(srv => {
        // If staffs is null or empty, this service is NOT available (hide it)
        if (!srv.staffs || srv.staffs === null || srv.staffs === '') {
          return false;
        }
        
        // If staffs is a string, parse it as comma-separated or dash-separated IDs
        if (typeof srv.staffs === 'string') {
          const separator = srv.staffs.includes(',') ? ',' : '-';
          const staffIds = srv.staffs.split(separator).map(id => parseInt(id.trim()));
          return staffIds.includes(parseInt(selectedDoctorId));
        }
        
        // If staffs is a number, check if it matches
        if (typeof srv.staffs === 'number') {
          return srv.staffs === parseInt(selectedDoctorId);
        }
        
        // If staffs is an array, check if doctor ID is included
        if (Array.isArray(srv.staffs)) {
          return srv.staffs.some(staff => {
            const staffId = typeof staff === 'object' ? staff.id : staff;
            return parseInt(staffId) === parseInt(selectedDoctorId);
          });
        }
        
        return false;
      });
    }
    
    return filteredServices.map((srv) => ({
      id: srv.id,
      name: srv.title_ar || srv.title || 'خدمة',
      subtitle: srv.title_en || '',
      description: srv.about_ar || srv.about || '',
      price: srv.price > 0 ? `${srv.price} ر.س` : 'السعر غير متوفر',
      duration: srv.service_time ? `${srv.service_time} دقيقة` : 'غير محدد',
      clinic: selectedClinic || 'العيادة',
      rating: 4.5,
      discount: srv.discount ? `خصم ${srv.discount}%` : undefined
    }));
  }, [services, selectedClinic, selectedDoctorId]);

  // Calculate paginated services
  const totalServices = bookingServicesFromApi.length;
  const totalPages = Math.ceil(totalServices / servicesPerPage);
  const startIndex = (currentServicePage - 1) * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;
  const paginatedServices = bookingServicesFromApi.slice(startIndex, endIndex);

  // Calculate paginated clinics
  const totalClinics = clinics.length;
  const totalClinicPages = Math.ceil(totalClinics / clinicsPerPage);
  const clinicStartIndex = (currentClinicPage - 1) * clinicsPerPage;
  const clinicEndIndex = clinicStartIndex + clinicsPerPage;
  const paginatedClinics = clinics.slice(clinicStartIndex, clinicEndIndex);

  // Calculate paginated doctors
  const totalDoctors = availableDoctors.length;
  const totalDoctorPages = Math.ceil(totalDoctors / doctorsPerPage);
  const doctorStartIndex = (currentDoctorPage - 1) * doctorsPerPage;
  const doctorEndIndex = doctorStartIndex + doctorsPerPage;
  const paginatedDoctors = availableDoctors.slice(doctorStartIndex, doctorEndIndex);

  // Services data
  const bookingServices = [
    {
      id: 1,
      name: 'حشو الأسنان',
      subtitle: 'علاج الأسنان',
      description: 'حشو تجويف الأسنان بمادة الكومبوزيت',
      price: '200 ر.س',
      duration: '60 دقيقة',
      clinic: 'عيادة 5',
      rating: 4.5
    },
    {
      id: 2,
      name: 'تبييض الأسنان',
      subtitle: 'تقويم الأسنان',
      description: 'علاج تبييض الأسنان الاحترافي',
      price: '300 ر.س',
      duration: '45 دقيقة',
      clinic: 'عيادة 5',
      rating: 4.5
    },
    {
      id: 3,
      name: 'تنظيف الأسنان',
      subtitle: 'علاج الأسنان',
      description: 'تنظيف احترافي للأسنان وإزالة الجير',
      price: '150 ر.س',
      duration: '30 دقيقة',
      clinic: 'عيادة 3',
      rating: 4.5,
      discount: 'خصم 25%'
    }
  ];

  // Doctors data
  const doctors = [
    {
      id: 1,
      name: 'Dr. Test Clinic',
      specialty: 'علاج الأسنان، تقويم الأسنان',
      location: 'Egypt',
      priceRange: 'إلى 300 - 200',
      rating: 4.0,
      image: profileImage
    },
    {
      id: 2,
      name: 'Dr. Sarah Ahmed',
      specialty: 'أخصائية تقويم الأسنان',
      location: 'Cairo',
      priceRange: 'إلى 400 - 250',
      rating: 4.5,
      image: profileImage
    },
    {
      id: 3,
      name: 'Dr. Mohamed Said',
      specialty: 'أخصائي جراحة الأسنان',
      location: 'Alexandria',
      priceRange: 'إلى 500 - 300',
      rating: 4.8,
      image: profileImage
    },
    {
      id: 4,
      name: 'Dr. Nour Ahmed',
      specialty: 'أخصائية تجميل الأسنان',
      location: 'Giza',
      priceRange: 'إلى 600 - 350',
      rating: 4.9,
      image: profileImage
    },
    {
      id: 5,
      name: 'Dr. Youssef Hassan',
      specialty: 'أخصائي علاج الجذور',
      location: 'Port Said',
      priceRange: 'إلى 450 - 280',
      rating: 4.6,
      image: profileImage
    },
    {
      id: 6,
      name: 'Dr. Mariam Ali',
      specialty: 'أخصائية أسنان الأطفال',
      location: 'Sharm El Sheikh',
      priceRange: 'إلى 380 - 220',
      rating: 4.7,
      image: profileImage
    }
  ];

  // Render stars based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="booking-star filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="booking-star partial" />);
    }
    
    return stars;
  };

  return (
    <div className="new-booking-section">
      {/* Header */}
      <div className="booking-header">
        <div className="booking-title-container">
          <h2 className="booking-title">
            <FaCalendarAlt className="booking-icon" />
            حجز موعد جديد
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="booking-content">
        {/* Booking Success Card */}
        {bookingSuccess && (
          <div className="booking-success-card-inline">
            <div className="booking-success-icon">
              <FaCheck />
            </div>
            <h2 className="booking-success-title">تم إنشاء الحجوزات بنجاح!</h2>
            <p className="booking-success-subtitle">
              مع {selectedDoctorName}
            </p>
            <div className="booking-success-id">
              <div className="booking-id-icon">
                <FaCheck />
              </div>
              <span className="booking-id-text">
                {selectedServiceIds.length > 1 
                  ? `تم إنشاء ${selectedServiceIds.length} حجز` 
                  : `رقم الحجز: #${bookingId}`
                }
              </span>
            </div>
            <button 
              className="booking-success-btn"
              onClick={() => {
                setBookingSuccess(false);
                setBookingId(null);
                setCompletionOtp('');
                setSelectedDoctorName('');
                setActiveFilter('لوحة التحكم الرئيسية');
              }}
            >
              العودة للرئيسية
            </button>
          </div>
        )}

        {/* All sections visible when not showing success */}
        {!bookingSuccess && (
          <>
        {/* Step 0: User Information */}
        <div style={{ marginBottom: '32px' }}>
            <h3 className="content-title">معلومات الحجز</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px',
              marginTop: '16px'
            }}>
              {/* Name Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151' 
                }}>
                  الاسم
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="أدخل الاسم"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Phone Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151' 
                }}>
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userPhone}
                  onChange={(e) => {
                    // Allow only numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setUserPhone(value);
                  }}
                  placeholder="أدخل رقم الهاتف"
                  dir="rtl"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    textAlign: 'right',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
        </div>

        {/* Step 1: Choose Clinic */}
        <div style={{ marginBottom: '32px' }}>
            <h3 className="content-title">اختر العيادة</h3>
            <div 
              className="clinics-list clinics-grid"
            >
              {paginatedClinics.map((clinic) => {
                // Check if this is the currently selected clinic and has data
                const isSelected = selectedClinic === clinic.id;
                const currentClinicData = isSelected ? clinicData : null;
                const hasStaff = currentClinicData ? hasAvailableStaff(currentClinicData) : null;
                
                return (
                <div 
                  key={clinic.id}
                    className={`clinic-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedClinic(clinic.id)}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      border: isSelected ? '2px solid #e5e7eb' : '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                      minHeight: '60px',
                      position: 'relative'
                    }}
                  >
                    {/* Status indicator */}
                    {isSelected && hasStaff !== null && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: hasStaff ? '#10b981' : '#f59e0b'
                      }} />
                    )}
                    
                  <div className="clinic-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#f0f9ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#0ea5e9',
                      fontSize: '14px'
                    }}>
                      <FaMapMarkerAlt />
                    </div>
                    <div className="clinic-details" style={{ flex: 1 }}>
                      <h4 className="clinic-name" style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {clinic.name}
                      </h4>
                      <p className="clinic-location" style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                        {clinic.location}
                      </p>
                        {isSelected && hasStaff === true && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#10b981' }}>
                            أطباء متاحون
                          </p>
                        )}
                      </div>
                  </div>
                  <div className="clinic-radio" style={{ marginLeft: '8px' }}>
                    <input 
                      type="radio" 
                      name="clinic" 
                        checked={isSelected}
                      onChange={() => setSelectedClinic(clinic.id)}
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
            
            {/* Clinic Pagination Controls */}
            {totalClinicPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentClinicPage(prev => Math.max(1, prev - 1))}
                  disabled={currentClinicPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: currentClinicPage === 1 ? '#f3f4f6' : 'white',
                    color: currentClinicPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentClinicPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaArrowRight style={{ fontSize: '12px' }} />
                  السابق
                </button>

                {/* Page Numbers */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  {Array.from({ length: totalClinicPages }, (_, i) => i + 1).map(pageNum => {
                    const showPage = 
                      pageNum === 1 || 
                      pageNum === totalClinicPages || 
                      Math.abs(pageNum - currentClinicPage) <= 1;
                    
                    const showEllipsisBefore = pageNum === currentClinicPage - 2 && currentClinicPage > 3;
                    const showEllipsisAfter = pageNum === currentClinicPage + 2 && currentClinicPage < totalClinicPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span key={pageNum} style={{ padding: '0 4px', color: '#9ca3af' }}>
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentClinicPage(pageNum)}
                        style={{
                          minWidth: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: pageNum === currentClinicPage ? 'none' : '1px solid #d1d5db',
                          background: pageNum === currentClinicPage ? '#0ea5e9' : 'white',
                          color: pageNum === currentClinicPage ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: pageNum === currentClinicPage ? '600' : '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentClinicPage(prev => Math.min(totalClinicPages, prev + 1))}
                  disabled={currentClinicPage === totalClinicPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: currentClinicPage === totalClinicPages ? '#f3f4f6' : 'white',
                    color: currentClinicPage === totalClinicPages ? '#9ca3af' : '#374151',
                    cursor: currentClinicPage === totalClinicPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  التالي
                  <FaArrowLeft style={{ fontSize: '12px' }} />
                </button>
              </div>
            )}
          </div>

        {/* Step 2: Choose Service - Only show if clinic is selected */}
        {selectedClinic && (
        <div style={{ marginBottom: '32px' }}>
            <div className="ghym-srv-scope-1">
              <h3 className="content-title ghym-srv-title">
                اختر الخدمات 
                {(() => {
                  console.log('📊 Rendering service counter. selectedServiceIds:', selectedServiceIds);
                  console.log('📊 selectedServiceIds.length:', selectedServiceIds.length);
                  return selectedServiceIds.length > 0 && (
                    <span style={{ 
                      color: '#0ea5e9', 
                      fontSize: '14px', 
                      fontWeight: 'normal',
                      marginRight: '8px'
                    }}>
                      ({selectedServiceIds.length} محدد)
                    </span>
                  );
                })()}
              </h3>
              <p style={{ 
                textAlign: 'center', 
                color: '#6b7280', 
                fontSize: '14px', 
                marginBottom: '16px',
                background: '#f8fafc',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                يمكنك اختيار أكثر من خدمة واحدة
              </p>
            <div className="clinics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px 0' }}>
                {paginatedServices.map((service) => {
                  // Get the original service data for booking_cycle check
                  const originalService = services.find(s => s.id === service.id) || service;
                  
                  return (
                  <div 
                    key={service.id}
                    className={`clinic-card ghym-srv-card ${selectedServiceIds.includes(service.id) ? 'selected' : ''}`}
                    onClick={(e) => {
                      // Only handle click if not clicking on checkbox
                      if (e.target.type !== 'checkbox') {
                        handleServiceSelection(originalService);
                      }
                    }}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '100px'
                    }}
                  >
                    <div className="clinic-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        background: '#f0f9ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#0ea5e9',
                        fontSize: '18px'
                      }}>
                        <FaStethoscope />
                      </div>
                      <div className="clinic-details" style={{ flex: 1 }}>
                        <h4 className="clinic-name" style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {service.name}
                        </h4>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaClock />
                            <span>{service.duration}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaMoneyBillWave />
                            <span>{service.price}</span>
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="clinic-checkbox" style={{ marginLeft: '16px' }}>
                      <input 
                        type="checkbox" 
                        name="service" 
                        checked={selectedServiceIds.includes(service.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleServiceSelection(originalService);
                        }}
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          accentColor: '#3B82F6',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentServicePage(prev => Math.max(1, prev - 1))}
                    disabled={currentServicePage === 1}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: currentServicePage === 1 ? '#f3f4f6' : 'white',
                      color: currentServicePage === 1 ? '#9ca3af' : '#374151',
                      cursor: currentServicePage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FaArrowRight style={{ fontSize: '12px' }} />
                    السابق
                  </button>

                  {/* Page Numbers */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        Math.abs(pageNum - currentServicePage) <= 1;
                      
                      // Show ellipsis
                      const showEllipsisBefore = pageNum === currentServicePage - 2 && currentServicePage > 3;
                      const showEllipsisAfter = pageNum === currentServicePage + 2 && currentServicePage < totalPages - 2;

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={pageNum} style={{ padding: '0 4px', color: '#9ca3af' }}>
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentServicePage(pageNum)}
                          style={{
                            minWidth: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            border: pageNum === currentServicePage ? 'none' : '1px solid #d1d5db',
                            background: pageNum === currentServicePage ? '#0ea5e9' : 'white',
                            color: pageNum === currentServicePage ? 'white' : '#374151',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: pageNum === currentServicePage ? '600' : '500',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentServicePage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentServicePage === totalPages}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: currentServicePage === totalPages ? '#f3f4f6' : 'white',
                      color: currentServicePage === totalPages ? '#9ca3af' : '#374151',
                      cursor: currentServicePage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    التالي
                    <FaArrowLeft style={{ fontSize: '12px' }} />
                  </button>
                </div>
              )}
            </div>
        </div>
        )}

        {/* Step 3: Choose Doctor - Only show if clinic and service are selected */}
        {selectedClinic && selectedServiceIds.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
            <h3 className="content-title">
              اختر الطبيب (اختياري)
            </h3>
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '14px', 
              marginBottom: '16px',
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              يمكنك اختيار طبيب أو تخطي هذه الخطوة
            </p>
            {availableDoctors.length > 0 ? (
            <>
            <div className="clinics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px 0' }}>
                {paginatedDoctors.map((staff) => (
                  <div 
                    key={staff.id}
                    className={`clinic-card ${selectedDoctorId === staff.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDoctorId(staff.id);
                    }}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      border: selectedDoctorId === staff.id ? '2px solid #e5e7eb' : '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '60px'
                  }}
                >
                  <div className="clinic-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#f0f9ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#0ea5e9',
                      fontSize: '14px'
                    }}>
                      <FaStethoscope />
                    </div>
                    <div className="clinic-details" style={{ flex: 1 }}>
                      <h4 className="clinic-name" style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {staff.name || staff.name_ar || 'طبيب'}
                      </h4>
                    </div>
                  </div>
                  <div className="clinic-radio" style={{ marginLeft: '8px' }}>
                    <input 
                      type="radio" 
                      name="doctor" 
                        checked={selectedDoctorId === staff.id}
                        onChange={() => {
                          setSelectedDoctorId(staff.id);
                        }}
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Doctor Pagination Controls */}
            {totalDoctorPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentDoctorPage(prev => Math.max(1, prev - 1))}
                  disabled={currentDoctorPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: currentDoctorPage === 1 ? '#f3f4f6' : 'white',
                    color: currentDoctorPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentDoctorPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaArrowRight style={{ fontSize: '12px' }} />
                  السابق
                </button>

                {/* Page Numbers */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  {Array.from({ length: totalDoctorPages }, (_, i) => i + 1).map(pageNum => {
                    const showPage = 
                      pageNum === 1 || 
                      pageNum === totalDoctorPages || 
                      Math.abs(pageNum - currentDoctorPage) <= 1;
                    
                    const showEllipsisBefore = pageNum === currentDoctorPage - 2 && currentDoctorPage > 3;
                    const showEllipsisAfter = pageNum === currentDoctorPage + 2 && currentDoctorPage < totalDoctorPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span key={pageNum} style={{ padding: '0 4px', color: '#9ca3af' }}>
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentDoctorPage(pageNum)}
                        style={{
                          minWidth: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: pageNum === currentDoctorPage ? 'none' : '1px solid #d1d5db',
                          background: pageNum === currentDoctorPage ? '#0ea5e9' : 'white',
                          color: pageNum === currentDoctorPage ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: pageNum === currentDoctorPage ? '600' : '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentDoctorPage(prev => Math.min(totalDoctorPages, prev + 1))}
                  disabled={currentDoctorPage === totalDoctorPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: currentDoctorPage === totalDoctorPages ? '#f3f4f6' : 'white',
                    color: currentDoctorPage === totalDoctorPages ? '#9ca3af' : '#374151',
                    cursor: currentDoctorPage === totalDoctorPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  التالي
                  <FaArrowLeft style={{ fontSize: '12px' }} />
                </button>
              </div>
            )}
            </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                margin: '16px 0'
              }}>
                <FaStethoscope style={{ fontSize: '2rem', marginBottom: '1rem', color: '#d1d5db' }} />
                <p style={{ margin: '0', fontSize: '16px' }}>
                  لا يوجد أطباء متاحين في هذه العيادة حالياً
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
                  يرجى اختيار عيادة أخرى أو المحاولة لاحقاً
                </p>
              </div>
            )}
        </div>
        )}

        {/* Step 4: Choose Address - Only show if clinic and service are selected */}
        {selectedClinic && selectedServiceIds.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
            <h3 className="content-title">اختر العنوان (اختياري)</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              يمكنك تخطي هذه الخطوة والمتابعة للحجز
            </p>
            
            {/* Current Location Option */}
            {latitude && longitude && address && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: selectedAddressId === 'current_location' ? '2px solid #0ea5e9' : '1px solid #e5e7eb'
              }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAddressId('current_location')}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === 'current_location'}
                    onChange={() => setSelectedAddressId('current_location')}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f0f9ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0ea5e9',
                    fontSize: '16px'
                  }}>
                    <FaMapMarkerAlt />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      موقعي الحالي
                    </h4>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6b7280' 
                    }}>
                      {address}
                    </p>
                  </div>
                  {selectedAddressId === 'current_location' && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#0ea5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      <FaCheck />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Add Address Form */}
            {showAddAddressForm ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    العنوان الجديد
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="اكتب العنوان هنا"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0171bd'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !addingAddress) {
                        handleAddAddress();
                      }
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="اكتب المدينة هنا"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0171bd'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !addingAddress) {
                        handleAddAddress();
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddAddress}
                    disabled={addingAddress || !newAddress.trim() || !newCity.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: addingAddress ? '#9ca3af' : '#0171bd',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: addingAddress || !newAddress.trim() || !newCity.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!addingAddress && newAddress.trim() && newCity.trim()) {
                        e.target.style.backgroundColor = '#015a99';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!addingAddress) {
                        e.target.style.backgroundColor = '#0171bd';
                      }
                    }}
                  >
                    {addingAddress ? 'جاري الحفظ...' : 'حفظ العنوان'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddAddressForm(false);
                      setNewAddress('');
                      setNewCity('');
                    }}
                    disabled={addingAddress}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: addingAddress ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!addingAddress) {
                        e.target.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!addingAddress) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddAddressForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#f0f9ff',
                  color: '#0171bd',
                  border: '2px dashed #0171bd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e0f2fe';
                  e.target.style.borderColor = '#015a99';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f0f9ff';
                  e.target.style.borderColor = '#0171bd';
                }}
              >
                <FaMapMarkerAlt />
                إضافة عنوان جديد
              </button>
            )}

            {/* Addresses List */}
            {userAddresses.length > 0 ? (
              <div className="address-cards-container">
                {userAddresses.map((address) => (
                  <div 
                    key={address.id}
                    className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAddressId(address.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedAddressId(address.id);
                      }
                    }}
                  >
                    <div className="address-card-header">
                      <div className="address-icon">
                        <FaMapMarkerAlt />
                      </div>
                      <div className="address-info">
                        <h4 className="address-title">
                          {address.address || address.title || address.name || 'عنوان'}
                        </h4>
                      </div>
                      <div className="address-radio">
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !showAddAddressForm && (
              <div className="address-empty-state">
                <FaMapPin className="address-empty-icon" />
                <h4 className="address-empty-title">
                  لا توجد عناوين محفوظة
                </h4>
                <p className="address-empty-description">
                  يمكنك إضافة عنوان جديد الآن
                </p>
              </div>
            )}
        </div>
        )}

        {/* Step 5: Choose Date and Time - Only show if clinic and service are selected */}
        {selectedClinic && selectedServiceIds.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
            <h3 className="content-title">اختر التاريخ والوقت</h3>
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '14px', 
              marginBottom: '16px',
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              اختيار الوقت اختياري - يمكنك الحجز بدون تحديد وقت محدد
            </p>
            
            {/* Booking Summary */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#1f2937',
                textAlign: 'center'
              }}>
                ملخص الحجز
              </h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>العيادة:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{selectedClinic}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>الطبيب:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    {clinicStaff.find(s => s.id === selectedDoctorId)?.name || 
                     clinicStaff.find(s => s.id === selectedDoctorId)?.name_ar || 
                     'طبيب محدد'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>الخدمات:</span>
                  <span style={{ fontWeight: '600', color: '#0ea5e9' }}>{selectedServiceIds.length} خدمة</span>
                </div>
                {selectedAddressId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280' }}>العنوان:</span>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px', maxWidth: '200px', textAlign: 'right' }}>
                      {/* selectedAddressId === 'current_location' 
                        ? (address || 'موقعي الحالي')
                        : */ (userAddresses.find(addr => addr.id === selectedAddressId)?.address || 
                           userAddresses.find(addr => addr.id === selectedAddressId)?.title ||
                           userAddresses.find(addr => addr.id === selectedAddressId)?.name ||
                           'عنوان محدد')
                      }
                    </span>
                  </div>
                )}
                <div style={{ 
                  borderTop: '1px solid #e2e8f0', 
                  paddingTop: '8px', 
                  marginTop: '8px',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ color: '#6b7280' }}>إجمالي الحجوزات:</span>
                  <span style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>
                    {selectedServiceIds.length} حجز
                  </span>
                </div>
              </div>
            </div>
            <div className="booking-date-time-content">
              {/* Calendar Card */}
              <div className="booking-calendar-card">
                <div className="booking-calendar-header">
                  <button 
                    className="booking-calendar-nav-btn-small"
                    onClick={goToPreviousMonth}
                  >
                    <FaArrowLeft />
                  </button>
                  <h4 className="booking-calendar-month">
                    {getMonthName(currentMonth)} {currentYear}
                    {daysLoading && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginLeft: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <FaClock style={{ animation: 'spin 1s linear infinite' }} />
                        جاري التحميل...
                      </span>
                    )}
                  </h4>
                  <button 
                    className="booking-calendar-nav-btn-small"
                    onClick={goToNextMonth}
                  >
                    <FaArrowRight />
                  </button>
                </div>
                <div className="booking-calendar-weekdays">
                  <div className="booking-weekday">Sa</div>
                  <div className="booking-weekday">Su</div>
                  <div className="booking-weekday">Mo</div>
                  <div className="booking-weekday">Tu</div>
                  <div className="booking-weekday">We</div>
                  <div className="booking-weekday">Th</div>
                  <div className="booking-weekday">Fr</div>
                </div>
                <div className="booking-calendar-grid">
                  {(() => {
                    // Generate array of days for current month starting from today
                    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                    const today = new Date();
                    const currentMonthDate = new Date(currentYear, currentMonth - 1, 1);
                    const startDay = (currentMonthDate.getMonth() === today.getMonth() && currentMonthDate.getFullYear() === today.getFullYear())
                      ? today.getDate() // Start from today if current month
                      : 1; // Start from 1 for future months

                    const days = [];
                    for (let i = startDay; i <= daysInMonth; i++) {
                      days.push(i);
                    }
                    return days;
                  })().map((day) => {
                    // Check if we have availability data for this day
                    const hasAvailabilityData = availableDays.hasOwnProperty(day);
                    const isAvailable = hasAvailabilityData && availableDays[day] === true;
                    const isUnavailable = hasAvailabilityData && availableDays[day] === false;
                    const isSelected = day === selectedDate;
                    
                    // If we don't have availability data yet, treat as unavailable
                    const isActuallyAvailable = isAvailable;
                    const isActuallyUnavailable = isUnavailable || !hasAvailabilityData;
                    
                    return (
                      <div 
                        key={day}
                        className={`booking-calendar-day ${
                          isSelected ? 'selected' : ''
                        } ${
                          isActuallyUnavailable ? 'unavailable' : ''
                        } ${
                          isActuallyAvailable ? 'available' : ''
                        }`}
                        onClick={() => {
                          // Only allow selection of confirmed available days
                          if (isActuallyAvailable) {
                            setSelectedDate(day);
                          } else {
                            // Show warning for unavailable days
                            console.log(`Day ${day} is not available for booking`);
                            // You can add a toast notification here if needed
                          }
                        }}
                        style={{
                          cursor: isActuallyAvailable ? 'pointer' : 'not-allowed',
                          opacity: isActuallyUnavailable ? 0.4 : 1
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Times Card */}
              <div className="booking-times-card">
                <div className="booking-times-card-header">
                  <div className="booking-times-card-icon">
                    <FaClock />
                  </div>
                  <h4 className="booking-times-card-title">المواعيد المتاحة</h4>
                  <div className="booking-times-card-badge">
                    {availableTimes.length > 0 ? availableTimes.length : 0}
                  </div>
                </div>
                <div className="booking-times-card-content">
                  {timesLoading ? (
                    <div className="booking-loading-times">
                      <FaClock className="booking-loading-icon" />
                      <p className="booking-loading-text">جاري تحميل المواعيد...</p>
                    </div>
                  ) : availableTimes.length > 0 ? (
                    <div className="booking-times-grid">
                      {availableTimes.map((timeSlot) => (
                        <div 
                          key={timeSlot.value}
                          className={`booking-time-slot ${selectedTime === timeSlot.value ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(timeSlot.value)}
                        >
                          {timeSlot.time}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="booking-no-appointments">
                      <FaClock className="booking-no-appointments-icon" />
                      <p className="booking-no-appointments-text">
                        {selectedDate && selectedDoctorId && selectedServiceIds.length > 0 
                          ? (availableDays[selectedDate] === false 
                              ? `لا توجد مواعيد متاحة في ${selectedDate} أكتوبر` 
                              : 'جاري تحميل المواعيد...')
                          : 'يرجى اختيار التاريخ والطبيب والخدمة أولاً'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
        )}
        </>
        )}
      </div>

      {/* Footer with Confirm Button Only */}
      {!bookingSuccess && (
      <div className="booking-footer">
        <button 
          className="confirm-btn"
          onClick={completeBooking}
          disabled={!userName.trim() || !userPhone.trim() || !selectedClinic || selectedServiceIds.length === 0}
          style={{ 
            opacity: (!userName.trim() || !userPhone.trim() || !selectedClinic || selectedServiceIds.length === 0) ? 0.5 : 1,
            cursor: (!userName.trim() || !userPhone.trim() || !selectedClinic || selectedServiceIds.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          تأكيد الحجز <FaCheck className="confirm-icon" />
        </button>
      </div>
      )}

    </div>
  );
};

export default NewBookingFilter;

// Add custom CSS for mobile responsiveness
const styles = `
  @media (max-width: 768px) {
    .clinics-list {
      grid-template-columns: 1fr !important;
    }
  }
  
  @media (max-width: 480px) {
    .clinics-list {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
      padding: 12px 0 !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
