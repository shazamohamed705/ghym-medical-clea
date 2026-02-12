import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUniqueSlug } from '../../../utils/slugUtils';
import { FaTooth, FaMoneyBillWave, FaClock, FaMapPin, FaStar, FaPlus, FaStethoscope, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

// Services filter component - Available services list
const ServicesFilter = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('🔄 Fetching services from API...');
        
        const response = await fetch('https://ghaimcenter.com/laravel/api/clinics/services');
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Services data:', result);
          console.log('✅ Services result.data:', result.data);
          console.log('✅ Services result.data.services:', result.data?.services);
          console.log('✅ Services result.data type:', typeof result.data);
          console.log('✅ Services result.data.services isArray:', Array.isArray(result.data?.services));

          // Handle different response structures
          let servicesData = [];
          if (result.data && Array.isArray(result.data.services)) {
            servicesData = result.data.services; // New structure: result.data.services
          } else if (Array.isArray(result.data)) {
            servicesData = result.data; // Old structure: result.data
          } else if (result.data && Array.isArray(result.data.data)) {
            servicesData = result.data.data; // Alternative structure: result.data.data
          } else if (Array.isArray(result)) {
            servicesData = result; // Direct array
          }

          console.log('✅ Final services data:', servicesData);
          setServices(servicesData);
        } else {
          console.error('❌ Failed to fetch services');
          setServices([]);
        }
      } catch (error) {
        console.error('💥 Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Handle service booking - navigate to service details
  const handleServiceBooking = (service) => {
    console.log('🔄 Navigating to service details:', service.id);
    const slug = createUniqueSlug(service.title_ar || service.title, service.id);
    navigate(`/service/${slug}`);
  };

  // Filter services based on search
  const filteredServices = (Array.isArray(services) ? services : []).filter(service => {
    if (!service || !service.title_ar || !service.about_ar) return false;

    const matchesSearch = service.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.about_ar.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Calculate pagination
  const totalServices = filteredServices.length;
  const totalPages = Math.ceil(totalServices / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="services-section">
      {/* Services Header */}
      <div className="services-header">
        <h2 className="services-title">الخدمات المتاحة</h2>
      </div>

      {/* Filter and Search Bar */}
      <div className="services-filter-bar">
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="البحث في الخدمات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="ios-loading-content">
          <div className="ios-loading-spinner"></div>
          <div className="ios-loading-text">جاري تحميل الخدمات...</div>
        </div>
      )}

      {/* Services Grid */}
      {!loading && (
        <>
        <div className="services-grid">
          {paginatedServices.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <div className="service-icon" style={{ width: 48, height: 48, background: '#0171BD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaTooth className="icon-tooth" style={{ color: '#FFFFFF', fontSize: 28, lineHeight: 1, display: 'inline-block' }} />
              </div>
              <div className="service-info">
                <h3 className="service-title">{service.title_ar}</h3>
                <p className="service-subtitle">#{service.service_number}</p>
              </div>
            </div>
            
            <p className="service-description">{service.about_ar}</p>
            
            <div className="service-details">
              <div className="detail-item">
                <FaMoneyBillWave className="detail-icon" />
                <span className="detail-text">
                  {service.discount ? (
                    <>
                      <span className="old-price">{service.price} ر.س</span>
                      <span className="new-price">{service.price - (service.price * service.discount / 100)} ر.س</span>
                      <span className="discount">(خصم {service.discount}%)</span>
                    </>
                  ) : (
                    <span>{service.price > 0 ? `${service.price} ر.س` : 'اتصل للسعر'}</span>
                  )}
                </span>
              </div>
              
              <div className="detail-item">
                <FaClock className="detail-icon" />
                <span className="detail-text">{service.service_time} دقيقة</span>
              </div>
              
              <div className="detail-item">
                <FaMapPin className="detail-icon" />
                <span className="detail-text">عيادة {service.clinic?.clinic_name || service.clinic_id || service.clinics_id || service.salon_id}</span>
              </div>
              
              <div className="detail-item">
                <FaStar className="detail-icon" />
                <span className="detail-text">{service.status === 1 ? 'متاح' : 'غير متاح'}</span>
              </div>
            </div>
            
            <button
              className="book-service-btn"
              onClick={() => handleServiceBooking(service)}
            >
              <FaPlus className="btn-icon" />
              عرض التفاصيل
            </button>
          </div>
        ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <FaArrowRight style={{ fontSize: '12px' }} />
              السابق
            </button>

            {/* Page Numbers */}
            <div style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                const showPage = 
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  Math.abs(pageNum - currentPage) <= 1;
                
                const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span key={pageNum} style={{ padding: '0 6px', color: '#9ca3af', fontSize: '16px' }}>
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: pageNum === currentPage ? 'none' : '1px solid #d1d5db',
                      background: pageNum === currentPage ? '#0ea5e9' : 'white',
                      color: pageNum === currentPage ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: pageNum === currentPage ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              التالي
              <FaArrowLeft style={{ fontSize: '12px' }} />
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default ServicesFilter;

