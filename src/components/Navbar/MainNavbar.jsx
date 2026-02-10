

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
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [logoUrl, setLogoUrl] = useState('https://ghaimcenter.com/laravel/storage/app/public/uploads/697a084694f88_1769605190.png'); // Default logo
  const [logoLoading, setLogoLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // جلب اللوجو من API
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setLogoLoading(true);
        const response = await fetch('https://ghaimcenter.com/laravel/api/website-logo');
        const data = await response.json();
        
        if (data.status === true && data.logo) {
          setLogoUrl(data.logo);
        }
      } catch (error) {
        console.error('خطأ في جلب اللوجو:', error);
        // Keep default logo if API fails
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogo();
  }, []);

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

  // جلب عدد عناصر السلة
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated()) {
        setCartCount(0);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === true || result.status === 'success') {
            if (result.data && Array.isArray(result.data)) {
              setCartCount(result.data.length);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartCount(0);
      }
    };

    fetchCartCount();

    // الاستماع لتحديثات السلة
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
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
      
      // إغلاق نتائج البحث عند النقر خارجها
      if (showSearchResults &&
          !event.target.closest('.search-container') &&
          !event.target.closest('input[type="text"]')) {
        setShowSearchResults(false);
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
  }, [categoriesDropdownOpen, showSearchResults]);

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

  // وظيفة التعامل مع النقر على السلة
  const handleCartClick = () => {
    if (isAuthenticated()) {
      navigate('/cart'); // التوجيه لصفحة السلة المستقلة
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

  // وظيفة البحث في الخدمات
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`https://ghaimcenter.com/laravel/api/clinics/services?search=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (result.status === 'success' && result.data?.services) {
        // البحث الأساسي من API
        let apiResults = result.data.services;

        // إضافة بحث محلي موسع للحصول على نتائج أكثر
        const expandedResults = await expandSearchResults(query, apiResults);
        
        setSearchResults(expandedResults);
        setShowSearchResults(true);
      } else {
        // إذا لم يجد API نتائج، جرب البحث الموسع
        const expandedResults = await expandSearchResults(query, []);
        setSearchResults(expandedResults);
        setShowSearchResults(expandedResults.length > 0);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // وظيفة البحث الموسع
  const expandSearchResults = async (query, apiResults) => {
    try {
      // جلب جميع الخدمات للبحث المحلي
      const allServicesResponse = await fetch('https://ghaimcenter.com/laravel/api/clinics/services');
      const allServicesData = await allServicesResponse.json();
      
      if (allServicesData.status === 'success' && allServicesData.data?.services) {
        const allServices = allServicesData.data.services;
        const queryLower = query.toLowerCase().trim();
        
        // البحث الدقيق جداً - البحث عن النص الكامل فقط
        const exactMatches = allServices.filter(service => {
          const titleAr = (service.title_ar || '').toLowerCase();
          const titleEn = (service.title || '').toLowerCase();
          
          // البحث الدقيق في العنوان فقط
          return titleAr === queryLower || 
                 titleEn === queryLower ||
                 titleAr.includes(queryLower) ||
                 titleEn.includes(queryLower);
        });

        // إذا وُجدت نتائج دقيقة، ارجعها فقط
        if (exactMatches.length > 0) {
          return exactMatches.sort((a, b) => {
            const aTitle = (a.title_ar || a.title || '').toLowerCase();
            const bTitle = (b.title_ar || b.title || '').toLowerCase();
            
            // الأولوية للمطابقة التامة
            const aExactMatch = aTitle === queryLower || (a.title || '').toLowerCase() === queryLower;
            const bExactMatch = bTitle === queryLower || (b.title || '').toLowerCase() === queryLower;
            
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
            
            // ثم الأولوية للعناوين التي تحتوي على النص الكامل
            const aContains = aTitle.includes(queryLower);
            const bContains = bTitle.includes(queryLower);
            
            if (aContains && !bContains) return -1;
            if (!aContains && bContains) return 1;
            
            return 0;
          }).slice(0, 3); // حد أقصى 3 نتائج فقط
        }

        // إذا لم توجد نتائج دقيقة، لا ترجع أي نتائج
        return [];
      }
      
      return apiResults;
    } catch (error) {
      console.error('خطأ في البحث الموسع:', error);
      return apiResults;
    }
  };

  // وظيفة التعامل مع تغيير النص في البحث
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // البحث التلقائي بعد كتابة 3 أحرف أو أكثر للدقة أكثر
    if (query.length >= 3) {
      handleSearch(query);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // وظيفة التعامل مع الضغط على المفاتيح في البحث
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
        setShowSearchResults(false);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  // وظيفة النقر على زر البحث
  const handleSearchButtonClick = () => {
    if (!searchQuery.trim()) return;
    
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // وظيفة النقر على نتيجة البحث
  const handleSearchResultClick = (service) => {
    setShowSearchResults(false);
    setSearchQuery('');
    // التوجه لصفحة تفاصيل الخدمة بنفس طريقة FeaturesSection
    navigate(`/service/${service.clinic_id || service.clinics_id || 1}/${service.id}`);
  };

  return (
    <nav className="bg-white border-t border-blue-200 relative z-[9999]" dir="rtl">
      {/* ===== Mobile Header ===== */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2">
        {/* Menu Button - الشمال */}
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo - الوسط */}
        <Link to="/">
          {logoLoading ? (
            <div className="h-12 w-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <img src={logoUrl} alt="Logo" className="h-12 cursor-pointer hover:opacity-90 transition-opacity" />
          )}
        </Link>

        {/* Account & Cart Icons - اليمين */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <div className="relative cursor-pointer" onClick={handleCartClick}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>

          {/* Account Icon */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleAccountClick}
          >
            {isAuthenticated() ? (
              <img 
                src="/avatar_male.webp" 
                alt="User Avatar" 
                className="w-8 h-10 "
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
            ) : null}
            <svg 
              className={`w-6 h-6 text-gray-700 ${isAuthenticated() ? 'hidden' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ display: isAuthenticated() ? 'none' : 'inline' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ===== Mobile Menu ===== */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative search-container" dir="rtl">
            <input
              type="text"
              placeholder="ادخل كلمة البحث"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full border border-blue-300 px-3 py-2 rounded pr-16"
              dir="rtl"
            />
            <button 
              onClick={handleSearchButtonClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded text-xs"
              style={{ backgroundColor: '#0171bd', ...navbarStyle }}
            >
              بحث
            </button>
            
            {/* Search Results Dropdown - Mobile */}
            {showSearchResults && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-[99999]"
                style={{ 
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  zIndex: 99999
                }}
              >
                {searchResults.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleSearchResultClick(service)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {service.images && service.images[0] && service.images[0].image && (
                        <img
                          src={service.images[0].image}
                          alt={service.title_ar || service.title}
                          className="w-10 h-10 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900" style={navbarStyle}>{service.title_ar || service.title}</h4>
                        {service.price && (
                          <p className="text-xs text-gray-600">{service.price} ر.س</p>
                        )}
                        {service.clinic_name && (
                          <p className="text-xs text-blue-600">{service.clinic_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 text-md" style={navbarStyle}>
            <Link to="/" className="text-black font-bold hover:text-blue-600 transition-colors">الرئيسية</Link>
            <Link to="/offers" className="text-black  font-bold hover:text-blue-600 transition-colors">عروضنا</Link>
            <Link to="/doctors" className="text-black font-bold hover:text-blue-600 transition-colors">أطباؤنا</Link>
            <Link to="/booking" className="text-black font-bold hover:text-blue-600 transition-colors">حجز موعد</Link>
            <Link to="/about" className="text-black font-bold hover:text-blue-600 transition-colors">من نحن</Link>
            <Link to="/blogs" className="text-black font-bold  hover:text-blue-600 transition-colors">المدونة</Link>
            <Link to="/contact" className="text-black font-boldhover:text-blue-600 transition-colors">تواصل معنا</Link>
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
            {logoLoading ? (
              <div className="h-24 w-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img 
                src={logoUrl} 
                alt="Ghaym Medical Center Logo" 
                className="h-24 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              />
            )}
          </Link>
        </div>

        {/* Top Section */}
      <div className="container mx-auto px-4 pt-2 pb-3 flex flex-col lg:flex-row items-center gap-4 lg:gap-6" style={{ marginBottom: '1rem' }}>

        {/* Search Bar - Moved to left */}
        <div className="flex order-5 lg:order-2 relative search-container" dir="rtl" style={{ width: '500px', transform: 'translateX(-35rem)', marginTop: '1.5rem' }}>
          <input
            type="text"
            placeholder="ادخل كلمة البحث"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
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
            onClick={handleSearchButtonClick}
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
          
          {/* Search Results Dropdown - Desktop */}
          {showSearchResults && searchResults.length > 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto z-[99999]"
              style={{ 
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                zIndex: 99999
              }}
            >
              {searchResults.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleSearchResultClick(service)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors duration-200"
                >
                  {service.images && service.images[0] && service.images[0].image && (
                    <img
                      src={service.images[0].image}
                      alt={service.title_ar || service.title}
                      className="w-12 h-12 object-cover rounded"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900" style={navbarStyle}>{service.title_ar || service.title}</h4>
                    {service.price && (
                      <p className="text-xs text-gray-600">{service.price} ر.س</p>
                    )}
                    {service.clinic_name && (
                      <p className="text-xs text-blue-600">{service.clinic_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Left Side - Cart, Reservations, Account (moved to right, after search) */}
        {!showSearchResults && (
          <div className="flex items-center gap-3 order-3 lg:order-2" style={{ transform: 'translateX(-27rem)', marginRight: '0.5rem', marginTop: '1.5rem', alignSelf: 'flex-start' }}>
          {/* Cart Icon */}
      
          {/* Account Icon */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleAccountClick}
          >
            {isAuthenticated() ? (
              <img 
                src="/avatar_male.webp" 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
            ) : null}
            <svg 
              className={`w-7 h-7 text-gray-700 ${isAuthenticated() ? 'hidden' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ display: isAuthenticated() ? 'none' : 'inline' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700 text-sm" style={navbarStyle}>
              {isAuthenticated() ? 'الحساب' : 'سجل الدخول'}
            </span>
          </div>
          <div className="relative cursor-pointer" onClick={handleCartClick}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>

          <span
            className="text-gray-700 text-sm cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleCartClick}
            style={navbarStyle}
          >
            السلة
          </span>
          
        </div>
        )}
      </div>

        {/* Bottom Section - Navigation */}
        {!showSearchResults ? (
          <div className="relative">
            <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center gap-4" style={{ transform: 'translateX(-20rem)' }}>
              {/* Navigation Links */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 lg:gap-6 order-1 lg:order-1" style={navbarStyle}>
                <Link to="/" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">الرئيسية</Link>
                <Link to="/offers" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">عروضنا</Link>
                <Link to="/doctors" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">أطباؤنا</Link>
                <Link to="/booking" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">حجز موعد</Link>
                <Link to="/about" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">من نحن</Link>
                <Link to="/blogs" className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium">المدونة</Link>
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
        ) : null}
      </div>
    </nav>
  );
}

export default MainNavbar;
