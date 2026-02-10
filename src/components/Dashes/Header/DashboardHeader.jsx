import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { 
  FaHome, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaSearch,
  FaBox,
  FaPlus
} from 'react-icons/fa';
import './DashboardHeader.css';

/**
 * Dashboard Header Component with Mobile Hamburger Menu
 * Displays the dashboard title with navigation actions and filter menu
 * Optimized with React.memo to prevent unnecessary re-renders
 * Features: Scroll-based shadow enhancement for better floating effect
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onHomeClick - Callback function when home button is clicked
 * @param {Function} props.onLogoutClick - Callback function when logout button is clicked
 * @param {Function} props.onFilterSelect - Callback function when filter is selected
 * @param {Array} props.filterItems - Array of filter items to display
 * @param {string} props.activeFilter - Currently active filter
 * @returns {JSX.Element} Dashboard header component
 */
const DashboardHeader = memo(({ 
  onHomeClick, 
  onLogoutClick, 
  onFilterSelect,
  filterItems = [],
  activeFilter = 'لوحة التحكم الرئيسية'
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);

  // Handle scroll to add/remove enhanced shadow
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen && !isClosing) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else if (!isMenuOpen && !isClosing) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isMenuOpen, isClosing]);

  // Close menu with animation
  const closeMenuWithAnimation = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300); // Match CSS animation duration
  }, []);

  // Toggle mobile menu
  const toggleMenu = useCallback(() => {
    if (isMenuOpen) {
      closeMenuWithAnimation();
    } else {
      setIsMenuOpen(true);
      setIsClosing(false);
    }
  }, [isMenuOpen, closeMenuWithAnimation]);

  // Close menu when filter is selected
  const handleFilterClick = useCallback((item) => {
    onFilterSelect(item);
    closeMenuWithAnimation();
  }, [onFilterSelect, closeMenuWithAnimation]);

  // Close menu when clicking outside
  const handleBackdropClick = useCallback(() => {
    closeMenuWithAnimation();
  }, [closeMenuWithAnimation]);
  return (
    <>
      <header 
        ref={headerRef}
        className={`dashboard-header-wrapper ${isScrolled ? 'scrolled' : ''}`}
      >
        <div className="dashboard-header-content">
          {/* Right Side - Hamburger Menu */}
          <button 
            className="dashboard-hamburger-btn"
            onClick={toggleMenu}
            type="button"
            aria-label="فتح قائمة التنقل"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <FaTimes className="dashboard-hamburger-icon" aria-hidden="true" />
            ) : (
              <FaBars className="dashboard-hamburger-icon" aria-hidden="true" />
            )}
          </button>

          {/* Center - Title */}
          <h1 className="dashboard-header-title">
            لوحة التحكم
          </h1>

          {/* Right Side - Desktop Navigation */}
          <div className="dashboard-header-nav">
            <button 
              className="dashboard-nav-btn dashboard-nav-btn--home"
              onClick={onHomeClick}
              type="button"
              aria-label="الذهاب إلى الصفحة الرئيسية"
            >
              <FaHome className="dashboard-nav-icon" aria-hidden="true" />
              <span className="dashboard-nav-text">الرئيسية</span>
            </button>
            
            <button 
              className="dashboard-nav-btn dashboard-nav-btn--back"
              onClick={onLogoutClick}
              type="button"
              aria-label="تسجيل الخروج من الحساب"
            >
              <FaSignOutAlt className="dashboard-nav-icon" aria-hidden="true" />
              <span className="dashboard-nav-text">تسجيل الخروج</span>
            </button>
          </div>

          {/* Left Side - Mobile Buttons */}
          <div className="dashboard-header-left">
            <button 
              className="dashboard-nav-btn dashboard-nav-btn--home"
              onClick={onHomeClick}
              type="button"
              aria-label="الذهاب إلى الصفحة الرئيسية"
            >
              <FaHome className="dashboard-nav-icon" aria-hidden="true" />
            </button>
            
            <button 
              className="dashboard-nav-btn dashboard-nav-btn--back"
              onClick={onLogoutClick}
              type="button"
              aria-label="تسجيل الخروج من الحساب"
            >
              <FaSignOutAlt className="dashboard-nav-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className={`dashboard-mobile-menu-overlay ${isClosing ? 'ghym-main-panel-close' : 'ghym-main-panel-open'}`}
          onClick={handleBackdropClick}
        >
          <nav 
            className={`dashboard-mobile-menu ghym-main-menu-panel ${isClosing ? 'ghym-main-panel-close' : 'ghym-main-panel-open'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-mobile-menu-header">
              <h3 className="dashboard-mobile-menu-title">قائمة التنقل</h3>
              <button 
                className="dashboard-mobile-menu-close"
                onClick={toggleMenu}
                type="button"
                aria-label="إغلاق القائمة"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <div className="dashboard-mobile-menu-content">
              {/* Filter Items */}
              {filterItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeFilter === item.id;
                
                return (
                  <button
                    key={item.id}
                    className={`dashboard-mobile-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleFilterClick(item)}
                    type="button"
                    aria-label={item.id}
                  >
                    <IconComponent className="dashboard-mobile-menu-icon" aria-hidden="true" />
                    <span className="dashboard-mobile-menu-text">{item.id}</span>
                    {isActive && <span className="dashboard-mobile-menu-indicator">●</span>}
                  </button>
                );
              })}

              {/* New Booking Button */}
              <button
                className="dashboard-mobile-menu-item dashboard-mobile-menu-item--new-booking"
                onClick={() => handleFilterClick({ id: 'حجز جديد' })}
                type="button"
                aria-label="حجز جديد"
              >
                <FaPlus className="dashboard-mobile-menu-icon" aria-hidden="true" />
                <span className="dashboard-mobile-menu-text">حجز جديد</span>
              </button>

            </div>
          </nav>
        </div>
      )}
    </>
  );
});

// Display name for debugging
DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;

