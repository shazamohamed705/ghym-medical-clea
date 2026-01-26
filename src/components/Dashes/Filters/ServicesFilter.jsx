import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTooth, FaMoneyBillWave, FaClock, FaMapPin, FaStar, FaPlus, FaStethoscope } from 'react-icons/fa';

// Services filter component - Available services list
const ServicesFilter = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    console.log('🔄 Navigating to service details:', service.id, 'Clinic ID:', service.clinics_id);
    navigate(`/service/${service.clinics_id}/${service.id}`);
  };

  // Filter services based on search and category
  const filteredServices = (Array.isArray(services) ? services : []).filter(service => {
    if (!service || !service.title_ar || !service.about_ar) return false;

    const matchesSearch = service.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.about_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category_id.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
        <div className="filter-dropdown">
          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">جميع الخدمات</option>
            <option value="1">علاج الأسنان</option>
            <option value="2">تقويم الأسنان</option>
          </select>
          <span className="dropdown-arrow">▼</span>
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
        <div className="services-grid">
          {filteredServices.map((service) => (
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
      )}
    </div>
  );
};

export default ServicesFilter;

