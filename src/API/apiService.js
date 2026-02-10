// API Service - خدمة API بسيطة وفعالة
const API_BASE_URL = 'https://ghaimcenter.com/laravel/api';

/**
 * وظيفة مساعدة لجلب البيانات مع إدارة الأخطاء
 * @param {string} endpoint - نقطة النهاية
 * @param {object} options - خيارات الطلب
 * @returns {Promise} البيانات المسترجعة
 */
const fetchData = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error);
    throw error;
  }
};

/**
 * جلب جميع البيانات من الـ API
 * @returns {Promise} جميع البيانات
 */
export const getAllData = () => fetchData('/');

/**
 * جلب بيانات محددة حسب المعرف
 * @param {string|number} id - المعرف
 * @returns {Promise} البيانات المحددة
 */
export const getDataById = (id) => fetchData(`/${id}`);

/**
 * البحث في البيانات
 * @param {string} query - استعلام البحث
 * @returns {Promise} نتائج البحث
 */
export const searchData = (query) => fetchData(`/search?q=${encodeURIComponent(query)}`);

/**
 * جلب البيانات مع فلترة
 * @param {object} filters - مرشحات البحث
 * @returns {Promise} البيانات المفلترة
 */
export const getFilteredData = (filters) => {
  const params = new URLSearchParams(filters);
  return fetchData(`/?${params.toString()}`);
};

/**
 * جلب بيانات العيادات مع إعدادات الصفحة الرئيسية
 * @returns {Promise} بيانات العيادات وإعدادات الصفحة الرئيسية
 */
export const getClinicsData = () => fetchData('/clinics');

/**
 * جلب خدمات العيادات
 * @returns {Promise} خدمات العيادات
 */
export const getClinicsServices = () => fetchData('/clinics/services');

/**
 * جلب أقسام العيادات
 * @returns {Promise} أقسام العيادات
 */
export const getClinicsCategories = () => fetchData('/clinics/categories');

/**
 * جلب بيانات العروض
 * @returns {Promise} بيانات العروض
 */
export const getOffersData = () => fetchData('/offers');

/**
 * جلب بيانات العروض المباشرة من API
 * @returns {Promise} بيانات العروض المباشرة
 */
export const getOffersDataDirect = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/offers`);
    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }
    const data = await response.json();
    console.log('البيانات المسترجعة من {{baseUrl}}/offers:', data);
    return data;
  } catch (error) {
    console.error('خطأ في جلب بيانات العروض:', error);
    throw error;
  }
};

/**
 * جلب بيانات الأطباء من العيادات
 * @returns {Promise} بيانات الأطباء
 */
export const getDoctorsData = () => fetchData('/clinics/staffs');

/**
 * جلب بيانات المدونة
 * @returns {Promise} بيانات المدونة
 */
export const getBlogsData = () => fetchData('/blogs');

/**
 * جلب بيانات الاتصال
 * @returns {Promise} بيانات الاتصال
 */
export const getContactData = () => fetchData('/contact-data');

/**
 * جلب بيانات صفحة من نحن
 * @returns {Promise} بيانات صفحة من نحن
 */
export const getAboutData = () => fetchData('/about');

/**
 * جلب بيانات البنرات
 * @returns {Promise} بيانات البنرات
 */
export const getBannersData = () => fetchData('/banners');

/**
 * إرسال رمز التحقق OTP
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {Promise} نتيجة إرسال الرمز
 */
export const resendOTP = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في إرسال رمز التحقق:', error);
    throw error;
  }
};

/**
 * التحقق من رمز OTP
 * @param {string} phoneNumber - رقم الهاتف
 * @param {string} otp - رمز التحقق
 * @returns {Promise} نتيجة التحقق
 */
export const verifyPhoneOTP = async (phoneNumber, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        phone_number: phoneNumber,
        otp: otp
      })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في التحقق من الرمز:', error);
    throw error;
  }
};

/**
 * إرسال رمز التحقق لتغيير كلمة المرور (Reset Password)
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {Promise} نتيجة إرسال الرمز
 */
export const sendPasswordChangeOTP = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/rest-password/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في إرسال رمز تغيير كلمة المرور:', error);
    throw error;
  }
};

/**
 * التحقق من رمز OTP لتغيير كلمة المرور
 * @param {string} phoneNumber - رقم الهاتف
 * @param {string} otp - رمز التحقق
 * @returns {Promise} نتيجة التحقق
 */
export const verifyPasswordChangeOTP = async (phoneNumber, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/rest-password/check-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        phone_number: phoneNumber,
        otp: otp
      })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في التحقق من رمز كلمة المرور:', error);
    throw error;
  }
};

/**
 * تغيير كلمة المرور بعد التحقق من OTP
 * @param {string} phoneNumber - رقم الهاتف
 * @param {string} otp - رمز التحقق
 * @param {string} newPassword - كلمة المرور الجديدة
 * @returns {Promise} نتيجة تغيير كلمة المرور
 */
export const changePasswordWithOTP = async (phoneNumber, otp, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/rest-password?phone_number=${phoneNumber}&password=${newPassword}&password_confirmation=${newPassword}&otp=${otp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    throw error;
  }
};

/**
 * جلب بيانات مدونة محددة بالـ ID
 * @param {number} id - معرف المدونة
 * @returns {Promise} بيانات المدونة المحددة
 */
export const getBlogById = (id) => fetchData(`/blogs/${id}`);

/**
 * إرسال رمز تسجيل الدخول/التسجيل
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {Promise} نتيجة إرسال الرمز
 */
export const sendLoginCode = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/send-login-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في إرسال رمز تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * التحقق من رمز تسجيل الدخول وإنشاء الحساب
 * @param {string} phoneNumber - رقم الهاتف
 * @param {string} otp - رمز التحقق
 * @returns {Promise} نتيجة التحقق وإنشاء الحساب
 */
export const verifyLoginCode = async (phoneNumber, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        phone_number: phoneNumber,
        otp: otp
      })
    });

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في التحقق من رمز تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * وظيفة عامة للطلبات المخصصة
 * @param {string} endpoint - نقطة النهاية
 * @param {object} options - خيارات الطلب
 * @returns {Promise} النتيجة
 */
export const customRequest = (endpoint, options = {}) => fetchData(endpoint, options);

// تصدير الوظائف الرئيسية
export default {
  getAllData,
  getDataById,
  searchData,
  getFilteredData,
  getClinicsData,
  customRequest
};