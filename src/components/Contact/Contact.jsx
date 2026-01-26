import React, { useState, useCallback, useMemo } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import './contact.css';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';
const Contact = () => {
  // Form state management
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    subject: '',
    message: '',
    captcha: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Captcha generation (simple math) - memoized for performance
  const captchaQuestion = useMemo(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }, []);

  // Input change handler - optimized with debouncing concept
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing - more efficient
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'يجب أن يحتوي الاسم على حرفين على الأقل';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Mobile validation
    const mobileRegex = /^05\d{8}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'رقم الجوال مطلوب';
    } else if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = 'رقم الجوال يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'الرسالة مطلوبة';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'يجب أن تحتوي الرسالة على 10 أحرف على الأقل';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'الموضوع مطلوب';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'الموضوع قصير جداً';
    }

    // Captcha validation
    if (!formData.captcha.trim()) {
      newErrors.captcha = 'الإجابة مطلوبة';
    } else if (parseInt(formData.captcha) !== captchaQuestion.answer) {
      newErrors.captcha = 'الإجابة غير صحيحة';
    }

    return newErrors;
  }, [formData, captchaQuestion.answer]);

  // Form submission handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const response = await fetch('https://ghaimcenter.com/laravel/api/contact/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.mobile,
          subject: formData.subject,
          message: formData.message
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.status === 'error') {
        throw new Error(result?.message || 'تعذر إرسال الرسالة الآن');
      }

      setIsSubmitted(true);
      
      // Reset form after successful submission
      setFormData({
        fullName: '',
        email: '',
        mobile: '',
        subject: '',
        message: '',
        captcha: ''
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: error?.message || 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  // Reset success message after 5 seconds - optimized
  React.useEffect(() => {
    if (!isSubmitted) return;
    
    const timer = setTimeout(() => setIsSubmitted(false), 5000);
    return () => clearTimeout(timer);
  }, [isSubmitted]);

  return (
    <div className="min-h-screen bg-white">
            <Navbar />

      <MainNavbar />
      <div className="contact-page">
      <div className="contact-container">
        {/* Page Header */}
        <div className="contact-page-header">
          <h1 className="contact-page-title">
            <span className="contact-title-main">تواصل معنا</span>
            <span className="contact-title-sub">... يسعدنا تلقي استفسارك، و سنكون بخدمتك في أسرع وقت</span>
          </h1>
        </div>
        
        <div className="contact-form-panel">

          {/* Success Message */}
          {isSubmitted && (
            <div
              className="contact-success-overlay"
              onClick={() => setIsSubmitted(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
              }}
            >
              <div
                role="dialog"
                aria-live="polite"
                aria-label="تم إرسال الرسالة بنجاح"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  padding: '24px',
                  textAlign: 'center',
                  animation: 'fadeInScale 200ms ease-out'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px'
                    }}
                  >
                    <FaCheckCircle />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: 700 }}>تم إرسال الرسالة</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>شكرًا لتواصلك معنا، سنرد عليك في أقرب وقت.</p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    style={{
                      marginTop: '12px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    تم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="contact-error-message" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {errors.submit}
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Form Fields Grid */}
            <div className="contact-form-fields">
              {/* Full Name */}
              <div className="contact-form-group">
                <label htmlFor="fullName" className="contact-form-label">
                  الاسم الكامل <span className="contact-form-required">(مطلوب)</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder={formData.fullName ? '' : 'اكتب اسمك الكامل'}
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <div className="contact-error-message">{errors.fullName}</div>
                )}
              </div>

              {/* Email */}
              <div className="contact-form-group">
                <label htmlFor="email" className="contact-form-label">
                  البريد الإلكتروني <span className="contact-form-required">(مطلوب)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.email ? 'error' : ''}`}
                  placeholder={!formData.email ? 'example@mail.com' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <div className="contact-error-message">{errors.email}</div>
                )}
              </div>

              {/* Mobile */}
              <div className="contact-form-group">
                <label htmlFor="mobile" className="contact-form-label">
                  رقم الجوال <span className="contact-form-required">(مطلوب)</span>
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.mobile ? 'error' : ''}`}
                  placeholder={formData.mobile ? '' : '05xxxxxxxx'}
                  disabled={isSubmitting}
                />
                {errors.mobile && (
                  <div className="contact-error-message">{errors.mobile}</div>
                )}
              </div>

              {/* Subject */}
              <div className="contact-form-group">
                <label htmlFor="subject" className="contact-form-label">
                  الموضوع <span className="contact-form-required">(مطلوب)</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.subject ? 'error' : ''}`}
                  placeholder={formData.subject ? '' : 'أدخل موضوع الرسالة'}
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <div className="contact-error-message">{errors.subject}</div>
                )}
              </div>

              {/* Message - Full Width */}
              <div className="contact-form-group full-width">
                <label htmlFor="message" className="contact-form-label">
                  الرسالة <span className="contact-form-required">(مطلوبة)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`contact-form-textarea ${errors.message ? 'error' : ''}`}
                  placeholder={formData.message ? '' : 'اكتب رسالتك هنا'}
                  disabled={isSubmitting}
                  rows="4"
                />
                {errors.message && (
                  <div className="contact-error-message">{errors.message}</div>
                )}
              </div>
            </div>

            {/* Captcha */}
            <div className="contact-captcha-group">
              <label htmlFor="captcha" className="contact-captcha-label">
                فضلاً أجب : {captchaQuestion.num1} + {captchaQuestion.num2} = ؟ <span className="contact-form-required">(مطلوب)</span>
              </label>
              <input
                type="number"
                id="captcha"
                name="captcha"
                value={formData.captcha}
                onChange={handleInputChange}
                className={`contact-captcha-input ${errors.captcha ? 'error' : ''}`}
                placeholder={formData.captcha ? '' : 'أدخل الإجابة'}
                disabled={isSubmitting}
              />
              {errors.captcha && (
                <div className="contact-error-message">{errors.captcha}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`contact-submit-btn ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </form>

          {/* Footer Contact Info */}
          <div className="contact-footer">
            <a href="mailto:info@ghanim.com" className="contact-email">
              info@ghanim.com
            </a>
            <span className="contact-phone">966539366005+</span>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default React.memo(Contact);
