import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

function TermsOfService() {
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTermsOfService = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ghaimcenter.com/laravel/api/terms');
        const result = await response.json();
        
        // دالة فك ترميز HTML
        const decodeHTML = (html) => {
          const txt = document.createElement('textarea');
          txt.innerHTML = html;
          return txt.value;
        };
        
        if (result.messages === 'success' && result.data) {
          // فك ترميز HTML entities قبل العرض
          setTermsContent(decodeHTML(result.data));
        } else {
          setError('فشل في تحميل شروط الخدمة');
        }
      } catch (error) {
        console.error('خطأ في جلب شروط الخدمة:', error);
        setError('حدث خطأ في تحميل شروط الخدمة');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsOfService();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'Almarai', fontWeight: 700 }}
            >
              شروط الخدمة
            </h1>
            <p 
              className="text-lg text-gray-600"
              style={{ fontFamily: 'Almarai', fontWeight: 400 }}
            >
              يرجى قراءة شروط الخدمة بعناية قبل استخدام خدمات مجمع غيم الطبي
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd] mx-auto mb-4"></div>
                <p 
                  className="text-gray-600"
                  style={{ fontFamily: 'Almarai', fontWeight: 400 }}
                >
                  جاري تحميل شروط الخدمة...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p 
                  className="text-red-600 text-lg"
                  style={{ fontFamily: 'Almarai', fontWeight: 400 }}
                >
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-[#0171bd] text-white rounded-lg hover:bg-[#015a99] transition-colors"
                  style={{ fontFamily: 'Almarai', fontWeight: 600 }}
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div 
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                style={{ fontFamily: 'Almarai', fontWeight: 400, lineHeight: '1.8' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: termsContent }}
                  className="terms-content"
                />
              </div>
            )}
          </div>

          {/* Contact Info */}
          {!loading && !error && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 
                className="text-xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: 'Almarai', fontWeight: 700 }}
              >
                للاستفسارات حول شروط الخدمة
              </h3>
              <p 
                className="text-gray-700 mb-2"
                style={{ fontFamily: 'Almarai', fontWeight: 400 }}
              >
                إذا كان لديك أي استفسارات حول شروط الخدمة هذه، يرجى التواصل معنا:
              </p>
              <div className="flex flex-col gap-2 text-gray-700">
                <div className="flex items-center gap-2" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaEnvelope className="text-[#0171bd] text-lg flex-shrink-0" />
                  <span>البريد الإلكتروني: info@ghaimcenter.com</span>
                </div>
                <div className="flex items-center gap-2" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaPhone className="text-[#0171bd] text-lg flex-shrink-0" />
                  <span>الهاتف: 920016465</span>
                </div>
                <div className="flex items-center gap-2" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaMapMarkerAlt className="text-[#0171bd] text-lg flex-shrink-0" />
                  <span>العنوان: شارع القاسم بن أمية، حي الحمدانية، جدة، المملكة العربية السعودية</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Custom Styles for Terms Content */}
      <style jsx>{`
        .terms-content h1,
        .terms-content h2,
        .terms-content h3,
        .terms-content h4,
        .terms-content h5,
        .terms-content h6 {
          font-family: 'Almarai', sans-serif;
          font-weight: 700;
          color: #1f2937;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .terms-content h1 {
          font-size: 2rem;
        }

        .terms-content h2 {
          font-size: 1.75rem;
        }

        .terms-content h3 {
          font-size: 1.5rem;
        }

        .terms-content p {
          font-family: 'Almarai', sans-serif;
          font-weight: 400;
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .terms-content ul,
        .terms-content ol {
          font-family: 'Almarai', sans-serif;
          font-weight: 400;
          margin-bottom: 1rem;
          padding-right: 1.5rem;
        }

        .terms-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .terms-content strong,
        .terms-content b {
          font-weight: 700;
        }

        .terms-content a {
          color: #0171bd;
          text-decoration: underline;
        }

        .terms-content a:hover {
          color: #015a99;
        }
      `}</style>
    </div>
  );
}

export default TermsOfService;