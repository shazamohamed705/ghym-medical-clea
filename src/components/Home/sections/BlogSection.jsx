import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogsData } from '../../../API/apiService';

function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogsData = async () => {
      try {
        const data = await getBlogsData();
        if (data.status === 'success' && data.data) {
          // جلب المدونة النشطة الأولى فقط
          const activeBlogs = data.data.filter(blog => blog.is_active);
          if (activeBlogs.length > 0) {
            setBlogs([activeBlogs[0]]);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المدونة:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogsData();
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
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4 text-[#a6c80d]"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700,
                lineHeight: '28.8px',
                textAlign: 'right'
              }}
            >
              مدونتنا
            </h2>
          </div>

          {/* محتوى المقالة */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* النص */}
              <div className="w-full lg:w-1/2 text-right" style={{ marginTop: '-150px' }}>
                <h3
                  className="text-3xl font-bold text-gray-900 mb-3"
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700,
                    lineHeight: '57.6px',
                    textAlign: 'right'
                  }}
                >
                  {blogs.length > 0 ? blogs[0].title_ar : 'افضل نوع بوتوكس , دليلك لاختيار الأنسب لك'}
                </h3>

                <div
                  className="text-gray-600 text-base leading-relaxed"
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 400,
                    lineHeight: '24px',
                    textAlign: 'right'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: blogs.length > 0 ? blogs[0].description_ar : 'يُعد البوتوكس من أشهر العلاجات التجميلية المستخدمة لمكافحة التجاعيد وعلامات التقدم في العمر، حيث يعمل على إرخاء العضلات المسببة للتجاعيد، مما يمنح البشرة مظهرًا أكثر شبابًا ونضارة. ومع توفر عدة أنواع من البوتوكس في الأسواق، قد يتساءل الكثيرون عن افضل نوع بوتوكس لضمان الحصول على نتائج فعالة وآمنة تدوم لفترة طويلة.'
                  }}
                />

                {/* زر اقرأ المزيد */}
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

              {/* الصور جنب بعض */}
              <div className="flex gap-4 w-full lg:w-1/2 justify-center">
                  <img
                    src="/Rectangle 4.png"
                    alt="Blog Image 1"
                    className="rounded-lg w-[220px] h-[300px] sm:w-[260px] sm:h-[340px] lg:w-[300px] lg:h-[400px]"
                    style={{
                      zIndex: 20,
                      objectFit: 'cover',
                      boxShadow: '0 35px 70px -12px rgba(0, 0, 0, 0.35)',
                      transform: 'translateY(-8px) scale(1.05)'
                    }}
                  />

                  <img
                    src="/Rectangle 5.png"
                    alt="Blog Image 2"
                    className="rounded-lg shadow-lg w-[180px] h-[240px] sm:w-[210px] sm:h-[280px] lg:w-[250px] lg:h-[320px]"
                    style={{
                      objectFit: 'cover',
                      transform: 'translateX(-10px)'
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
