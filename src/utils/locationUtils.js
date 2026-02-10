// دوال مساعدة للتعامل مع الموقع

/**
 * الحصول على الموقع المحفوظ من localStorage
 * @returns {Object|null} - الموقع المحفوظ أو null
 */
export const getSavedLocation = () => {
  try {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      const parsed = JSON.parse(saved);
      const isRecent = Date.now() - parsed.timestamp < 300000; // 5 دقائق
      
      if (isRecent && parsed.latitude && parsed.longitude) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          address: parsed.address || null,
          timestamp: parsed.timestamp
        };
      }
    }
  } catch (error) {
    console.error('خطأ في قراءة الموقع المحفوظ:', error);
  }
  return null;
};

/**
 * حساب المسافة بين نقطتين (بالكيلومتر)
 * @param {number} lat1 - خط العرض الأول
 * @param {number} lon1 - خط الطول الأول
 * @param {number} lat2 - خط العرض الثاني
 * @param {number} lon2 - خط الطول الثاني
 * @returns {number} - المسافة بالكيلومتر
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // تقريب لرقمين عشريين
};

/**
 * ترتيب العيادات حسب المسافة من موقع المستخدم
 * @param {Array} clinics - قائمة العيادات
 * @param {number} userLat - خط عرض المستخدم
 * @param {number} userLng - خط طول المستخدم
 * @returns {Array} - العيادات مرتبة حسب المسافة
 */
export const sortClinicsByDistance = (clinics, userLat, userLng) => {
  if (!clinics || !userLat || !userLng) return clinics;

  return clinics.map(clinic => {
    // التحقق من وجود إحداثيات العيادة
    const clinicLat = parseFloat(clinic.clinic_lat || clinic.latitude);
    const clinicLng = parseFloat(clinic.clinic_long || clinic.longitude);
    
    if (clinicLat && clinicLng) {
      const distance = calculateDistance(userLat, userLng, clinicLat, clinicLng);
      return { ...clinic, distance };
    }
    
    return { ...clinic, distance: Infinity }; // العيادات بدون إحداثيات في النهاية
  }).sort((a, b) => a.distance - b.distance);
};

/**
 * تحويل الإحداثيات إلى عنوان (يتطلب API خارجي)
 * @param {number} lat - خط العرض
 * @param {number} lng - خط الطول
 * @returns {Promise<string>} - العنوان
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    // يمكن استخدام خدمة مجانية مثل OpenStreetMap Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
    );
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('خطأ في تحويل الإحداثيات:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

/**
 * فلترة العيادات ضمن نطاق معين (بالكيلومتر)
 * @param {Array} clinics - قائمة العيادات
 * @param {number} userLat - خط عرض المستخدم
 * @param {number} userLng - خط طول المستخدم
 * @param {number} maxDistance - أقصى مسافة بالكيلومتر
 * @returns {Array} - العيادات ضمن النطاق
 */
export const filterClinicsByDistance = (clinics, userLat, userLng, maxDistance = 50) => {
  if (!clinics || !userLat || !userLng) return clinics;

  return clinics.filter(clinic => {
    const clinicLat = parseFloat(clinic.clinic_lat || clinic.latitude);
    const clinicLng = parseFloat(clinic.clinic_long || clinic.longitude);
    
    if (!clinicLat || !clinicLng) return true; // إبقاء العيادات بدون إحداثيات
    
    const distance = calculateDistance(userLat, userLng, clinicLat, clinicLng);
    return distance <= maxDistance;
  });
};