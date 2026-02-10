import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: true,
    permission: null
  });

  // دالة لتحويل الإحداثيات إلى عنوان
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // استخراج اسم المدينة والحي من العنوان
        const addressParts = data.display_name.split(',');
        const city = addressParts[0] || '';
        const district = addressParts[1] || '';
        return `${city}${district ? ', ' + district : ''}`.trim();
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('خطأ في تحويل الإحداثيات:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  useEffect(() => {
    // التحقق من دعم المتصفح للموقع
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation غير مدعوم في هذا المتصفح',
        loading: false
      }));
      return;
    }

    // طلب الموقع تلقائياً عند تحميل الصفحة
    const requestLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ تم الحصول على الموقع:', { latitude, longitude });
          
          // تحويل الإحداثيات إلى عنوان
          const address = await reverseGeocode(latitude, longitude);
          console.log('📍 العنوان:', address);
          
          setLocation({
            latitude,
            longitude,
            address,
            error: null,
            loading: false,
            permission: 'granted'
          });

          // حفظ الموقع في localStorage للاستخدام لاحقاً
          localStorage.setItem('userLocation', JSON.stringify({
            latitude,
            longitude,
            address,
            timestamp: Date.now()
          }));
        },
        (error) => {
          console.log('❌ خطأ في الحصول على الموقع:', error);
          
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض إذن الوصول للموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'معلومات الموقع غير متاحة';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة طلب الموقع';
              break;
            default:
              errorMessage = 'حدث خطأ غير معروف';
              break;
          }

          setLocation(prev => ({
            ...prev,
            error: errorMessage,
            loading: false,
            permission: 'denied'
          }));
        },
        {
          enableHighAccuracy: true, // دقة عالية
          timeout: 10000, // 10 ثواني timeout
          maximumAge: 300000 // 5 دقائق cache
        }
      );
    };

    // التحقق من وجود موقع محفوظ مسبقاً
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        const isRecent = Date.now() - parsed.timestamp < 300000; // 5 دقائق
        
        if (isRecent && parsed.latitude && parsed.longitude) {
          console.log('📍 استخدام الموقع المحفوظ:', parsed);
          setLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            address: parsed.address || null,
            error: null,
            loading: false,
            permission: 'granted'
          });
          return;
        }
      } catch (e) {
        console.log('خطأ في قراءة الموقع المحفوظ:', e);
      }
    }

    // طلب الموقع الجديد
    requestLocation();
  }, []);

  // دالة لإعادة طلب الموقع يدوياً
  const refreshLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        setLocation({
          latitude,
          longitude,
          address,
          error: null,
          loading: false,
          permission: 'granted'
        });

        localStorage.setItem('userLocation', JSON.stringify({
          latitude,
          longitude,
          address,
          timestamp: Date.now()
        }));
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          error: 'فشل في تحديث الموقع',
          loading: false,
          permission: 'denied'
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // لا نريد cache عند التحديث اليدوي
      }
    );
  };

  return {
    ...location,
    refreshLocation
  };
};

export default useGeolocation;