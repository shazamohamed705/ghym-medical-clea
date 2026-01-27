import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaCheck, FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import './GhymAuthStyles.css';

const GhymAuthRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, message: '', level: 0 });
  const [nameValidation, setNameValidation] = useState({ isValid: true, message: '' });
  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, message: '' });
  const navigate = useNavigate();

  // Handle input changes with optimized performance
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength in real-time
    if (name === 'password') {
      const strength = isPasswordStrong(value);
      setPasswordStrength(strength);
    }
  };

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

  // Function to validate phone number (International format)
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      setPhoneValidation({ isValid: true, message: '' });
      return;
    }

    // Check if contains only numbers
    if (!/^\d+$/.test(phone)) {
      setPhoneValidation({
        isValid: false,
        message: 'يُرجى إدخال أرقام فقط (لا يُسمح بالحروف)'
      });
      return;
    }

    // Check international phone number format (8-15 digits)
    if (!/^\d{8,15}$/.test(phone)) {
      setPhoneValidation({
        isValid: false,
        message: 'يُرجى إدخال رقم هاتف صحيح (8-15 رقم)'
      });
      return;
    }

    setPhoneValidation({
      isValid: true,
      message: 'رقم الهاتف صحيح ✅'
    });
  };

  // Handle full name input with Arabic validation
  const handleNameChange = (e) => {
    const fullName = e.target.value;
    const nameParts = fullName.split(' ');

    setFormData(prev => ({
      ...prev,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || ''
    }));

    // Validate Arabic name in real-time
    if (fullName.trim()) {
      const trimmedName = fullName.trim();
      const hasArabic = isArabicText(trimmedName);
      const hasEnglish = /[a-zA-Z]/.test(trimmedName);

      if (!hasArabic || hasEnglish) {
        setNameValidation({
          isValid: false,
          message: 'يُرجى كتابة الاسم باللغة العربية فقط (لا يُسمح بالأحرف الإنجليزية)'
        });
      } else {
        setNameValidation({
          isValid: true,
          message: 'الاسم صحيح'
        });
      }
    } else {
      setNameValidation({ isValid: true, message: '' });
    }
  };

  // Function to check if text contains Arabic characters
  const isArabicText = (text) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Function to validate password strength (Google-like requirements)
  const isPasswordStrong = (password) => {
    // At least 8 characters
    if (password.length < 8) {
      return { isValid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
    }

    // At least one number
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*...)' };
    }

    return { isValid: true, message: 'كلمة المرور قوية' };
  };

  // Handle form submission with API integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate name is in Arabic (must be Arabic only, no English)
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!isArabicText(fullName)) {
      alert('يُرجى كتابة الاسم باللغة العربية فقط (لا يُسمح بالأحرف الإنجليزية)');
      return;
    }

    // Additional check: ensure no English letters in the name
    if (/[a-zA-Z]/.test(fullName)) {
      alert('يُرجى كتابة الاسم باللغة العربية فقط (لا يُسمح بالأحرف الإنجليزية)');
      return;
    }
    
    // Validate password strength
    const passwordValidation = isPasswordStrong(formData.password);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.message);
      return;
    }

    // Validate phone number
    if (!phoneValidation.isValid && formData.phone) {
      alert(phoneValidation.message);
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      alert('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare data for API
      const fullname = `${formData.firstName} ${formData.lastName}`.trim();
      const apiData = {
        email: formData.email,
        fullname: fullname,
        password: formData.password,
        phone_number: formData.phone
      };

      // Send POST request to API
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      if (response.ok) {
        // Success - show message and navigate to login
        alert('تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول');
        navigate('/login');
      } else {
        // API returned error
        const errorMessage = result.message || 'حدث خطأ أثناء إنشاء الحساب';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ghym-auth-container">
      {/* Header Section */}
      <header className="ghym-auth-header">
        <div className="ghym-auth-header-content">
          {/* Logo Section */}
          <div className="ghym-auth-logo-section">
            <img 
              src="/logoo.png" 
              alt="مجمع غيم الطبي" 
              className="ghym-auth-logo-img"
            />
          </div>

          {/* Back Button */}
          <button 
            className="ghym-auth-back-btn"
            onClick={() => navigate(-1)}
            aria-label="العودة"
          >
            <FaArrowLeft className="ghym-auth-back-icon" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ghym-auth-main">
        <div className="ghym-auth-card">
          {/* Register Form */}
          <form className="ghym-auth-form" onSubmit={handleSubmit}>
            <h2 className="ghym-auth-title">إنشاء حساب جديد</h2>

            {/* Full Name Input */}
            <input
              type="text"
              name="fullName"
              value={`${formData.firstName} ${formData.lastName}`.trim()}
              onChange={handleNameChange}
              placeholder="الاسم الكامل"
              className={`ghym-auth-input ${!nameValidation.isValid ? 'ghym-auth-input-error' : ''}`}
              required
            />

            {/* Name Validation Indicator */}
            {`${formData.firstName} ${formData.lastName}`.trim() && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: nameValidation.isValid ? '#d1fae5' : '#fef2f2',
                border: `1px solid ${nameValidation.isValid ? '#10b981' : '#f87171'}`,
                fontSize: '0.875rem',
                color: nameValidation.isValid ? '#065f46' : '#dc2626'
              }}>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {nameValidation.isValid ? (
                    <>
                      <FaCheck style={{ color: '#10b981' }} />
                      الاسم صحيح
                    </>
                  ) : (
                    <>
                      <FaTimes style={{ color: '#dc2626' }} />
                      الاسم غير صحيح
                    </>
                  )}
                </div>
                {!nameValidation.isValid && (
                  <div style={{ marginTop: '4px' }}>{nameValidation.message}</div>
                )}
              </div>
            )}

            {/* Email Input */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="البريد الإلكتروني"
              className="ghym-auth-input"
              required
              autoComplete="email"
              dir="ltr"
            />

            {/* Phone Input */}
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneInput}
              placeholder="رقم الهاتف (مثال: 966501234567 أو 96522345678)"
              className={`ghym-auth-input ${!phoneValidation.isValid ? 'ghym-auth-input-error' : ''}`}
              required
              dir="ltr"
              maxLength="12"
              inputMode="numeric"
              pattern="[0-9]*"
            />

            {/* Phone Validation Indicator */}
            {formData.phone && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: phoneValidation.isValid ? '#d1fae5' : '#fef2f2',
                border: `1px solid ${phoneValidation.isValid ? '#10b981' : '#f87171'}`,
                fontSize: '0.875rem',
                color: phoneValidation.isValid ? '#065f46' : '#dc2626'
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

            {/* Password Input */}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="كلمة المرور"
              className="ghym-auth-input"
              required
              autoComplete="new-password"
              dir="ltr"
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: passwordStrength.isValid ? '#d1fae5' : '#fef2f2',
                border: `1px solid ${passwordStrength.isValid ? '#10b981' : '#f87171'}`,
                fontSize: '0.875rem',
                color: passwordStrength.isValid ? '#065f46' : '#dc2626'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {passwordStrength.isValid ? (
                    <>
                      <FaCheck style={{ color: '#10b981' }} />
                      قوة كلمة المرور: قوية
                    </>
                  ) : (
                    <>
                      <FaTimes style={{ color: '#dc2626' }} />
                      قوة كلمة المرور: ضعيفة
                    </>
                  )}
                </div>
                <div>{passwordStrength.message}</div>
                {formData.password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((formData.password.length / 12) * 100, 100)}%`,
                        backgroundColor: passwordStrength.isValid ? '#10b981' : '#f87171',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password Input */}
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="تأكيد كلمة المرور"
              className="ghym-auth-input"
              required
              autoComplete="new-password"
              dir="ltr"
            />

            {/* Register Button */}
            <button 
              type="submit" 
              className={`ghym-auth-submit-btn ${isLoading ? 'ghym-auth-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </button>

            {/* Login Link */}
            <div className="ghym-auth-link-section">
              <span className="ghym-auth-text">هل لديك حساب؟</span>
              <Link to="/login" className="ghym-auth-link">
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default GhymAuthRegister;
