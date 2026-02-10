import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';

const Toast = ({ 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'loading'
  duration = 5000, 
  onClose,
  showCloseButton = true,
  icon = null,
  action = null // { text: 'إعادة المحاولة', onClick: () => {} }
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
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