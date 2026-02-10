import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { sendLoginCode, verifyLoginCode } from '../../API/apiService';
import './GhymAuthStyles.css';

const SimpleRegister = () => {
  const [currentStep, setCurrentStep] = useState('phone'); // 'phone', 'otp', 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digits
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const navigate = useNavigate();

  // جلب لوجو الموقع
  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      try {
        setLogoLoading(true);
        const response = await fetch('https://ghaimcenter.com/laravel/api/website-logo');
        const result = await response.json();
        
        if (result.status === true && result.logo) {
          setWebsiteLogo(result.logo);
        }
      } catch (error) {
        console.error('خطأ في جلب لوجو الموقع:', error);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchWebsiteLogo();
  }, []);

  // Timer for resend button
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => timer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle phone input (prevent non-numeric characters)
  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove all non-numeric characters
    setPhoneNumber(value);
    setError(''); // Clear error when user types
  };

  // Validate phone number (Saudi format: 05xxxxxxxx)
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      return { isValid: false, message: 'يُرجى إدخال رقم الهاتف' };
    }

    // Check if contains only numbers
    if (!/^\d+$/.test(phone)) {
      return { isValid: false, message: 'يُرجى إدخال أرقام فقط' };
    }

    // Check Saudi phone number format (05 + 8 digits)
    if (!/^05\d{8}$/.test(phone)) {
      return { isValid: false, message: 'يُرجى إدخال رقم هاتف سعودي صحيح (05xxxxxxxx)' };
    }

    return { isValid: true, message: '' };
  };

  // Send OTP
  const handleSendOTP = async () => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await sendLoginCode(phoneNumber);
      
      if (response.status === 'success') {
        setSuccess('تم إرسال رمز التحقق بنجاح');
        setCurrentStep('otp');
        setResendTimer(60); // 60 seconds countdown
      } else {
        setError(response.message || 'حدث خطأ في إرسال رمز التحقق');
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال. يُرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  // Handle backspace in OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Verify OTP and create account
  const handleVerifyOTP = async (otpCode = null) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('يُرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await verifyLoginCode(phoneNumber, otpToVerify);
      
      if (response.status === 'success') {
        setSuccess('تم إنشاء الحساب بنجاح!');
        setCurrentStep('success');
        
        // Store user data if provided
        if (response.data && response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.message || 'رمز التحقق غير صحيح');
      }
    } catch (error) {
      setError('حدث خطأ في التحقق. يُرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await sendLoginCode(phoneNumber);
      
      if (response.status === 'success') {
        setSuccess('تم إعادة إرسال رمز التحقق');
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']); // Clear OTP fields
      } else {
        setError(response.message || 'حدث خطأ في إعادة الإرسال');
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال. يُرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ghym-auth-container">
      <div className="ghym-auth-header">
        <div className="ghym-auth-header-content">
          <button 
            onClick={() => navigate('/')}
            className="ghym-auth-back-btn"
          >
            <FaArrowLeft className="ghym-auth-back-icon" />
          </button>
          
          <div className="ghym-auth-logo-section">
            {logoLoading ? (
              <div className="ghym-auth-logo-loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <img 
                src={websiteLogo || '/logoo.png'} 
                alt="Logo" 
                className="ghym-auth-logo-img"
                onError={(e) => {
                  e.target.src = '/logoo.png';
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="ghym-auth-main">
        <div className="ghym-auth-card">
          {currentStep === 'phone' && (
            <form className="ghym-auth-form" onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }}>
              <h2 className="ghym-auth-title">إنشاء حساب جديد</h2>
              <p className="ghym-auth-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                أدخل رقم هاتفك لإنشاء حساب جديد
              </p>

              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneInput}
                placeholder="05xxxxxxxx"
                className={`ghym-auth-input ${error ? 'ghym-auth-input-error' : ''}`}
                maxLength="10"
                dir="ltr"
              />

              {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}

              <button
                type="submit"
                disabled={isLoading || !phoneNumber}
                className={`ghym-auth-submit-btn ${isLoading ? 'ghym-auth-loading' : ''}`}
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>

              <div className="ghym-auth-link-section">
                <span className="ghym-auth-text">لديك حساب بالفعل؟</span>
                <a href="/login" className="ghym-auth-link">تسجيل الدخول</a>
              </div>
            </form>
          )}

          {currentStep === 'otp' && (
            <div className="ghym-auth-form">
              <h2 className="ghym-auth-title">تحقق من رقم الهاتف</h2>
              <p className="ghym-auth-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                أدخل رمز التحقق المرسل إلى {phoneNumber}
              </p>

              <div className="ghym-otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="ghym-otp-input"
                    maxLength="1"
                    inputMode="numeric"
                  />
                ))}
              </div>

              {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}

              <button
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.some(digit => !digit)}
                className={`ghym-auth-submit-btn ${isLoading ? 'ghym-auth-loading' : ''}`}
              >
                {isLoading ? 'جاري التحقق...' : 'تحقق وإنشاء الحساب'}
              </button>

              <div className="ghym-resend-container">
                {resendTimer > 0 ? (
                  <p className="ghym-resend-timer">
                    إعادة الإرسال خلال {resendTimer} ثانية
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="ghym-resend-button"
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>

              <button
                onClick={() => setCurrentStep('phone')}
                className="ghym-back-to-phone"
              >
                تغيير رقم الهاتف
              </button>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="ghym-auth-form" style={{ textAlign: 'center' }}>
              <div className="ghym-success-icon">
                <FaCheck />
              </div>
              <h2 className="ghym-auth-title">تم إنشاء الحساب بنجاح!</h2>
              <p className="ghym-auth-text">
                مرحباً بك! سيتم توجيهك إلى الصفحة الرئيسية خلال لحظات...
              </p>
              
              <div className="ghym-success-animation">
                <div className="ghym-loading-spinner"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleRegister;