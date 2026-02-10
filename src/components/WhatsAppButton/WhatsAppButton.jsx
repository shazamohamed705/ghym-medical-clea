import React, { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

function WhatsAppButton() {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  // إذا لم تكن هناك بيانات أو لا يوجد رقم واتساب، لا تظهر الزر
  if (loading || !contactData || !contactData.whats_app_number) {
    return null;
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('مرحباً، أريد الاستفسار عن خدماتكم');
    const whatsappUrl = `https://wa.me/${contactData.whats_app_number}?text=${message}`;
    
    // Use window.location.href for better mobile compatibility
    window.location.href = whatsappUrl;
  };

  return (
    <div
      className="fixed bottom-32 right-6 z-50 group cursor-pointer"
      onClick={handleWhatsAppClick}
      style={{ zIndex: 9999 }}
    >
      {/* الزر الرئيسي */}
      <div className="relative">
        <div className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse">
          <FaWhatsapp className="text-white text-2xl" />
        </div>
        
        {/* النقاط المتحركة حول الزر */}
        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
        <div className="absolute inset-0 rounded-full border border-green-300 animate-pulse"></div>
      </div>

      {/* النص الذي يظهر عند الـ hover */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-800 text-white text-sm px-3 py-4 rounded-lg whitespace-nowrap" style={{ fontFamily: 'Almarai' }}>
          تواصل  عبر الواتساب
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppButton;