import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { syncLocalCartWithAPI } from '../../utils/cartUtils';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';
import '../Register/GhymAuthStyles.css';

const GhymAuthLogin = () => {
  const [currentStep, setCurrentStep] = useState('phone'); // 'phone', 'otp', 'success'
  const [formData, setFormData] = useState({
    phone: ''
  });
  const [otpData, setOtpData] = useState({
    phoneNumber: '',
    otp: ['', '', '', '', '', ''], // Array for 6 digits
    isLoading: false,
    error: '',
    success: '',
    resendTimer: 0 // Timer for resend button
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, message: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'تسجيل الدخول - مجمع غيم الطبي';
  }, []);

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

  // Function to handle phone input (prevent non-numeric characters)
  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove all non-numeric characters
    setFormData(prev => ({
      ...prev,
      phone: value
    }));

    // Validate the cleaned phone number
    validatePhoneNumber(value);
  };

  // Function to validate phone number (Saudi format: 05xxxxxxxx)
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      setPhoneValidation({ isValid: true, message: '' });
      return;
    }

    // Check Saudi phone number format (05 + 8 digits)
    if (!/^05\d{8}$/.test(phone)) {
      setPhoneValidation({
        isValid: false,
        message: 'يرجى إدخال رقم هاتف سعودي صحيح (05xxxxxxxx)'
      });
      return;
    }

    setPhoneValidation({
      isValid: true,
      message: 'رقم الهاتف صحيح ✅'
    });
  };

  // Handle form submission with API integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!phoneValidation.isValid || !formData.phone) {
      alert('يرجى إدخال رقم هاتف سعودي صحيح (05xxxxxxxx)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Send OTP using the send-login-code endpoint
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/send-login-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formData.phone
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Success - move to OTP verification step
        setCurrentStep('otp');
        setOtpData(prev => ({
          ...prev,
          phoneNumber: formData.phone,
          success: 'تم إرسال رمز التحقق إلى رقم هاتفك',
          resendTimer: 60 // Start timer
        }));
        
        // Start countdown timer
        const timer = setInterval(() => {
          setOtpData(prev => {
            if (prev.resendTimer <= 1) {
              clearInterval(timer);
              return { ...prev, resendTimer: 0 };
            }
            return { ...prev, resendTimer: prev.resendTimer - 1 };
          });
        }, 1000);
      } else {
        // API returned error
        const errorMessage = result.message || 'حدث خطأ أثناء إرسال رمز التحقق';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      alert('حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    const newOtp = [...otpData.otp];
    newOtp[index] = value;
    
    setOtpData(prev => ({
      ...prev,
      otp: newOtp,
      error: ''
    }));

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle OTP verification and login
  const handleOtpVerification = async (e) => {
    e.preventDefault();
    
    const otpString = otpData.otp.join('');
    if (otpString.length !== 6) {
      setOtpData(prev => ({
        ...prev,
        error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام'
      }));
      return;
    }

    setOtpData(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      // Use login-bycode endpoint for OTP verification and login
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/login-bycode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: otpData.phoneNumber,
          otp: otpString
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Print the token to console
        console.log('Token:', result.data.token);

        // Use AuthContext to save user data
        login({
          name: result.data.user.fullname || result.data.user.name,
          email: result.data.user.email,
          phone: result.data.user.phone_number,
          id: result.data.user.id
        }, result.data.token);

        // مزامنة السلة المحلية مع API
        try {
          const syncResult = await syncLocalCartWithAPI(result.data.token);
          console.log('🔄 Cart sync result:', syncResult);
          
          if (syncResult.success && syncResult.synced > 0) {
            console.log(`✅ تم مزامنة ${syncResult.synced} عنصر من السلة المحلية`);
          }
        } catch (syncError) {
          console.error('❌ Error syncing cart:', syncError);
        }

        // Show success popup then navigate
        setCurrentStep('success');
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setOtpData(prev => ({
          ...prev,
          error: result.message || 'رمز التحقق غير صحيح'
        }));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpData(prev => ({
        ...prev,
        error: 'حدث خطأ في التحقق من الرمز'
      }));
    } finally {
      setOtpData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setOtpData(prev => ({ ...prev, isLoading: true, error: '', success: '' }));

    try {
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/send-login-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: otpData.phoneNumber
        })
      });

      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setOtpData(prev => ({
          ...prev,
          success: 'تم إرسال رمز التحقق مرة أخرى',
          resendTimer: 60 // Restart timer
        }));
        
        // Start countdown timer
        const timer = setInterval(() => {
          setOtpData(prev => {
            if (prev.resendTimer <= 1) {
              clearInterval(timer);
              return { ...prev, resendTimer: 0 };
            }
            return { ...prev, resendTimer: prev.resendTimer - 1 };
          });
        }, 1000);
      } else {
        setOtpData(prev => ({
          ...prev,
          error: result.message || 'فشل في إرسال رمز التحقق'
        }));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpData(prev => ({
        ...prev,
        error: 'حدث خطأ في إرسال رمز التحقق'
      }));
    } finally {
      setOtpData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Render OTP verification form
  const renderOtpForm = () => (
    <div className="ghym-auth-form">
      <h2 className="ghym-auth-title">التحقق من رقم الهاتف</h2>
      
      <p className="ghym-auth-text" style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280' }}>
        تم إرسال رمز التحقق إلى رقم الهاتف
        <br />
        <strong style={{ color: '#0171bd', direction: 'ltr', fontSize: '18px' }}>{otpData.phoneNumber}</strong>
      </p>

      <form onSubmit={handleOtpVerification}>
        {/* OTP Input Boxes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          direction: 'ltr'
        }}>
          {otpData.otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              maxLength="1"
              inputMode="numeric"
              pattern="[0-9]*"
              style={{
                width: '45px',
                height: '45px',
                fontSize: '20px',
                fontWeight: '600',
                textAlign: 'center',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Almarai, sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0171bd';
                e.target.style.boxShadow = '0 0 0 3px rgba(1, 113, 189, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {otpData.error && (
          <div style={{
            marginBottom: '16px',
            fontSize: '14px',
            color: '#dc2626',
            textAlign: 'center',
            fontFamily: 'Almarai, sans-serif'
          }}>
            {otpData.error}
          </div>
        )}

        {/* Success Message */}
        {otpData.success && (
          <div style={{
            marginBottom: '16px',
            fontSize: '14px',
            color: '#10b981',
            textAlign: 'center',
            fontFamily: 'Almarai, sans-serif'
          }}>
            {otpData.success}
          </div>
        )}

        {/* Verify Button */}
        <button 
          type="submit" 
          className={`ghym-auth-submit-btn ${otpData.isLoading ? 'ghym-auth-loading' : ''}`}
          disabled={otpData.isLoading || otpData.otp.join('').length !== 6}
          style={{ marginBottom: '16px' }}
        >
          {otpData.isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </button>

        {/* Resend OTP Button with Timer */}
        <button 
          type="button"
          onClick={handleResendOtp}
          disabled={otpData.isLoading || otpData.resendTimer > 0}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: otpData.resendTimer > 0 ? '#9ca3af' : '#0171bd',
            textDecoration: 'none',
            fontFamily: 'Almarai, sans-serif',
            fontSize: '14px',
            cursor: otpData.resendTimer > 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {otpData.resendTimer > 0 
            ? `إعادة الإرسال خلال ${otpData.resendTimer} ثانية`
            : 'إرسال الكود مرة أخرى'
          }
        </button>
      </form>
    </div>
  );

  return (
    <>
      <Navbar />
      <MainNavbar />
      
      <div className="ghym-auth-container">
      {/* Main Content */}
      <main className="ghym-auth-main">
        <div className="ghym-auth-card">
          {/* Render different forms based on current step */}
          {currentStep === 'phone' && (
            /* Phone Input Form */
            <form className="ghym-auth-form" onSubmit={handleSubmit}>
              <h2 className="ghym-auth-title">تسجيل الدخول</h2>

              {/* Phone Input */}
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneInput}
                placeholder="رقم الهاتف (مثال: 0501234567)"
                className={`ghym-auth-input ${!phoneValidation.isValid ? 'ghym-auth-input-error' : ''}`}
                required
                dir="ltr"
                maxLength="10"
                inputMode="numeric"
                pattern="[0-9]*"
              />

              {/* Phone Validation Indicator */}
              {formData.phone && (
                <div style={{
                  marginTop: '8px',
                  padding: phoneValidation.isValid ? '0' : '8px',
                  fontSize: '0.875rem',
                  color: phoneValidation.isValid ? '#10b981' : '#dc2626'
                }}>
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {phoneValidation.isValid ? (
                      <>
                        <FaCheck style={{ color: '#10b981' }} />
                        رقم الهاتف صحيح
                      </>
                    ) : (
                      <>
                        <FaTimes style={{ color: '#dc2626' }} />
                        رقم الهاتف غير صحيح
                      </>
                    )}
                  </div>
                  {!phoneValidation.isValid && (
                    <div style={{ marginTop: '4px' }}>{phoneValidation.message}</div>
                  )}
                </div>
              )}

              {/* Login Button */}
              <button 
                type="submit" 
                className={`ghym-auth-submit-btn ${isLoading ? 'ghym-auth-loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>

              {/* Create Account Link */}
              <div className="ghym-auth-link-section">
                <FaUser className="ghym-auth-user-icon" />
                <Link to="/register" className="ghym-auth-link">
                  إنشاء حساب
                </Link>
              </div>
            </form>
          )}

          {/* OTP Verification Form */}
          {currentStep === 'otp' && renderOtpForm()}
        </div>
      </main>
      {showSuccess && (
        <div className="ghym-auth-success-overlay">
          <div className="ghym-auth-success-modal">
            <div className="ghym-auth-success-title">تم تسجيل الدخول بنجاح</div>
            <div className="ghym-auth-success-text">يتم تحويلك إلى لوحة التحكم...</div>
            <button className="ghym-auth-success-btn" onClick={() => { setShowSuccess(false); navigate('/dashboard'); window.location.reload(); }}>حسناً</button>
          </div>
        </div>
      )}
    </div>
    
    <Footer />
    </>
  );
};

export default GhymAuthLogin;