import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaSync, FaTimes } from 'react-icons/fa';
import useGeolocation from '../../hooks/useGeolocation';

const LocationStatus = ({ showDetails = false }) => {
  const { latitude, longitude, address, error, loading, permission, refreshLocation } = useGeolocation();
  const [isVisible, setIsVisible] = useState(true);

  // إخفاء الشريط تلقائياً بعد 10 ثواني من نجاح تحديد الموقع
  useEffect(() => {
    if (latitude && longitude && !error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // 10 ثواني

      return () => clearTimeout(timer);
    }
  }, [latitude, longitude, error]);

  // إذا كان الشريط مخفي
  if (!isVisible) {
    return null;
  }

  // إذا كان التحميل جارياً
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#0369a1'
      }}>
        <FaSpinner className="animate-spin" />
        <span>جارٍ تحديد موقعك تلقائيًا...</span>
      </div>
    );
  }

  // إذا كان هناك خطأ
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#fef2f2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#dc2626'
      }}>
        <FaExclamationTriangle />
        <span>{error}</span>
        <button
          onClick={refreshLocation}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          title="إعادة المحاولة"
        >
          <FaSync />
        </button>
      </div>
    );
  }

  // إذا تم الحصول على الموقع بنجاح
  if (latitude && longitude) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f0fdf4',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#15803d',
        position: 'relative'
      }}>
        <FaMapMarkerAlt />
        <span>تم تحديد موقعك بنجاح</span>
        {address && (
          <span style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>
            - {address}
          </span>
        )}
        {showDetails && (
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            ({latitude.toFixed(4)}, {longitude.toFixed(4)})
          </span>
        )}
        <button
          onClick={refreshLocation}
          style={{
            background: 'none',
            border: 'none',
            color: '#15803d',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          title="تحديث الموقع"
        >
          <FaSync />
        </button>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#15803d',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            marginLeft: '4px'
          }}
          title="إخفاء"
        >
          <FaTimes />
        </button>
      </div>
    );
  }

  return null;
};

export default LocationStatus;