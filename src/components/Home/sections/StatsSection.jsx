import React, { useState, useEffect } from 'react';
import {
  FaTooth,
  FaUserMd,
  FaUsers,
  FaSmile
} from 'react-icons/fa';

function StatsSection() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب بيانات الإحصائيات من API
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('https://ghaimcenter.com/laravel/api/clinics?owner_name=د ا&salon_name=عيادة الأسنان الذهبية&rating=1&salon_categories=1,2&start_date=2025-07-04&min_price=250&max_price=300&limit=2');
        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.home_page_setting) {
          // تحليل البيانات JSON strings
          const parseJsonSafely = (jsonString) => {
            try {
              return jsonString ? JSON.parse(jsonString) : null;
            } catch (error) {
              console.error('Error parsing JSON:', error);
              return null;
            }
          };

          const homePageSettings = result.data.home_page_setting;

          const parsedData = {
            vip_clients: parseJsonSafely(homePageSettings.vip_clients),
            happy_clients: parseJsonSafely(homePageSettings.happy_clients),
            operations_room_counts: parseJsonSafely(homePageSettings.operations_room_counts),
            doctors_count: parseJsonSafely(homePageSettings.doctors_count),
            url_before_image: result.data.url_before_image
          };

          console.log('Raw API Response:', result.data);
          console.log('Home Page Settings:', homePageSettings);
          console.log('Parsed Data:', parsedData);
          console.log('VIP Clients:', parsedData.vip_clients);
          console.log('Happy Clients:', parsedData.happy_clients);
          console.log('Operations Count:', parsedData.operations_room_counts);
          console.log('Doctors Count:', parsedData.doctors_count);

          setStatsData(parsedData);
        }
      } catch (error) {
        console.error('Error fetching stats data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);


  // تحويل البيانات من API إلى الشكل المطلوب
  const stats = statsData ? [
    {
      icon: statsData.operations_room_counts?.icon ?
        <img
          src={`${statsData.url_before_image}${statsData.operations_room_counts.icon}`}
          alt="غرف العمليات"
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        /> : <FaTooth size={30} className="md:w-10 md:h-10" />,
      fallbackIcon: <FaTooth size={30} className="md:w-10 md:h-10" style={{ display: 'none' }} />,
      value: statsData.operations_room_counts?.count?.toString(),
      label: statsData.operations_room_counts?.title_ar
    },
    {
      icon: statsData.doctors_count?.icon ?
        <img
          src={`${statsData.url_before_image}${statsData.doctors_count.icon}`}
          alt="الأطباء"
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        /> : <FaUserMd size={30} className="md:w-10 md:h-10" />,
      fallbackIcon: <FaUserMd size={30} className="md:w-10 md:h-10" style={{ display: 'none' }} />,
      value: statsData.doctors_count?.count?.toString(),
      label: statsData.doctors_count?.title_ar
    },
    {
      icon: statsData.vip_clients?.icon ?
        <img
          src={`${statsData.url_before_image}${statsData.vip_clients.icon}`}
          alt="العملاء المميزين"
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        /> : <FaUsers size={30} className="md:w-10 md:h-10" />,
      fallbackIcon: <FaUsers size={30} className="md:w-10 md:h-10" style={{ display: 'none' }} />,
      value: statsData.vip_clients?.count?.toString(),
      label: statsData.vip_clients?.title_ar
    },
    {
      icon: statsData.happy_clients?.icon ?
        <img
          src={`${statsData.url_before_image}${statsData.happy_clients.icon}`}
          alt="العملاء السعداء"
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        /> : <FaSmile size={30} className="md:w-10 md:h-10" />,
      fallbackIcon: <FaSmile size={30} className="md:w-10 md:h-10" style={{ display: 'none' }} />,
      value: statsData.happy_clients?.count?.toString(),
      label: statsData.happy_clients?.title_ar
    }
  ].filter(item => item.value && item.label) : [];

  return (
    <section className="relative w-full pt-12 pb-16" dir="rtl">
      {/* الخلفية */}
      <div className="absolute inset-x-0 -bottom 20 h-[50px] bg-gradient-to-r from-[#0171bd]/10 via-[#a6c80d]/10 to-[#a6c80d]/5 -z-10" />

      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
          </div>
        ) : stats.length > 0 ? (
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-20">
            {stats.map((item, index) => (
              <div
                key={index}
                className="max-w-[160px] md:max-w-[200px] aspect-[160/180] md:aspect-[200/220] w-full bg-white rounded-lg shadow-md p-3 md:p-4 text-center hover:shadow-lg transition hover:-translate-y-1 flex flex-col justify-center items-center h-full"
              >
                <div className="flex justify-center mb-4 text-[#0171bd] relative">
                  {item.icon}
                  {item.fallbackIcon}
                </div>

                <div
                  className="text-2xl md:text-3xl font-bold text-[#a6c80d] mb-1 md:mb-2"
                >
                  {item.value}
                </div>

                <p
                  className="text-gray-600 text-center text-sm md:text-base font-medium"
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
              {loading ? 'جاري تحميل البيانات...' : 'لا توجد بيانات إحصائية متاحة حالياً'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default StatsSection;
