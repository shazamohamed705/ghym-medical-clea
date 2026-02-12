import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';

const Toast = ({ 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'loading'
  duration = 5000, 
  onClose,
  showCloseButton = true,
  icon = null,
  action = null, // { text: 'إعادة المحاولة', onClick: () => {} }
  isCartToast = false,
  serviceData = null,
  onViewCart = null,
  onCheckout = null
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      // Update progress bar
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const decrement = (100 / duration) * 50; // Update every 50ms
          return Math.max(0, prev - decrement);
        });
      }, 50);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  // Custom Cart Toast
  if (isCartToast && serviceData) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '400px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          zIndex: 10000,
          transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
          opacity: isExiting ? 0 : 1,
          transition: 'all 0.3s ease-in-out',
          fontFamily: 'Almarai, sans-serif'
        }}
        dir="rtl"
      >
        {/* Green Progress Bar */}
        <div style={{
          height: '4px',
          background: '#e5e7eb',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#10b981',
            width: `${progress}%`,
            transition: 'width 50ms linear'
          }} />
        </div>

        {/* Header with Success Message */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FaCheck style={{ fontSize: '16px' }} />
            </div>
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {message}
            </span>
          </div>
          {showCloseButton && (
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes style={{ fontSize: '14px' }} />
            </button>
          )}
        </div>

        {/* Service Info */}
        <div style={{
          padding: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* Service Image */}
          <img 
            src={serviceData.image}
            alt={serviceData.title}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              borderRadius: '8px',
              flexShrink: 0
            }}
            onError={(e) => {
              e.target.src = '/1.png';
            }}
          />
          
          {/* Service Details */}
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px',
              lineHeight: '1.4'
            }}>
              {serviceData.title}
            </h4>
            <p style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0171BD',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{serviceData.price}</span>
              <span style={{ fontSize: '14px' }}>ر.س</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <button
            onClick={() => {
              if (onViewCart) onViewCart();
              handleClose();
            }}
            style={{
              padding: '10px 16px',
              background: 'white',
              border: '2px solid #0171BD',
              color: '#0171BD',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f0f9ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span>عرض السلة</span>
          </button>
          
          <button
            onClick={() => {
              if (onCheckout) onCheckout();
              handleClose();
            }}
            style={{
              padding: '10px 16px',
              background: '#0171BD',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#015a99';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#0171BD';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>إتمام الطلب</span>
          </button>
        </div>
      </div>
    );
  }

  // Regular Toast

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      minWidth: '300px',
      maxWidth: '400px',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      opacity: isExiting ? 0 : 1,
      transition: 'all 0.3s ease-in-out',
      backdropFilter: 'blur(10px)'
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '1px solid #059669'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        border: '1px solid #dc2626'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: '1px solid #d97706'
      },
      info: {
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        color: 'white',
        border: '1px solid #0284c7'
      },
      loading: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: 'white',
        border: '1px solid #4f46e5'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    if (icon) return icon;

    const iconStyles = { fontSize: '16px' };

    switch (type) {
      case 'success':
        return <FaCheck style={iconStyles} />;
      case 'error':
        return <FaExclamationTriangle style={iconStyles} />;
      case 'warning':
        return <FaExclamationTriangle style={iconStyles} />;
      case 'info':
        return <FaMapMarkerAlt style={iconStyles} />;
      case 'loading':
        return <FaSpinner className="animate-spin" style={iconStyles} />;
      default:
        return null;
    }
  };

  return (
    <div style={getToastStyles()}>
      {getIcon()}
      <div style={{ flex: 1 }}>
        {message}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          {action.text}
        </button>
      )}
      {showCloseButton && (
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = 0.8;
          }}
        >
          <FaTimes style={{ fontSize: '12px' }} />
        </button>
      )}
    </div>
  );
};

export default Toast;