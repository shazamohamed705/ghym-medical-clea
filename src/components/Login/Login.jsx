import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import '../Register/GhymAuthStyles.css';

const GhymAuthLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle input changes with optimized performance
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with API integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Send POST request to login API
      const response = await fetch('https://ghaimcenter.com/laravel/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Print the token to console
        console.log('Token:', result.data.token);

        // Use AuthContext to save user data
        login({
          name: result.data.user.fullname,
          email: result.data.user.email,
          phone: result.data.user.phone_number,
          id: result.data.user.id
        }, result.data.token);

        // Show success popup then navigate
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // API returned error
        const errorMessage = result.message || 'فشل تسجيل الدخول. تحقق من البيانات';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى');
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
          {/* Login Form */}
          <form className="ghym-auth-form" onSubmit={handleSubmit}>
            <h2 className="ghym-auth-title">تسجيل الدخول</h2>

            {/* Email Input */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="أدخل بريدك الإلكتروني"
              className="ghym-auth-input"
              required
              autoComplete="email"
              dir="ltr"
            />

            {/* Password Input */}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="أدخل كلمة المرور"
              className="ghym-auth-input"
              required
              autoComplete="current-password"
              dir="ltr"
            />

            {/* Login Button */}
            <button 
              type="submit" 
              className={`ghym-auth-submit-btn ${isLoading ? 'ghym-auth-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'جاري التحقق...' : 'دخول'}
            </button>

            {/* Create Account Link */}
            <div className="ghym-auth-link-section">
              <FaUser className="ghym-auth-user-icon" />
              <Link to="/register" className="ghym-auth-link">
                إنشاء حساب
              </Link>
            </div>
          </form>
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
  );
};

export default GhymAuthLogin;