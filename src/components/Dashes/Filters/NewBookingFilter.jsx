import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
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
  FaArrowRight,
  FaExclamationTriangle
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

  // Clinics data fetched from API
  const [clinics, setClinics] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
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

  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      try {
        const res = await fetch('https://ghaimcenter.com/laravel/api/clinics');
        const json = await res.json();
        if (isMounted && json && json.status === 'success' && json.data && Array.isArray(json.data.data)) {
          // Map clinics to clinics structure used by UI
          const mapped = json.data.data.map((clinic) => ({
            // Use clinic_name as the selection key as requested
            id: clinic.clinic_name,
            name: clinic.clinic_name,
            nameEn: clinic.owner_name,
            location: clinic.clinic_address,
            // Keep numeric id for future payload mapping if needed
            clinicId: clinic.id
          }));
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
                          // Move to step 2 (service selection) since clinic and doctor are selected
                          setCurrentBookingStep(2);
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

  const completeBooking = async () => {
    try {
      if (!isAuthenticated()) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }

      const token = localStorage.getItem('authToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');

      if (!token) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }

      // Validate required fields
      if (!selectedClinicId) {
        alert('يرجى اختيار عيادة صحيحة');
        return;
      }

      if (!selectedServiceId) {
        alert('يرجى اختيار خدمة');
        return;
      }

      if (!selectedDoctorId) {
        alert('يرجى اختيار طبيب');
        return;
      }

      if (!selectedDate) {
        alert('يرجى اختيار تاريخ');
        return;
      }

      if (!selectedTime) {
        alert('يرجى اختيار وقت');
        return;
      }

      // First, create the booking - Match API expectations
      const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

      console.log('📊 Booking details:');
      console.log('- selectedClinicId:', selectedClinicId);
      console.log('- selectedServiceId:', selectedServiceId);
      console.log('- selectedDoctorId:', selectedDoctorId);
      console.log('- currentYear:', currentYear);
      console.log('- currentMonth:', currentMonth);
      console.log('- selectedDate:', selectedDate);
      console.log('- selectedTime:', selectedTime);
      console.log('- formattedDate:', formattedDate);

      const bookingData = {
        clinics_id: selectedClinicId,
        staff_id: selectedDoctorId,
        service_id: selectedServiceId,
        date: formattedDate,
        time: selectedTime
      };

      console.log('📤 Creating booking with:', bookingData);

      const createResponse = await fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('📥 Create booking response status:', createResponse.status);

      if (!createResponse.ok) {
        const error = await createResponse.json();
        alert(`خطأ في إنشاء الحجز: ${error.message || 'حدث خطأ غير متوقع'}`);
        return;
      }

      const createResult = await createResponse.json();
      const bookingId = createResult.data?.id || createResult.booking_id;

      if (!bookingId) {
        alert('لم يتم إنشاء رقم الحجز بشكل صحيح');
        return;
      }

      // Booking created successfully, show success screen
      console.log('✅ Booking created successfully with ID:', bookingId);
      
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
      
      setBookingId(bookingId);
      setSelectedDoctorName(doctorName);
      setBookingSuccess(true);
      
      // Reset all booking data
      setCurrentBookingStep(1);
      setSelectedClinic(null);
      setSelectedServiceId(null);
      setSelectedDoctorId(null);
      setSelectedAddressId(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
      setAvailableDays({});
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    }
  };

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
      alert('يرجى إدخال العنوان');
      return;
    }

    if (!newCity.trim()) {
      alert('يرجى إدخال المدينة');
      return;
    }

    if (!isAuthenticated()) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    setAddingAddress(true);
    try {
      // Get user data from localStorage or fetch from API
      let userData = null;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }

      // If no user data in localStorage, fetch from API
      if (!userData) {
        const userResponse = await fetch('https://ghaimcenter.com/laravel/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          if (userResult.status === 'success' && userResult.data) {
            userData = userResult.data;
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      }

      // Prepare address payload like in ProfileFilter
      const addressPayload = {
        name: userData?.fullname || userData?.name || '',
        mobile: userData?.phone_number || userData?.phone || '',
        address: newAddress.trim(),
        city: newCity.trim() || userData?.city || ''
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
          alert('تم إضافة العنوان بنجاح');
        } else {
          alert(result.message || 'حدث خطأ أثناء إضافة العنوان');
        }
      } else {
        const error = await response.json().catch(() => ({ message: 'حدث خطأ أثناء إضافة العنوان' }));
        alert(error.message || 'حدث خطأ أثناء إضافة العنوان');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setAddingAddress(false);
    }
  };

  // Function to check availability for a specific day
  const checkDayAvailability = async (day, month, year, clinicId, doctorId, serviceId) => {
    try {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${clinicId}?staff_id=${doctorId}&date=${dateString}&service_id=${serviceId}`;

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && Object.keys(result.data).length > 0) {
          console.log(`Day ${day} (${dateString}) has ${Object.keys(result.data).length} available times`);
          return true; // Day has available times
        }
      } else if (response.status === 422) {
        // 422 means the date is invalid or not available - treat as unavailable
        console.log(`Day ${day} (${dateString}) is not available (422)`);
        return false;
      } else {
        console.log(`Day ${day} (${dateString}) returned status ${response.status}`);
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
      if (!selectedDoctorId || !selectedServiceId || !selectedClinic) {
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
          availabilityPromises.push(
            checkDayAvailability(day, currentMonth, currentYear, selectedClinicId, selectedDoctorId, selectedServiceId)
          );
        }

        const results = await Promise.all(availabilityPromises);
        const availabilityMap = {};

        results.forEach((isAvailable, index) => {
          const day = startDay + index;
          availabilityMap[day] = isAvailable;
        });

        setAvailableDays(availabilityMap);
        console.log('Month availability loaded:', availabilityMap);
      } catch (error) {
        console.error('Error fetching month availability:', error);
        setAvailableDays({});
      } finally {
        setDaysLoading(false);
      }
    };

    fetchMonthAvailability();
  }, [selectedDoctorId, selectedServiceId, selectedClinic, currentMonth, currentYear, clinics]);

  // Fetch available times when date, doctor, and service are selected
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      // Check if all required data is available
      if (!selectedDate || !selectedDoctorId || !selectedServiceId || !selectedClinic) {
        setAvailableTimes([]);
        setSelectedTime(null);
        return;
      }

      setTimesLoading(true);
      try {
        // Format date as YYYY-MM-DD
        const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        
        // Build API URL with dynamic values
        console.log('selectedClinic value:', selectedClinic, 'type:', typeof selectedClinic);
        console.log('selectedDoctorId:', selectedDoctorId, 'type:', typeof selectedDoctorId);
        console.log('selectedServiceId:', selectedServiceId, 'type:', typeof selectedServiceId);
        console.log('dateString:', dateString);

        // Get the numeric clinic ID from the selected clinic name
        const selectedClinicId = clinics.find(clinic => clinic.id === selectedClinic)?.clinicId;
        console.log('selectedClinicId:', selectedClinicId);

        if (!selectedClinicId) {
          console.log('No clinic ID found for selected clinic:', selectedClinic);
          setAvailableTimes([]);
          return;
        }

        const url = `https://ghaimcenter.com/laravel/api/clinics/available_times/${selectedClinicId}?staff_id=${selectedDoctorId}&date=${dateString}&service_id=${selectedServiceId}`;
        
        console.log('Fetching available times from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Available times response:', result);
          
          if (result.status === 'success' && result.data) {
            // Convert the times object to array format
            const timesArray = Object.entries(result.data).map(([time, value]) => ({
              time: time,
              value: value
            }));
            setAvailableTimes(timesArray);
            console.log('Available times loaded:', timesArray);
          } else {
            setAvailableTimes([]);
          }
        } else {
          console.log('Failed to fetch available times');
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
  }, [selectedDate, selectedDoctorId, selectedServiceId, selectedClinic, currentMonth, currentYear, clinics]);

  // Handle service selection with booking_cycle check
  const handleServiceSelection = async (service) => {
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
            window.open(whatsappUrl, '_blank');
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

    // Normal service selection for booking_cycle = 1
    setSelectedServiceId(service.id);
  };
  const bookingServicesFromApi = useMemo(() => {
    if (!services || services.length === 0) return [];
    return services.map((srv) => ({
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
  }, [services, selectedClinic]);

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

        {/* Simple Step Icons Only */}
        <div className="simple-progress-section">
          <div className="simple-step-icons">
            <div className={`simple-step-icon ${currentBookingStep > 1 ? 'completed' : currentBookingStep === 1 ? 'active' : 'inactive'}`}>
              <div className="simple-step-icon-circle">
                {currentBookingStep > 1 ? (
                  <FaCheck className="simple-step-icon-svg" />
                ) : (
                  <FaStethoscope className="simple-step-icon-svg" />
                )}
              </div>
              <span className="simple-step-name">العيادة</span>
            </div>
            <div className={`simple-step-icon ${currentBookingStep > 2 ? 'completed' : currentBookingStep === 2 ? 'active' : 'inactive'}`}>
              <div className="simple-step-icon-circle">
                {currentBookingStep > 2 ? (
                  <FaCheck className="simple-step-icon-svg" />
                ) : (
                  <FaHeadphones className="simple-step-icon-svg" />
                )}
              </div>
              <span className="simple-step-name">الخدمة</span>
            </div>
            <div className={`simple-step-icon ${currentBookingStep > 3 ? 'completed' : currentBookingStep === 3 ? 'active' : 'inactive'}`}>
              <div className="simple-step-icon-circle">
                {currentBookingStep > 3 ? (
                  <FaCheck className="simple-step-icon-svg" />
                ) : (
                  <FaUser className="simple-step-icon-svg" />
                )}
              </div>
              <span className="simple-step-name">الطبيب</span>
            </div>
            <div className={`simple-step-icon ${currentBookingStep > 4 ? 'completed' : currentBookingStep === 4 ? 'active' : 'inactive'}`}>
              <div className="simple-step-icon-circle">
                {currentBookingStep > 4 ? (
                  <FaCheck className="simple-step-icon-svg" />
                ) : (
                  <FaMapMarkerAlt className="simple-step-icon-svg" />
                )}
              </div>
              <span className="simple-step-name">العنوان</span>
            </div>
            <div className={`simple-step-icon ${currentBookingStep > 5 ? 'completed' : currentBookingStep === 5 ? 'active' : 'inactive'}`}>
              <div className="simple-step-icon-circle">
                {currentBookingStep > 5 ? (
                  <FaCheck className="simple-step-icon-svg" />
                ) : (
                  <FaCalendarAlt className="simple-step-icon-svg" />
                )}
              </div>
              <span className="simple-step-name">الموعد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="booking-content">
        {/* Step 1: Choose Clinic */}
        {currentBookingStep === 1 && !bookingSuccess && (
          <>
            <h3 className="content-title">اختر العيادة</h3>
            <div className="clinics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px 0' }}>
              {clinics.map((clinic) => {
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
          </>
        )}

        {/* Booking Success Card */}
        {bookingSuccess && (
          <div className="booking-success-card-inline">
            <div className="booking-success-icon">
              <FaCheck />
            </div>
            <h2 className="booking-success-title">تم الحجز بنجاح!</h2>
            <p className="booking-success-subtitle">
              مع {selectedDoctorName}
            </p>
            <div className="booking-success-id">
              <div className="booking-id-icon">
                <FaCheck />
              </div>
              <span className="booking-id-text">رقم الحجز: #{bookingId}</span>
            </div>
            <button 
              className="booking-success-btn"
              onClick={() => {
                setBookingSuccess(false);
                setBookingId(null);
                setCompletionOtp('');
                setSelectedDoctorName('');
                setActiveFilter('الرئيسية');
              }}
            >
              العودة للرئيسية
            </button>
          </div>
        )}

        {/* Step 2: Choose Service */}
        {currentBookingStep === 2 && (
          <>
            <div className="ghym-srv-scope-1">
              <h3 className="content-title ghym-srv-title">اختر الخدمة</h3>
              <div className="clinics-list ghym-srv-services-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px 0' }}>
                {(bookingServicesFromApi.length > 0 ? bookingServicesFromApi : bookingServices).map((service) => {
                  // Get the original service data for booking_cycle check
                  const originalService = services.find(s => s.id === service.id) || service;
                  
                  return (
                  <div 
                    key={service.id}
                    className={`clinic-card ghym-srv-card ${selectedServiceId === service.id ? 'selected' : ''}`}
                    onClick={() => handleServiceSelection(originalService)}
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
                    <div className="clinic-radio" style={{ marginLeft: '16px' }}>
                      <input 
                        type="radio" 
                        name="service" 
                        checked={selectedServiceId === service.id}
                        onChange={() => handleServiceSelection(originalService)}
                        style={{ width: '20px', height: '20px' }}
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Choose Doctor */}
        {currentBookingStep === 3 && (
          <>
            <h3 className="content-title">اختر الطبيب</h3>
            {clinicStaff.length > 0 ? (
            <div className="clinics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px 0' }}>
                {clinicStaff.map((staff) => (
                  <div 
                    key={staff.id}
                    className={`clinic-card ${selectedDoctorId === staff.id ? 'selected' : ''}`}
                    onClick={() => {
                      console.log('🔘 Doctor selected:', staff);
                      console.log('🔘 Setting selectedDoctorId to:', staff.id);
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
                      <p className="clinic-location" style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                          {staff.specialty || staff.specialty_ar || 'تخصص غير محدد'}
                      </p>
                    </div>
                  </div>
                  <div className="clinic-radio" style={{ marginLeft: '8px' }}>
                    <input 
                      type="radio" 
                      name="doctor" 
                        checked={selectedDoctorId === staff.id}
                        onChange={() => {
                          console.log('🔘 Radio button clicked for doctor:', staff);
                          console.log('🔘 Setting selectedDoctorId to:', staff.id);
                          setSelectedDoctorId(staff.id);
                        }}
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
          </>
        )}

        {/* Step 4: Choose Address */}
        {currentBookingStep === 4 && (
          <>
            <h3 className="content-title">اختر العنوان (اختياري)</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              يمكنك تخطي هذه الخطوة والمتابعة للحجز
            </p>
            
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
          </>
        )}

        {/* Step 5: Choose Date and Time */}
        {currentBookingStep === 5 && (
          <>
            <h3 className="content-title">اختر التاريخ والوقت</h3>
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
                        {selectedDate && selectedDoctorId && selectedServiceId 
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
          </>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="booking-footer">
        {currentBookingStep > 1 && (
          <button 
            className="booking-previous-btn"
            onClick={() => setCurrentBookingStep(currentBookingStep - 1)}
          >
            السابق <FaArrowRight className="booking-previous-icon" />
          </button>
        )}
        {currentBookingStep < 5 && (
          <button 
            className="next-btn"
            onClick={() => setCurrentBookingStep(currentBookingStep + 1)}
            disabled={
              (currentBookingStep === 1 && !selectedClinic) ||
              (currentBookingStep === 2 && !selectedServiceId) ||
              (currentBookingStep === 3 && clinicStaff.length > 0 && !selectedDoctorId)
              // Removed step 4 validation to allow skipping address selection
            }
            style={{
              opacity: (
                (currentBookingStep === 1 && !selectedClinic) ||
                (currentBookingStep === 2 && !selectedServiceId) ||
                (currentBookingStep === 3 && clinicStaff.length > 0 && !selectedDoctorId)
              ) ? 0.5 : 1,
              cursor: (
                (currentBookingStep === 1 && !selectedClinic) ||
                (currentBookingStep === 2 && !selectedServiceId) ||
                (currentBookingStep === 3 && clinicStaff.length > 0 && !selectedDoctorId)
              ) ? 'not-allowed' : 'pointer'
            }}
          >
            التالي <FaArrowLeft className="next-icon" />
          </button>
        )}
        {currentBookingStep === 5 && (
          <button 
            className="confirm-btn"
            onClick={completeBooking}
            disabled={!selectedDate || !selectedTime}
            style={{ 
              opacity: (selectedDate && selectedTime) ? 1 : 0.5,
              cursor: (selectedDate && selectedTime) ? 'pointer' : 'not-allowed'
            }}
          >
            تأكيد الحجز <FaCheck className="confirm-icon" />
          </button>
        )}
      </div>


    </div>
  );
};

export default NewBookingFilter;

