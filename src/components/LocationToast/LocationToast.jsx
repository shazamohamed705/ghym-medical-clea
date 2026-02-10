import { useEffect, useRef } from 'react';
import { useToast } from '../Toast/ToastManager';
import useGeolocation from '../../hooks/useGeolocation';

const LocationToast = () => {
  const { latitude, longitude, address, error, loading, refreshLocation } = useGeolocation();
  const { showSuccess, showError, showLoading, removeToast } = useToast();
  const loadingToastIdRef = useRef(null);
  const hasShownSuccessRef = useRef(false);
  const hasShownErrorRef = useRef(false);

  useEffect(() => {
    if (loading) {
      // عرض toast التحميل فقط إذا لم يكن موجوداً
      if (!loadingToastIdRef.current) {
        loadingToastIdRef.current = showLoading('جارٍ تحديد موقعك تلقائيًا...', {
          showCloseButton: false
        });
      }
    } else {
      // إزالة toast التحميل إذا كان موجوداً
      if (loadingToastIdRef.current) {
        removeToast(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }

      if (latitude && longitude && !hasShownSuccessRef.current) {
        // نجح تحديد الموقع - عرض مرة واحدة فقط
        hasShownSuccessRef.current = true;
        const message = address 
          ? `تم تحديد موقعك بنجاح - ${address}`
          : 'تم تحديد موقعك بنجاح';
          
        showSuccess(message, {
          duration: 5000,
          action: {
            text: 'تحديث',
            onClick: () => {
              hasShownSuccessRef.current = false;
              hasShownErrorRef.current = false;
              refreshLocation();
            }
          }
        });
      } else if (error && !hasShownErrorRef.current) {
        // فشل في تحديد الموقع - عرض مرة واحدة فقط
        hasShownErrorRef.current = true;
        showError(error, {
          duration: 8000,
          action: {
            text: 'إعادة المحاولة',
            onClick: () => {
              hasShownSuccessRef.current = false;
              hasShownErrorRef.current = false;
              refreshLocation();
            }
          }
        });
      }
    }
  }, [loading, latitude, longitude, address, error]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      if (loadingToastIdRef.current) {
        removeToast(loadingToastIdRef.current);
      }
    };
  }, []);

  // هذا المكون لا يعرض أي شيء مرئي
  return null;
};

export default LocationToast;