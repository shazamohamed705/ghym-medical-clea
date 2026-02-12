import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addToLocalCart } from '../../utils/cartUtils';
import { useToast } from '../Toast/ToastManager';
import { useAuth } from '../../contexts/AuthContext';
import { getDoctorsData } from '../../API/apiService';
import { extractIdFromSlug } from '../../utils/slugUtils';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

const DoctorDetails = () => {
  const { doctorSlug } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [clinicData, setClinicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageRef = useRef(null);

  // Add to Cart with Animation
  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      // Create flying image animation
      if (imageRef.current) {
        const imageElement = imageRef.current;
        const imageRect = imageElement.getBoundingClientRect();
        
        const cartIcon = document.querySelector('[data-cart-icon]');
        const cartRect = cartIcon ? cartIcon.getBoundingClientRect() : { top: 0, left: window.innerWidth };

        const flyingImage = imageElement.cloneNode(true);
        flyingImage.style.position = 'fixed';
        flyingImage.style.top = `${imageRect.top}px`;
        flyingImage.style.left = `${imageRect.left}px`;
        flyingImage.style.width = `${imageRect.width}px`;
        flyingImage.style.height = `${imageRect.height}px`;
        flyingImage.style.zIndex = '10000';
        flyingImage.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImage.style.pointerEvents = 'none';
        flyingImage.style.borderRadius = '1rem';
        
        document.body.appendChild(flyingImage);

        setTimeout(() => {
          flyingImage.style.top = `${cartRect.top}px`;
          flyingImage.style.left = `${cartRect.left}px`;
          flyingImage.style.width = '50px';
          flyingImage.style.height = '50px';
          flyingImage.style.opacity = '0.3';
        }, 50);

        setTimeout(() => {
          document.body.removeChild(flyingImage);
        }, 900);
      }

      const token = localStorage.getItem('authToken');

      // إذا لم يكن هناك token، احفظ في localStorage
      if (!token) {
        addToLocalCart({
          staff_id: doctorData.id,
          name: doctorData.name_ar || doctorData.name,
          ghaim_price: doctorData.price,
          image: doctorData.photo
        });

        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: doctorData.photo,
            title: doctorData.name_ar || doctorData.name,
            price: doctorData.price,
            id: doctorData.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/login')
        });

        setIsAddingToCart(false);
        return;
      }

      console.log('📦 Adding doctor to cart:', doctorData.id);
      console.log('📦 Request body:', { carts: [{ staff_id: doctorData.id }] });

      const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          carts: [{ staff_id: doctorData.id }]
        })
      });

      console.log('📦 Response status:', response.status);
      console.log('📦 Response headers:', response.headers.get('content-type'));

      // Try to parse response as JSON
      let result;
      try {
        const text = await response.text();
        console.log('📦 Raw response:', text.substring(0, 500));
        result = JSON.parse(text);
        console.log('📦 Parsed response:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        showError('حدث خطأ في الاتصال بالخادم');
        return;
      }

      if (result.status === true || result.status === 'success') {
        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: doctorData.photo,
            title: doctorData.name_ar || doctorData.name,
            price: doctorData.price,
            id: doctorData.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/dashboard?filter=NewBooking')
        });
        
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        showError(result.message || 'فشل إضافة الطبيب إلى السلة');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBooking = () => {
    navigate('/booking', { state: { doctorId: doctorData.id, clinicId: doctorData.clinics_id } });
  };

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      setIsLoading(true);
      setError(null);

      // Extract doctor ID from slug
      const doctorId = extractIdFromSlug(doctorSlug);
      
      if (!doctorId) {
        setError('رابط الطبيب غير صحيح');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getDoctorsData();

        if (response.status === 'success' && response.data) {
          const doctorsArray = Array.isArray(response.data) ? response.data : [];
          const doctor = doctorsArray.find(d => d.id === parseInt(doctorId));

          if (doctor) {
            setDoctorData(doctor);
            document.title = `${doctor.name_ar || doctor.name} - مجمع غيم الطبي`;

            // Fetch clinic data
            if (doctor.clinics_id) {
              try {
                const clinicResponse = await fetch(`https://ghaimcenter.com/laravel/api/clinics/${doctor.clinics_id}`);
                const clinicResult = await clinicResponse.json();
                if (clinicResult.status === 'success' && clinicResult.data) {
                  setClinicData(clinicResult.data);
                }
              } catch (err) {
                console.error('Error fetching clinic:', err);
              }
            }
          } else {
            setError('الطبيب المطلوب غير موجود');
          }
        } else {
          setError('فشل تحميل بيانات الطبيب');
        }
      } catch (error) {
        setError('حدث خطأ في الاتصال بالخادم');
        console.error('Error fetching doctor details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (doctorSlug) {
      fetchDoctorDetails();
    }
  }, [doctorSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
        <Navbar />
        <MainNavbar />
        
        <div className="flex-1 py-8 px-4">
          <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 md:p-8 min-h-[420px]">
              <div className="flex flex-col gap-8">
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[500px] md:h-[600px] bg-gray-200 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (error || !doctorData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل بيانات الطبيب</h2>
            <p className="text-gray-600 text-lg mb-8">{error || 'الطبيب غير موجود'}</p>
            <button 
              onClick={() => navigate('/doctors')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              العودة للأطباء
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasPrice = doctorData.price && Number(doctorData.price) > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
      <Navbar />
      <MainNavbar />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 md:p-8 min-h-[420px]">
            
            {/* Left Side - Doctor Information */}
            <div className="flex flex-col gap-4 md:gap-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug text-right" style={{ fontFamily: 'Almarai', fontWeight: 700 }}>
                {doctorData.name_ar || doctorData.name}
              </h1>

              <p className="text-xl font-semibold text-right" style={{ fontFamily: 'Almarai', color: '#4B5563' }}>
                {doctorData.classification || 'طبيب عام'}
              </p>

              {doctorData.docs && (
                <div className="rounded-xl p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-5 text-right" style={{ fontFamily: 'Almarai', color: '#0171BD' }}>
                    المؤهلات والشهادات
                  </h3>
                  <div 
                    className="text-sm md:text-base text-gray-700 leading-relaxed docs-content" 
                    style={{ fontFamily: 'Almarai' }}
                    dangerouslySetInnerHTML={{ __html: doctorData.docs }}
                  />
                  <style>{`
                    .docs-content ul {
                      list-style: none;
                      text-align: right;
                      direction: rtl;
                      padding: 0;
                      margin: 0;
                    }
                    .docs-content li {
                      margin-bottom: 0.75rem;
                      padding-right: 0;
                      text-align: right;
                      line-height: 1.8;
                      font-size: 1rem;
                    }
                    @media (max-width: 768px) {
                      .docs-content li {
                        margin-bottom: 0.5rem;
                        font-size: 0.875rem;
                      }
                    }
                    .docs-content li:last-child {
                      margin-bottom: 0;
                    }
                    .docs-content li span {
                      font-weight: 500 !important;
                      color: #374151;
                      display: inline;
                    }
                  `}</style>
                </div>
              )}

              {doctorData.about_ar && (
                <p className="text-base md:text-lg text-gray-600 leading-relaxed text-right" style={{ fontFamily: 'Almarai' }}>
                  {doctorData.about_ar}
                </p>
              )}

              {/* Doctor Details Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Duration Box */}
                {doctorData.slot_duration && (
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="w-6 h-6 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-1" style={{ background: '#0171BD' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Almarai' }}>دقيقة</span>
                      <span className="text-base font-bold" style={{ color: '#0171BD', fontFamily: 'Almarai' }}>{doctorData.slot_duration}</span>
                    </div>
                  </div>
                )}

                {/* Price Box */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-1" style={{ background: '#0171BD' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="16" height="16">
                      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'Almarai' }}>ريال</span>
                    <span className="text-base font-bold" style={{ color: '#0171BD', fontFamily: 'Almarai' }}>{hasPrice ? doctorData.price : '0'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buy Now Button */}
                <button 
                  onClick={handleBooking}
                  className="w-full py-3 px-6 rounded-lg font-semibold bg-white border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ borderColor: '#1F97C1', color: '#1F97C1', fontFamily: 'Almarai' }}
                >
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M29 12h-26c-0.668-0.008-1.284-0.226-1.787-0.59l0.009 0.006c-0.744-0.552-1.222-1.428-1.222-2.416 0-1.657 1.343-3 2.999-3h6c0.552 0 1 0.448 1 1s-0.448 1-1 1v0h-6c-0.552 0-1 0.448-1 1 0 0.326 0.156 0.616 0.397 0.798l0.002 0.002c0.167 0.12 0.374 0.194 0.599 0.2l0.001 0h26c0.552 0 1 0.448 1 1s-0.448 1-1 1v0zM27 12c-0.552 0-1-0.448-1-1v0-3h-3c-0.552 0-1-0.448-1-1s0.448-1 1-1v0h4c0.552 0 1 0.448 1 1v0 4c0 0.552-0.448 1-1 1v0zM29 30h-26c-1.657 0-3-1.343-3-3v0-18c0-0.552 0.448-1 1-1s1 0.448 1 1v0 18c0 0.552 0.448 1 1 1v0h25v-5c0-0.552 0.448-1 1-1s1 0.448 1 1v0 6c0 0.552-0.448 1-1 1v0zM29 18c-0.552 0-1-0.448-1-1v0-6c0-0.552 0.448-1 1-1s1 0.448 1 1v0 6c0 0.552-0.448 1-1 1v0zM31 24h-7c-2.209 0-4-1.791-4-4s1.791-4 4-4v0h7c0.552 0 1 0.448 1 1v0 6c0 0.552-0.448 1-1 1v0zM24 18c-1.105 0-2 0.895-2 2s0.895 2 2 2v0h6v-4zM25 12c-0.001 0-0.001 0-0.002 0-0.389 0-0.726-0.222-0.891-0.546l-0.003-0.006-3.552-7.106-2.306 1.152c-0.13 0.066-0.284 0.105-0.447 0.105-0.552 0-1-0.448-1-1 0-0.39 0.223-0.727 0.548-0.892l0.006-0.003 3.2-1.6c0.13-0.067 0.284-0.106 0.447-0.106 0.39 0 0.727 0.223 0.892 0.548l0.003 0.006 4 8c0.067 0.13 0.106 0.285 0.106 0.448 0 0.552-0.448 1-1 1v0zM21 12c-0.001 0-0.001 0-0.002 0-0.389 0-0.726-0.222-0.891-0.546l-0.003-0.006-3.552-7.106-15.104 7.552c-0.13 0.066-0.284 0.105-0.447 0.105-0.552 0-1-0.448-1-1 0-0.39 0.223-0.727 0.548-0.892l0.006-0.003 16-8c0.13-0.067 0.284-0.106 0.447-0.106 0.39 0 0.727 0.223 0.892 0.548l0.003 0.006 4 8c0.067 0.13 0.106 0.285 0.106 0.448 0 0.552-0.448 1-1 1-0.001 0-0.001 0-0.002 0h0z"/>
                  </svg>
                  <span>اشتري الآن</span>
                </button>

                {/* Add to Cart Button */}
                <button 
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#1F97C1', fontFamily: 'Almarai' }}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>جاري الإضافة...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      <span>إضافة للسلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Side - Doctor Image */}
            <div className="flex items-center justify-center">
              <div 
                className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img 
                  ref={imageRef}
                  src={doctorData.photo || '/imge.png'} 
                  alt={doctorData.name_ar || doctorData.name}
                  className="w-full h-full object-cover transition-all"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/imge.png';
                  }}
                />
                {/* Zoom Icon Overlay */}
                <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg backdrop-blur-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
                {clinicData && (
                  <div className="absolute bottom-5 left-5 right-5 bg-black/70 text-white p-4 rounded-xl backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-3 w-full">
                      <h2 className="text-lg font-semibold flex-1 text-right" style={{ fontFamily: 'Almarai' }}>
                        {clinicData.clinic_name || clinicData.owner_name}
                      </h2>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: '#0171BD' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H8v-2h2V9h4v2h2v2h-2v4z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Additional Information */}
          {(doctorData.policy_ar || clinicData) && (
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-right pb-2.5 relative" style={{ borderBottom: '2px solid #0171BD', fontFamily: 'Almarai' }}>
                معلومات إضافية
              </h3>
              
              <div className="flex flex-col gap-6">
                {doctorData.policy_ar && (
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-md">
                    <h4 className="text-lg font-bold text-gray-800 mb-3 text-right" style={{ fontFamily: 'Almarai' }}>سياسة الطبيب:</h4>
                    <p className="text-gray-700 leading-relaxed text-right" style={{ fontFamily: 'Almarai' }}>{doctorData.policy_ar}</p>
                  </div>
                )}

                {clinicData && (
                  <div className="grid gap-5">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-right">
                      <strong className="font-semibold ml-2.5" style={{ color: '#0171BD', fontFamily: 'Almarai' }}>العنوان:</strong>
                      <span style={{ fontFamily: 'Almarai' }}> {clinicData.clinic_address}</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-right">
                      <strong className="font-semibold ml-2.5" style={{ color: '#0171BD', fontFamily: 'Almarai' }}>الهاتف:</strong>
                      <span style={{ fontFamily: 'Almarai' }}> {clinicData.clinic_phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ zIndex: 99999 }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all"
            onClick={() => setIsLightboxOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img 
            src={doctorData.photo || '/imge.png'}
            alt={doctorData.name_ar || doctorData.name}
            className="max-w-[90%] max-h-[90%] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DoctorDetails;
