 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getClinicsData } from '../../API/apiService';

function About() {
  const [aboutData, setAboutData] = useState({
    hero_title_ar: 'مجمع غيم الطبي',
    hero_subtitle_ar: '',
    two_image_in_hero_1: '',
    two_image_in_hero_2: '',
    url_before_image: '',
    vip_clients: null,
    happy_clients: null,
    operations_room_counts: null,
    doctors_count: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await getClinicsData();
        if (response.status === 'success' && response.data.home_page_setting) {
          setAboutData({
            hero_title_ar: response.data.home_page_setting.hero_title_ar || 'مجمع غيم الطبي',
            hero_subtitle_ar: response.data.home_page_setting.hero_subtitle_ar || '',
            two_image_in_hero_1: response.data.home_page_setting.two_image_in_hero_1 || '',
            two_image_in_hero_2: response.data.home_page_setting.two_image_in_hero_2 || '',
            url_before_image: response.data.url_before_image || '',
            vip_clients: response.data.home_page_setting.vip_clients ? JSON.parse(response.data.home_page_setting.vip_clients) : null,
            happy_clients: response.data.home_page_setting.happy_clients ? JSON.parse(response.data.home_page_setting.happy_clients) : null,
            operations_room_counts: response.data.home_page_setting.operations_room_counts ? JSON.parse(response.data.home_page_setting.operations_room_counts) : null,
            doctors_count: response.data.home_page_setting.doctors_count ? JSON.parse(response.data.home_page_setting.doctors_count) : null
          });
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات صفحة من نحن:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);
    return (
        <div className="min-h-screen  bg-gradient-to-r from-[#0171bd]/10 to-[#a6c80d]/10" dir="ltr">
          {/* Navbar */}
          <Navbar />
          <MainNavbar />
    
          {/* Banner */}
          <BannerCarousel />
    
    
          {/* Blog Content */}
          <section className="w-full ">
        {/* المحتوى */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 py-10">
          {/* الجزء الأيسر - الصور الدائرية (Ellipse 3 / Ellipse 4) */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start md:transform md:translate-x-20">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* الدائرة الكبيرة */}
              <div className="absolute top-0 left-2 w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-xl border-4 border-white">
                <img
                  src={aboutData.url_before_image && aboutData.two_image_in_hero_1 ? aboutData.url_before_image + aboutData.two_image_in_hero_1 : "/Ellipse 4.png"}
                  alt="خدمات مجمع غيم الطبي"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* الدائرة الصغيرة المتداخلة */}
              <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-lg border-4 border-white">
                <img
                  src={aboutData.url_before_image && aboutData.two_image_in_hero_2 ? aboutData.url_before_image + aboutData.two_image_in_hero_2 : "/Ellipse 3.png"}
                  alt="ابتسامة وراحة المراجعين"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* دوائر ديكورية صغيرة - زرقاء */}
              <span className="absolute top-5 right-20 w-3.5 h-3.5 rounded-full bg-[#0171bd]" />
              <span className="absolute bottom-1 right-8 w-3 h-3 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute bottom-10 right-48 w-4 h-4 rounded-full bg-[#9bc115]" />
              <span className="hidden sm:block absolute top-8 left-12 w-3 h-3 rounded-full bg-[#0171bd]" />
              
              {/* دوائر ديكورية صغيرة - خضراء */}
              <span className="absolute bottom-5 right-3 w-6 h-6 rounded-full bg-[#9bc115]" />
              {/* الدائرة الخضراء الأكبر */}
              <span className="absolute top-8 right-16 w-6 h-6 rounded-full bg-[#9bc115]" />
              <span className="hidden sm:block absolute bottom-8 right-40 w-6 h-6 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute top-40 left-5 w-6 h-6 rounded-full bg-[#0171bd]" />
              <span className="hidden sm:block absolute bottom-40 right-0 w-3 h-3 rounded-full bg-[#0171bd]" />
            </div>
          </div>

          {/* الجزء الأيمن - النص */}
          <div className="w-full md:w-1/2 text-center md:text-right md:mr-16" dir="rtl">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
              </div>
            ) : (
              <>
                {aboutData.hero_title_ar && (() => {
                  const titleParts = aboutData.hero_title_ar.split(' ');
                  const firstPart = titleParts[0] || '';
                  const restPart = titleParts.slice(1).join(' ') || '';
                  return (
                    <h2 className="mb-3 font-bold text-2xl sm:text-3xl md:text-[40px] text-center md:text-right">
                      <span className="text-black">{firstPart} </span>
                      <span className="text-[#9bc115]">{restPart}</span>
                    </h2>
                  );
                })()}
                <h3 className="mb-4 font-bold text-2xl sm:text-3xl md:text-[40px] text-center md:text-right">
                  رعاية متكاملة لجمالك وصحتك
                </h3>
                <p className="text-gray-600 max-w-4xl mx-auto md:mx-0 text-sm sm:text-base md:text-[18px] text-center md:text-justify">
                {aboutData.hero_subtitle_ar}
                </p>
              </>
            )}

            
          </div>
        </div>
      </section>

          {/* Footer */}
          <Footer />
        </div>
      );
    }
  
  export default About;