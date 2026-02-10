import React, { useState, useEffect } from 'react';
import { customRequest } from '../../../API/apiService';

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await customRequest('/clinics/reviews');

        if (response.status === 'success' && response.data.data) {
          // تحويل البيانات لتناسب الشكل الحالي
          const formattedReviews = response.data.data.map(review => ({
            id: review.id,
            name: review.user?.fullname || 'مستخدم',
            image: review.user?.profile_image || '/Ellipse 1.png',
            rating: Math.round(review.rating), // تقريب التقييم لأقرب رقم صحيح
            text: review.comment || '',
            clinic: review.clinic?.clinic_name || ''
          }));
          setTestimonials(formattedReviews);
        }
      } catch (error) {
        console.error('خطأ في جلب التقييمات:', error);
        // في حالة الخطأ، استخدم البيانات الاحتياطية
        setTestimonials([
    {
      id: 1,
      name: 'Ahmed Mohamed',
      image: '/Ellipse 1.png',
      rating: 5,
            text: 'جئت إلى هذا المستشفى بسبب السمعة الطيبة للدكتورة جهاد، ولم أندم على ذلك.'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <section className="w-full py-16 bg-white" dir="rtl">

      <div className="container mx-auto px-4">
        <div className="max-w-[1500px] mx-auto">
          {/* العنوان */}
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 700
              }}
            >
              آراء <span className="text-[#a6c80d]">عملائنا</span>
            </h2>
            <p
              className="text-gray-600 text-lg max-w-2xl mx-auto"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 400
              }}
            >
              ما يقوله عملاؤنا عن تجربتهم معنا
            </p>
          </div>

          {/* البوكس */}
          <div className="
            flex md:grid
            md:grid-cols-4
            gap-4 md:gap-10
            overflow-x-auto md:overflow-visible
            snap-x snap-mandatory md:snap-none
            scrollbar-hide
            scroll-pl-6
            px-2
            py-8 md:py-4
          ">

            {loading ? (
              // مؤشر التحميل
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="
                    bg-white rounded-xl shadow-lg 
                    w-[80vw] sm:w-[70vw] md:w-full 
                    max-w-[350px] md:max-w-[550px]
                    min-h-[260px]
                    flex flex-col p-6 animate-pulse
                    flex-shrink-0
                    snap-center
                  "
                  style={{
                    boxShadow: '0 10px 25px rgba(0, 113, 189, 0.3), 0 4px 10px rgba(0, 113, 189, 0.2)'
                  }}
                >
                  <div className="-mt-8 md:-mt-10 mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-200"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="flex justify-center mb-3">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : (
              testimonials.map((testimonial) => (
             <div
             key={testimonial.id}
             className="
               bg-white rounded-xl shadow-lg text-center
               hover:shadow-2xl transition-all duration-300
               w-[80vw] sm:w-[70vw] md:w-full
               max-w-[350px] md:max-w-[550px]
               min-h-[260px]
               flex flex-col
               p-6
               relative
               flex-shrink-0
               snap-center
             "
             style={{
               boxShadow: '0 10px 25px rgba(0, 113, 189, 0.3), 0 4px 10px rgba(0, 113, 189, 0.2)'
             }}
           >
           
            
                   
           {/* أيقونة علامة الاقتباس */}
           <img
             src={
               testimonial.id === 1 ? '/Vector 1.png' :
               testimonial.id === 2 ? '/Inverted Commas.png' :
               testimonial.id === 3 ? '/Vector.png' :
               '/Vector.png'
             }
             alt="Quote Icon"
             className="absolute"
             style={{
               width: '40.64px',
               height: '32.51px',
               top: '35px',
               left: '16px',
               opacity: 1
             }}
           />

                {/* الصورة الدائرية */}
                <div className="-mt-8 md:-mt-10 mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-white shadow-lg">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/Ellipse 1.png';
                      }}
                    />
                  </div>
                </div>

                {/* الاسم والرتبة */}
                <h3
                  className="text-base font-bold text-gray-900 mb-1"
                  style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700
                  }}
                >
                  {testimonial.name}
                </h3>

                {/* التقييم */}
                <div className="flex justify-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>

                {/* الوصف */}
                <p
  className="text-gray-600 text-sm leading-relaxed line-clamp-6"
  style={{ fontFamily: 'Almarai' }}
>
  "{testimonial.text}"
</p>

              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
