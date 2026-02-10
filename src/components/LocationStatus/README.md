# خاصية تحديد الموقع التلقائي

## الوصف
تقوم هذه الخاصية بطلب إذن الوصول لموقع المستخدم تلقائياً عند فتح الموقع، وتستخدم الموقع لترتيب العيادات حسب المسافة.

## المكونات

### 1. useGeolocation Hook
- **الملف**: `src/hooks/useGeolocation.js`
- **الوظيفة**: إدارة طلب الموقع وحفظه في localStorage
- **المميزات**:
  - طلب الموقع تلقائياً عند تحميل الصفحة
  - حفظ الموقع في localStorage لمدة 5 دقائق
  - إعادة المحاولة عند الفشل
  - دقة عالية في تحديد الموقع

### 2. LocationStatus Component
- **الملف**: `src/components/LocationStatus/LocationStatus.jsx`
- **الوظيفة**: عرض حالة طلب الموقع للمستخدم
- **الحالات**:
  - ⏳ جاري تحديد الموقع
  - ✅ تم تحديد الموقع بنجاح
  - ❌ فشل في تحديد الموقع
- **المميزات**:
  - إخفاء تلقائي بعد 10 ثواني من النجاح
  - زر إعادة المحاولة
  - زر الإغلاق اليدوي

### 3. Location Utils
- **الملف**: `src/utils/locationUtils.js`
- **الوظائف**:
  - `getSavedLocation()`: الحصول على الموقع المحفوظ
  - `calculateDistance()`: حساب المسافة بين نقطتين
  - `sortClinicsByDistance()`: ترتيب العيادات حسب المسافة
  - `filterClinicsByDistance()`: فلترة العيادات ضمن نطاق معين
  - `reverseGeocode()`: تحويل الإحداثيات إلى عنوان

## كيفية العمل

### 1. طلب الإذن
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    // نجح الحصول على الموقع
    const { latitude, longitude } = position.coords;
  },
  (error) => {
    // فشل في الحصول على الموقع
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  }
);
```

### 2. حفظ الموقع
```javascript
localStorage.setItem('userLocation', JSON.stringify({
  latitude,
  longitude,
  timestamp: Date.now()
}));
```

### 3. ترتيب العيادات
```javascript
const userLocation = getSavedLocation();
if (userLocation) {
  const sortedClinics = sortClinicsByDistance(
    clinics, 
    userLocation.latitude, 
    userLocation.longitude
  );
}
```

## الاستخدام في المكونات

### في App.js
```javascript
import useGeolocation from './hooks/useGeolocation';
import LocationStatus from './components/LocationStatus/LocationStatus';

function App() {
  const { latitude, longitude } = useGeolocation();
  
  return (
    <div>
      <LocationStatus />
      {/* باقي المحتوى */}
    </div>
  );
}
```

### في مكونات أخرى
```javascript
import { getSavedLocation, sortClinicsByDistance } from '../utils/locationUtils';

const MyComponent = () => {
  const [clinics, setClinics] = useState([]);
  
  useEffect(() => {
    // جلب العيادات من API
    fetchClinics().then(data => {
      const userLocation = getSavedLocation();
      if (userLocation) {
        // ترتيب حسب المسافة
        const sorted = sortClinicsByDistance(
          data, 
          userLocation.latitude, 
          userLocation.longitude
        );
        setClinics(sorted);
      } else {
        setClinics(data);
      }
    });
  }, []);
};
```

## الخصوصية والأمان

### ✅ آمن ومجاني
- لا يتطلب API key
- لا توجد رسوم
- لا يتم إرسال البيانات لخوادم خارجية
- يعمل محلياً في المتصفح

### 🔒 حماية الخصوصية
- يطلب إذن المستخدم أولاً
- يحفظ الموقع محلياً فقط
- ينتهي صلاحية الموقع المحفوظ بعد 5 دقائق
- يمكن للمستخدم رفض الإذن

## المتصفحات المدعومة
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ جميع المتصفحات الحديثة

## الأخطاء الشائعة

### 1. PERMISSION_DENIED
- **السبب**: المستخدم رفض الإذن
- **الحل**: عرض رسالة توضيحية وزر إعادة المحاولة

### 2. POSITION_UNAVAILABLE
- **السبب**: GPS غير متاح أو ضعيف
- **الحل**: المحاولة مرة أخرى أو استخدام دقة أقل

### 3. TIMEOUT
- **السبب**: انتهت مهلة الطلب
- **الحل**: زيادة timeout أو إعادة المحاولة

## التخصيص

### تغيير مدة الحفظ
```javascript
// في useGeolocation.js
const isRecent = Date.now() - parsed.timestamp < 600000; // 10 دقائق
```

### تغيير دقة الموقع
```javascript
{
  enableHighAccuracy: false, // دقة أقل، سرعة أكبر
  timeout: 5000, // 5 ثواني
  maximumAge: 600000 // 10 دقائق cache
}
```

### تخصيص المسافة القصوى
```javascript
const nearbyClinic = filterClinicsByDistance(clinics, lat, lng, 25); // 25 كم
```