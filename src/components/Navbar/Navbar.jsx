import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // التحقق من وجود token في localStorage أو sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    setIsLoggedIn(!!token);

    // جلب بيانات الاتصال من API
    const fetchContactData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ghaimcenter.com/laravel/api/contact-data');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const contactInfo = result.data.find(item => item.prefix === 'contact_data');
          if (contactInfo) {
            setContactData(contactInfo.data);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الاتصال:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, []);

  const handleBookingsClick = () => {
    if (isLoggedIn) {
      // اذهب إلى صفحة الحجوزات في الداش بورد
      navigate('/dashboard');
    } else {
      // أظهر popup تسجيل الدخول
      setShowLoginPopup(true);
    }
  };

  const closePopup = () => {
    setShowLoginPopup(false);
  };

  const goToLogin = () => {
    setShowLoginPopup(false);
    navigate('/login');
  };

  // Add custom animations CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      .animate-slide-up {
        animation: slide-up 0.4s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return (
    <nav className="hidden md:block text-white py-2" style={{
      backgroundColor: '#005b99',
      fontFamily: 'Almarai',
      fontWeight: 700,
      fontStyle: 'Bold',
      fontSize: '16px',
      leadingTrim: 'NONE',
      lineHeight: '70px',
      letterSpacing: '0%',
      verticalAlign: 'middle'
    }} dir="rtl">
      <div className="container mx-auto px-2 sm:px-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-0 py-1 relative">
        {/* Right Section - Language and Contact (moved to left) */}
        <div className="flex flex-row-reverse sm:space-x-reverse sm:space-x-3 flex-wrap justify-center sm:justify-start items-center text-xs sm:text-sm gap-1.5 sm:gap-0" style={{ color: '#FFFFFF' }}>
          {contactData?.phone && (
            <>
              <a 
                href={`tel:${contactData.phone}`}
                className="text-lime-400 font-medium hover:text-white transition-colors cursor-pointer"
              >
                {contactData.phone}
              </a>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span>للاستفسار:</span>
              <span className="text-gray-400 hidden sm:inline">|</span>
            </>
          )}
          {loading && (
            <>
              <span className="text-lime-400 font-medium">جاري التحميل...</span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span>للاستفسار:</span>
              <span className="text-gray-400 hidden sm:inline">|</span>
            </>
          )}
          <span>العربية</span>
        </div>

        {/* Center Section - Promotional Message (centered absolutely) */}
        <div className="font-medium text-xs sm:text-sm whitespace-nowrap text-center sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2" style={{ color: '#9bc115' }}>
          عروض وخصومات تصل الى 50% لفترة محدودة
        </div>

        {/* Left Section - Navigation Links (moved to right) */}
        <div className="flex flex-row-reverse sm:space-x-reverse flex-wrap justify-center sm:justify-end items-center text-xs sm:text-sm gap-1.5 sm:gap-0 sm:ml-auto" style={{ color: '#FFFFFF', transform: 'translateX(-50rem)' }}>
          {isLoggedIn ? (
            <Link to="/dashboard" className="hover:opacity-80 cursor-pointer transition-opacity sm:px-2">حسابي</Link>
          ) : (
            <Link to="/login" className="hover:opacity-80 cursor-pointer transition-opacity sm:px-2">سجل الدخول</Link>
          )}
          <span className="text-gray-400 hidden sm:inline px-2">|</span>
          <button
            onClick={handleBookingsClick}
            className="hover:opacity-80 cursor-pointer transition-opacity sm:px-2 bg-transparent border-none text-white"
            style={{ fontFamily: 'Almarai', fontWeight: 700 }}
          >
            الحجوزات
          </button>
          <span className="text-gray-400 hidden sm:inline px-2">|</span>
          <Link to="/contact" className="hover:opacity-80 cursor-pointer transition-opacity sm:px-2">تواصل معنا</Link>
        </div>
      </div>

      {/* Login Required Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" dir="rtl">
          <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-blue-200 transform transition-all duration-300 scale-100 animate-slide-up">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 left-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="mb-4">
                {/* Animated Icon */}
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: 'Almarai' }}>
                  تسجيل الدخول مطلوب
                </h3>
                <p className="text-gray-600 text-base leading-relaxed" style={{ fontFamily: 'Almarai' }}>
                  يرجى تسجيل الدخول أولاً لعرض حجوزاتك وإدارة حسابك
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={goToLogin}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  style={{ fontFamily: 'Almarai' }}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    سجل الدخول
                  </span>
                </button>
                <button
                  onClick={closePopup}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  style={{ fontFamily: 'Almarai' }}
                >
                  ربما لاحقاً
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Almarai' }}>
                  لن يستغرق الأمر سوى دقيقة واحدة! 🚀
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
