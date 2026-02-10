import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { getClinicsData } from '../../../API/apiService';

function WhyChooseSection() {
  const [whyUsData, setWhyUsData] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWhyUsData = async () => {
      try {
        const data = await getClinicsData();
        if (data.status === 'success' && data.data?.home_page_setting?.why_us) {
          const whyUsParsed = JSON.parse(data.data.home_page_setting.why_us);
          setWhyUsData(whyUsParsed);
          setBaseUrl(data.data.url_before_image || '');
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات لماذا تختارنا:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWhyUsData();
  }, []);
  if (isLoading) {
    return (
      <section
        className="relative w-full py-16 bg-gradient-to-r from-[#0171bd]/10 via-[#a6c80d]/20 to-[#a6c80d]/5 -z-10"
        dir="rtl"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd] mx-auto"></div>
              <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري التحميل...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full py-24 md:py-16 bg-gradient-to-r from-[#0171bd]/10 via-[#a6c80d]/20 to-[#a6c80d]/5 -z-10"
      dir="rtl"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* المحتوى */}
          <div className="text-right mb-10 md:mb-0">
            <h3
              className="mb-2"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700,
                fontSize: '32px',
                lineHeight: '41.6px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}
            >
               <span className="text-gray-900">لماذا تختار</span> <span className="text-[#a6c80d]">مجمع غيم الطبي؟</span>
               </h3>

            <p
              className="text-gray-600 mb-6"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '27px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}
            >
              {whyUsData?.title_ar || 'رعاية طبية متكاملة بجودة عالية وخدمات تناسب جميع احتياجاتك'}
            </p>

            <div className="space-y-3">
              {whyUsData?.points && whyUsData.points.length > 0 ? (
                whyUsData.points.map((point, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm overflow-hidden w-full md:w-[550px] min-h-[65px] md:h-[65px]"
                    style={{
                      borderRightWidth: '8px',
                      borderRightColor: '#0171bd'
                    }}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[#0171bd] text-xs">
                      <FaCheck />
                    </span>
                    <span
                      style={{
                        color: '#292929',
                        fontFamily: 'Almarai',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '24px',
                        letterSpacing: '0%',
                        textAlign: 'right',
                        verticalAlign: 'middle'
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))
              ) : (
                // النقاط الافتراضية إذا لم تكن هناك نقاط من الـ API
                [
                  'مجمع طبي متكامل يضم نخبة من المختصين والاستشاريين',
                  'كل ما تحتاجه من تخصصات الأسنان والجلدية في مكان واحد',
                  'أحدث الأجهزة والتقنيات الطبية المتطورة',
                  'عروض وخصومات دورية على الخدمات',
                  'إمكانية الدفع بالتقسيط عبر بنوك مختارة'
                ].map((item, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm overflow-hidden w-full md:w-[550px] min-h-[65px] md:h-[65px]"
                    style={{
                      borderRightWidth: '8px',
                      borderRightColor: '#0171bd'
                    }}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[#0171bd] text-xs">
                      <FaCheck />
                    </span>
                    <span
                      style={{
                        color: '#292929',
                        fontFamily: 'Almarai',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '24px',
                        letterSpacing: '0%',
                        textAlign: 'right',
                        verticalAlign: 'middle'
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* الصور */}
          <div className="relative w-full flex flex-col items-center gap-6 md:flex-row md:justify-end mt-10 md:mt-0 mb-20 md:mb-0 -translate-x-8 md:translate-x-0">

            {/* الصورة الكبيرة */}
            <div className="
              relative
              w-[70%] h-[300px]
              sm:w-[380px] sm:h-[380px]
              md:w-[250px]
              rounded-2xl shadow-lg p-2
            ">
              <img
                src={whyUsData?.images && whyUsData.images.length > 0 ? baseUrl + whyUsData.images[0] : "/Rectangle 4.png"}
                alt="clinic"
                className="w-full h-full object-cover"
              />

              {/* الشكل الأخضر مثلث الشكل مفرغ */}
              {/* الشكل الأخضر في اليمين العلوي */}
              <span
                className="absolute border-r-8 border-t-8 border-[#a6c80d]"
                style={{
                  zIndex: -1,
                  width: '150px',
                  height: '120px',
                  right: '0px',
                  top: '0px',
                  borderRadius: '16px'
                }}
              />

              {/* الشكل الأزرق في اليسار السفلي */}
              <span
                className="absolute border-l-8 border-b-8 border-[#0171bd]"
                style={{
                  zIndex: -2,

                  width: '120px',
                  height: '100px',
                  left: '0px',
                  bottom: '0px',
                  borderRadius: '16px'
                }}
              />
            </div>

            {/* الصورة الصغيرة */}
            <div className="
              absolute
              -bottom-32 -left-10
              w-[50%] h-[180px]
              sm:w-[200px] sm:h-[240px] sm:-bottom-36 sm:-left-20
              md:-bottom-10 md:-left-40
              md:w-[200px]
              rounded-2xl overflow-hidden shadow-lg p-2
            " style={{ zIndex: -3 }}>
              <img
                src={whyUsData?.images && whyUsData.images.length > 1 ? baseUrl + whyUsData.images[1] : "/Rectangle 5.png"}
                alt="smile"
                className="w-full h-full object-cover"
              />

              {/* الشكل الأزرق على الصورة الصغيرة */}
              <span
                className="absolute border-l-8 border-t-8 border-[#0171bd]"
                style={{

                  zIndex: -1.5,

                  width: '100px',
                  height: '70px',
                  left: '0px',
                  top: '0px',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default WhyChooseSection;
