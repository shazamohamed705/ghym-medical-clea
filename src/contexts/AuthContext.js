import React, { createContext, useContext, useState, useEffect } from 'react';

// إنشاء Context للمصادقة
const AuthContext = createContext();

// Custom hook لاستخدام AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // التحقق من صحة token في localStorage عند تحميل التطبيق
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        try {
          // التحقق من صحة التوكن مع الخادم
          const response = await fetch('https://ghaimcenter.com/laravel/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            // التوكن صحيح، حفظ بيانات المستخدم
            setUser(JSON.parse(userData));
          } else {
            // التوكن غير صحيح، مسح البيانات
            console.log('❌ Token expired or invalid, clearing data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error validating token:', error);
          // في حالة خطأ في الاتصال، نفترض أن التوكن صحيح
          try {
            setUser(JSON.parse(userData));
          } catch (parseError) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // وظيفة تسجيل الدخول
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // وظيفة تسجيل الخروج
  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // التحقق من حالة تسجيل الدخول
  const isAuthenticated = () => {
    return user !== null && localStorage.getItem('authToken') !== null;
  };

  // القيم التي سيتم مشاركتها عبر الـ Context
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;