import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContactData } from '../../../API/apiService';

function BlogSection() {
  const [blogData, setBlogData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // دالة لتقصير النص
  const truncateText = (htmlText, maxLength = 200) => {
    if (!htmlText) return '';
    // إزالة HTML tags
    const textOnly = htmlText.replace(/<[^>]*>/g, '');
    // إزالة HTML entities مثل &nbsp; &amp; وغيرها
    const cleanText = textOnly
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-z]+;/gi, ' ') // أي HTML entity تانية
      .replace(/\s+/g, ' ') // تنظيف المسافات الزيادة
      .trim();
    
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const data = await getContactData();
        console.log('📊 Contact Data API Response:', data);
        if (data.status === 'success' && data.data) {
          // البحث عن info_about_us في البيانات
          const infoAboutUs = data.data.find(item => item.prefix === 'info_about_us');
          if (infoAboutUs && infoAboutUs.data) {
            console.log('📝 Info About Us Data:', infoAboutUs.data);
            setBlogData(infoAboutUs.data);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المدونة:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, []);
  if (isLoading) {
    return (
      <section className="w-full py-16 bg-white" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="max-w-[1500px] mx-auto flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a6c80d] mx-auto"></div>
              <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري التحميل...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 bg-white" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="max-w-[1500px] mx-auto">
          {/* العنوان الرئيسي */}
          <div className="text-center md:text-right mb-8 md:mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4 text-[#a6c80d]"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700,
                lineHeight: '28.8px'
              }}
            >
              مدونتنا
            </h2>
          </div>

          {/* محتوى المقالة */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* النص */}
              <div className="w-full lg:w-1/2 text-center lg:text-right lg:-mt-[150px]">
                <h3
                  className="text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-3 text-center lg:text-right"
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700,
                    lineHeight: '1.4'
                  }}
                >
                  {blogData?.title || 'افضل نوع بوتوكس , دليلك لاختيار الأنسب لك'}
                </h3>

                <div
                  className="text-gray-600 text-sm md:text-base leading-relaxed line-clamp-3 text-center lg:text-right"
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 400,
                    lineHeight: '24px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: blogData?.description 
                      ? truncateText(blogData.description, 250)
                      : 'يُعد البوتوكس من أشهر العلاجات التجميلية المستخدمة لمكافحة التجاعيد وعلامات التقدم في العمر، حيث يعمل على إرخاء العضلات المسببة للتجاعيد...'
                  }}
                />

                {/* زر اقرأ المزيد */}
                <div className="flex justify-center lg:justify-start">
                  <Link
                    to="/blog"
                    className="mt-6 px-5 py-2.5 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors duration-300 text-sm font-semibold inline-flex items-center gap-2"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    اقرأ المزيد
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </Link>
                </div>

              </div>

              {/* الصور جنب بعض */}
              <div className="flex gap-4 w-full lg:w-1/2 justify-center">
                  <img
                    src={blogData?.first_image || "/Rectangle 4.png"}
                    alt="Blog Image 1"
                    className="rounded-lg w-[220px] h-[300px] sm:w-[260px] sm:h-[340px] lg:w-[300px] lg:h-[400px]"
                    style={{
                      zIndex: 20,
                      objectFit: 'cover',
                      boxShadow: '0 35px 70px -12px rgba(0, 0, 0, 0.35)',
                      transform: 'translateY(-8px) scale(1.05)'
                    }}
                    onError={(e) => {
                      e.target.src = '/Rectangle 4.png'; // Fallback image
                    }}
                  />

                  <img
                    src={blogData?.second_image || "/Rectangle 5.png"}
                    alt="Blog Image 2"
                    className="rounded-lg shadow-lg w-[180px] h-[240px] sm:w-[210px] sm:h-[280px] lg:w-[250px] lg:h-[320px]"
                    style={{
                      objectFit: 'cover',
                      transform: 'translateX(-10px)'
                    }}
                    onError={(e) => {
                      e.target.src = '/Rectangle 5.png'; // Fallback image
                    }}
                  />
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogSection;
