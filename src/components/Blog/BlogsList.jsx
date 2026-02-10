import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import BannerCarousel from '../Banner/BannerCarousel';
import Footer from '../footer/footer';
import { getBlogsData } from '../../API/apiService';

function BlogsList() {
  const [blogsData, setBlogsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogsData = async () => {
      try {
        const data = await getBlogsData();
        if (data.status === 'success' && data.data) {
          setBlogsData(data.data);
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المدونات:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogsData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <Navbar />
        <MainNavbar />
        <BannerCarousel />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a6c80d] mx-auto"></div>
            <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري التحميل...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      {/* Banner */}
      <BannerCarousel />

      {/* Blogs List Content */}
      <section className="w-full pt-24 md:pt-16 pb-16 bg-gray-50" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="max-w-[1200px] mx-auto">
            {/* العنوان الرئيسي */}
            <div className="text-center mb-8 md:mb-12">
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 text-[#0171bd]"
                style={{
                  fontFamily: 'Almarai',
                  fontWeight: 700
                }}
              >
                مدونتنا الطبية
              </h2>
              <p
                className="text-gray-600 text-lg"
                style={{
                  fontFamily: 'Almarai',
                  fontWeight: 400
                }}
              >
                اكتشف أحدث المقالات والنصائح الطبية من خبرائنا
              </p>
            </div>

            {/* شبكة المقالات */}
            <div className="fl-loop-posts grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogsData.length > 0 ? (
                blogsData.map((blog) => (
                  <article
                    key={blog.id}
                    className="fl-post clearfix bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                  >
                    {/* صورة المقالة */}
                    <div className="fl-picture relative overflow-hidden">
                      <Link to={`/blog/${blog.id}`}>
                        <img
                          src={blog.image || "/Rectangle 4.png"}
                          alt={blog.title_ar || blog.title}
                          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/Rectangle 4.png';
                          }}
                        />
                      </Link>
                    </div>

                    {/* محتوى الكارت */}
                    <div className="content p-6">
                      {/* معلومات المقالة */}
                      <div className="post-meta flex items-center gap-3 mb-3 text-xs text-gray-500">
                        {/* الفئة */}
                        <span className="fl-category">
                          <Link 
                            to="#" 
                            className="bg-[#0171bd] text-white px-2 py-1 rounded text-xs no-underline"
                          >
                            مدونة طبية
                          </Link>
                        </span>
                        {/* تاريخ النشر */}
                        {blog.created_at && (
                          <span className="fl-meta flex items-center gap-1">
                            <i className="fa fa-clock-o"></i>
                            {new Date(blog.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </span>
                        )}
                      </div>

                      {/* عنوان المقالة */}
                      <h2 className="title mb-0">
                        <Link
                          to={`/blog/${blog.id}`}
                          className="text-gray-900 hover:text-[#0171bd] transition-colors duration-200 text-lg font-bold leading-tight block no-underline"
                          style={{
                            fontFamily: 'Almarai',
                            fontWeight: 700,
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {blog.title_ar || blog.title_en}
                        </Link>
                      </h2>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 text-lg" style={{ fontFamily: 'Almarai' }}>
                    لا توجد مقالات متاحة حالياً
                  </div>
                </div>
              )}
            </div>

           
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default BlogsList;