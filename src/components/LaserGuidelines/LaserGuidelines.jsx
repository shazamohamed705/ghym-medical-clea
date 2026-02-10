import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';
import DOMPurify from 'dompurify';

function LaserGuidelines() {
  const navigate = useNavigate();
  const [guidelinesData, setGuidelinesData] = useState(null);
  const [loading, setLoading] = useState(true);

  // دالة لتنظيف وتأمين HTML من XSS
  const sanitizeHTML = (html) => {
    if (!html) return '';
    
    // استخدام DOMPurify لتنظيف HTML
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'title'],
      ALLOW_DATA_ATTR: false
    });
    
    return clean;
  };

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const response = await fetch('https://ghaimcenter.com/laravel/api/contact-data');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const laserSettings = result.data.find(item => item.prefix === 'lezer_settings');
          if (laserSettings) {
            setGuidelinesData(laserSettings.data);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب إرشادات الليزر:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelines();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      
      <main className="flex-grow bg-gray-50 py-12" dir="rtl">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
              <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل الإرشادات...</p>
            </div>
          ) : guidelinesData ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 
                className="text-3xl md:text-4xl font-bold text-[#0171bd] mb-6"
                style={{ fontFamily: 'Almarai', fontWeight: 700 }}
              >
                {guidelinesData.title || 'إرشادات الليزر'}
              </h1>
              
              <div 
                className="prose prose-lg max-w-none text-gray-700"
                style={{ fontFamily: 'Almarai', fontWeight: 400, lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(guidelinesData.content) }}
              />
              
              {/* زر احجز الآن */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => {
                    // التوجيه لصفحة Category مع تمرير clinic IDs
                    const clinicIds = guidelinesData.clinics_ids || [];
                    if (clinicIds.length > 0) {
                      // تمرير أول clinic ID (أو يمكن عرض كل العيادات)
                      navigate('/category', { 
                        state: { 
                          laserClinicIds: clinicIds,
                          isLaserBooking: true 
                        } 
                      });
                    } else {
                      // إذا لم توجد عيادات محددة، اذهب للحجز العادي
                      navigate('/dashboard?filter=NewBooking');
                    }
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-2xl font-bold text-lg hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{ fontFamily: 'Almarai' }}
                >
                  احجز الآن
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg" style={{ fontFamily: 'Almarai' }}>
                لا توجد إرشادات متاحة حالياً
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default LaserGuidelines;
