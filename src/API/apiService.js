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
 * جلب بيانات صفحة من نحن
 * @returns {Promise} بيانات صفحة من نحن
 */
export const getAboutData = () => fetchData('/about');

/**
 * جلب بيانات مدونة محددة بالـ ID
 * @param {number} id - معرف المدونة
 * @returns {Promise} بيانات المدونة المحددة
 */
export const getBlogById = (id) => fetchData(`/blogs/${id}`);

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