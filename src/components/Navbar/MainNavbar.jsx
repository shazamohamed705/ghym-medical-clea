import React, { useState, useEffect, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClinicsCategories } from '../../API/apiService';

// إضافة الخط Almarai مع الوزن Bold
const navbarStyle = {
  fontFamily: 'Almarai',
  fontWeight: 700
};

// مكون منفصل لعنصر الفئة مع تحسين الأداء
const CategoryItem = memo(({ category, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
    >
      {category.icon && (
        <img
          src={`https://ghaimcenter.com/laravel/storage/app/public/uploads/${category.icon}`}
          alt={category.title_ar || category.title}
          className="w-6 h-6 object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <span className="text-sm text-gray-700" style={navbarStyle}>
        {category.title_ar || category.title}
      </span>
    </button>
  );
});

CategoryItem.displayName = 'CategoryItem';

function MainNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // جلب عدد الحجوزات
  useEffect(() => {
    const fetchBookingsCount = async () => {
      if (!isAuthenticated()) {
        setBookingsCount(0);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('https://ghaimcenter.com/laravel/api/user/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data?.bookings) {
            setBookingsCount(data.data.bookings.length);
          }
        }
      } catch (error) {
        console.error('Error fetching bookings count:', error);
        setBookingsCount(0);
      }
    };

    fetchBookingsCount();

    // الاستماع لتحديثات عدد الحجوزات
    const handleBookingsUpdate = (event) => {
      setBookingsCount(event.detail.count);
    };

    window.addEventListener('bookingsCountUpdated', handleBookingsUpdate);

    // تحديث العدد كل 30 ثانية
    const interval = setInterval(fetchBookingsCount, 30000);

    return () => {
      window.removeEventListener('bookingsCountUpdated', handleBookingsUpdate);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // جلب الأقسام
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getClinicsCategories();
        if (response.status === 'success' && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('خطأ في جلب الأقسام:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // إغلاق dropdown عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesDropdownOpen &&
          !event.target.closest('.categories-dropdown') &&
          !event.target.closest('[data-dropdown-toggle="categories"]')) {
        setCategoriesDropdownOpen(false);
      }
    };

    // استخدام setTimeout لتجنب إغلاق فوري عند النقر على الزر
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [categoriesDropdownOpen]);

  // وظيفة التعامل مع النقر على زر الحساب
  const handleAccountClick = () => {
    if (isAuthenticated()) {
      navigate('/dashboard'); // التوجيه للوحة التحكم إذا مسجل دخول
    } else {
      navigate('/login'); // التوجيه لصفحة تسجيل الدخول إذا مش مسجل دخول
    }
  };

  // وظيفة التعامل مع النقر على الحجوزات
  const handleBookingsClick = () => {
    if (isAuthenticated()) {
      navigate('/dashboard?filter=bookings'); // التوجيه للداش بورد مع فلتر الحجوزات
    } else {
      navigate('/login'); // التوجيه لتسجيل الدخول إذا مش مسجل
    }
  };

  // وظيفة التعامل مع النقر على قسم
  const handleCategoryClick = useCallback((category) => {
    setCategoriesDropdownOpen(false);

    // توجيه لصفحة Category لعرض جميع الخدمات في هذه الفئة
    navigate('/category', { state: { categoryId: category.id } });
  }, [navigate]);

  return (
    <nav className="bg-white border-t border-blue-200 relative" dir="rtl">
      {/* ===== Mobile Header ===== */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        {/* Menu Button - الشمال */}
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo - اليمين */}
        <Link to="/">
          <img src="/logoo.png" alt="Logo" className="h-12 cursor-pointer hover:opacity-90 transition-opacity" />
        </Link>
      </div>

      {/* ===== Mobile Menu ===== */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-4 space-y-4">
          {/* Search */}
          <div className="relative" dir="rtl">
            <input
              type="text"
              placeholder="ادخل كلمة البحث"
              className="w-full border border-blue-300 px-3 py-2 rounded pr-16"
              dir="rtl"
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded text-xs"
              style={{ backgroundColor: '#0171bd', ...navbarStyle }}
            >
              بحث
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 text-md" style={navbarStyle}>
            <Link to="/" className="text-black font-bold hover:text-blue-600 transition-colors">الرئيسية</Link>
            <Link to="/offers" className="text-black  font-bold hover:text-blue-600 transition-colors">عروضنا</Link>
            <Link to="/doctors" className="text-black font-bold hover:text-blue-600 transition-colors">أطباؤنا</Link>
            <Link to="/booking" className="text-black font-bold hover:text-blue-600 transition-colors">حجز موعد</Link>
            <Link to="/about" className="text-black font-bold hover:text-blue-600 transition-colors">من نحن</Link>
            <Link to="/blog" className="text-black font-bold  hover:text-blue-600 transition-colors">المدونة</Link>
            <Link to="/contact" className="text-black font-boldhover:text-blue-600 transition-colors">تواصل معنا</Link>
          </div>

          {/* Account / Cart */}
          <div className="flex gap-4 pt-3 border-t text-sm" style={navbarStyle}>
            <span
              className="text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleAccountClick}
            >
              {isAuthenticated() ? 'الحساب' : 'سجل الدخول'}
            </span>
            <span
              className="text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleBookingsClick}
            >
              الحجوزات
            </span>
            <div className="relative cursor-pointer">
              <span className="text-gray-700">🛒</span>
              {bookingsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bookingsCount}
                </span>
              )}
            </div>
          </div>

          {/* Departments */}
          <div className="w-full">
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="w-full text-white py-2 rounded flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0171bd', ...navbarStyle }}
              data-dropdown-toggle="categories"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>أقسام مجمع غيم الطبي</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Mobile Categories Dropdown */}
            {categoriesDropdownOpen && (
              <div className="categories-dropdown mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-[9999]">
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onClick={handleCategoryClick}
                    />
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm" style={navbarStyle}>
                    {loadingCategories ? 'جاري تحميل الأقسام...' : 'لا توجد أقسام متاحة'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Desktop View ===== */}
      <div className="hidden lg:block">
        {/* Logo - Separate div, positioned absolutely */}
        <div className="absolute top-0 right-0 z-10" style={{ marginTop: '3.5rem', paddingRight: '10rem' }}>
          <Link to="/">
            <img 
              src="/logoo.png" 
              alt="Ghaym Medical Center Logo" 
              className="h-24 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        {/* Top Section */}
      <div className="container mx-auto px-4 pt-2 pb-3 flex flex-col lg:flex-row items-center gap-4 lg:gap-6" style={{ marginBottom: '1rem' }}>

        {/* Search Bar - Moved to left */}
        <div className="flex order-5 lg:order-2 relative" dir="rtl" style={{ width: '500px', transform: 'translateX(-40rem)', marginTop: '1.5rem' }}>
          <input
            type="text"
            placeholder="ادخل كلمة البحث"
            className="w-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            dir="rtl"
            style={{ 
              width: '450px',
              height: '40px',
              borderRadius: '4px',
              borderWidth: '2px',
              padding: '2px',
              paddingRight: '70px',
              paddingLeft: '12px'
            }}
          />
          <button 
            className="absolute text-white px-4 rounded-r transition-colors text-xs font-medium flex items-center justify-center"
            style={{ 
              top: '5px',
              right: '5px',
              height: '30px',
              borderTopRightRadius: '2px',
              borderBottomRightRadius: '2px',
              backgroundColor: '#0171bd',
              ...navbarStyle
            }}
          >
            بحث
          </button>
        </div>

        {/* Left Side - Cart, Reservations, Account (moved to right, after search) */}
        <div className="flex items-center gap-4 order-3 lg:order-2" style={{ transform: 'translateX(-37rem)', marginRight: '0.5rem', marginTop: '2.5rem', alignSelf: 'flex-start' }}>
          {/* Cart Icon */}
      
          {/* Account Icon */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleAccountClick}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700 text-sm" style={navbarStyle}>
              {isAuthenticated() ? 'الحساب' : 'سجل الدخول'}
            </span>
          </div>
          <div className="relative cursor-pointer" onClick={handleBookingsClick}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {bookingsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {bookingsCount}
              </span>
            )}
          </div>

          <span
            className="text-gray-700 text-sm cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleBookingsClick}
            style={navbarStyle}
          >
            الحجوزات
          </span>
          
        </div>
      </div>

        {/* Bottom Section - Navigation */}
        <div className="relative">
          <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center gap-4" style={{ transform: 'translateX(-20rem)' }}>
            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 lg:gap-6 order-1 lg:order-1" style={navbarStyle}>
              <Link to="/" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">الرئيسية</Link>
              <Link to="/offers" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">عروضنا</Link>
              <Link to="/doctors" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">أطباؤنا</Link>
              <Link to="/booking" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">حجز موعد</Link>
              <Link to="/about" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">من نحن</Link>
              <Link to="/blog" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">المدونة</Link>
              <Link to="/contact" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">تواصل معنا</Link>
            </div>

            {/* Departments Dropdown */}
            <div className="relative categories-dropdown order-2 lg:order-2 lg:ml-auto">
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="text-white px-6 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium"
                style={{ backgroundColor: '#0171bd', ...navbarStyle }}
                data-dropdown-toggle="categories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>أقسام مجمع غيم الطبي</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Categories Dropdown - خارج الـ container المُحوّل */}
          {categoriesDropdownOpen && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onClick={handleCategoryClick}
                  />
                ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-500 text-sm" style={navbarStyle}>
                  {loadingCategories ? 'جاري تحميل الأقسام...' : 'لا توجد أقسام متاحة'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default MainNavbar;

