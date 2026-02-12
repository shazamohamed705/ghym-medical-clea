import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { addToLocalCart } from '../../utils/cartUtils';
import { getClinicsServices } from '../../API/apiService';
import { useToast } from '../Toast/ToastManager';
import { useAuth } from '../../contexts/AuthContext';
import { extractIdFromSlug } from '../../utils/slugUtils';
import Navbar from '../Navbar/Navbar';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

const ServiceDetails = () => {
  const { serviceSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [serviceData, setServiceData] = useState(null);
  const [clinicData, setClinicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageRef = useRef(null);

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Add to Cart with Animation
  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      // Create flying image animation
      if (imageRef.current) {
        const imageElement = imageRef.current;
        const imageRect = imageElement.getBoundingClientRect();
        
        // Find cart icon in navbar
        const cartIcon = document.querySelector('[data-cart-icon]');
        if (!cartIcon) {
          console.error('Cart icon not found');
        }
        
        const cartRect = cartIcon ? cartIcon.getBoundingClientRect() : { top: 0, left: window.innerWidth };

        // Create flying image clone
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

        // Trigger animation
        setTimeout(() => {
          flyingImage.style.top = `${cartRect.top}px`;
          flyingImage.style.left = `${cartRect.left}px`;
          flyingImage.style.width = '50px';
          flyingImage.style.height = '50px';
          flyingImage.style.opacity = '0.3';
        }, 50);

        // Remove flying image after animation
        setTimeout(() => {
          document.body.removeChild(flyingImage);
        }, 900);
      }

      // Add to cart API call
      const token = localStorage.getItem('authToken');
      
      // Get service image
      const getLatestServiceImage = () => {
        if (!serviceData.images || serviceData.images.length === 0) {
          return '/imge.png';
        }
        const sortedImages = [...serviceData.images].sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB - dateA;
        });
        return sortedImages[0].image;
      };
      const serviceImage = getLatestServiceImage() || clinicData?.owner_photo;

      console.log('📦 Adding to cart with quantity:', quantity);
      console.log('📦 Service ID:', serviceData.id);

      // إذا لم يكن هناك token، احفظ في localStorage
      if (!token) {
        // Add multiple items to local cart based on quantity
        for (let i = 0; i < quantity; i++) {
          addToLocalCart({
            service_id: serviceData.id,
            title_ar: serviceData.title_ar || serviceData.title,
            title: serviceData.title,
            price: serviceData.price,
            image: serviceImage,
            images: serviceData.images,
            about_ar: serviceData.about_ar
          });
        }

        // Show custom cart success toast
        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: serviceImage,
            title: serviceData.title_ar || serviceData.title,
            price: serviceData.price * quantity,
            id: serviceData.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/login')
        });
        
        // Reset quantity
        setQuantity(1);
        setIsAddingToCart(false);
        return;
      }

      // Add to cart API call - send multiple requests for quantity
      const requests = [];
      
      for (let i = 0; i < quantity; i++) {
        requests.push(
          fetch('https://ghaimcenter.com/laravel/api/user/cart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              carts: [{ service_id: serviceData.id }]
            })
          })
          .then(response => response.json())
          .then(result => ({ success: result.status === true || result.status === 'success', result }))
          .catch(error => ({ success: false, error }))
        );
      }

      // Wait for all requests to complete
      const results = await Promise.all(requests);
      
      const successCount = results.filter(r => r.success).length;

      console.log(`📦 Completed: ${successCount} success`);

      if (successCount > 0) {
        // Show custom cart success toast
        showSuccess('تمت الإضافة إلى سلة التسوق', {
          isCartToast: true,
          serviceData: {
            image: serviceImage,
            title: serviceData.title_ar || serviceData.title,
            price: serviceData.price * quantity,
            id: serviceData.id
          },
          onViewCart: () => navigate('/cart'),
          onCheckout: () => navigate('/dashboard?filter=NewBooking')
        });
        
        // Update cart count in navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Reset quantity
        setQuantity(1);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('حدث خطأ في الاتصال');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Fetch service and salon details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      setError(null);

      // Extract service ID from slug
      const serviceId = extractIdFromSlug(serviceSlug);
      
      if (!serviceId) {
        setError('رابط الخدمة غير صحيح');
        setIsLoading(false);
        return;
      }

      // Check if service data is passed from search results
      if (location.state && location.state.service) {
        const service = location.state.service;
        console.log('✅ Service data received from search:', service);
        setServiceData(service);
        
        // If clinic data is available in the service object
        if (service.clinic) {
          setClinicData(service.clinic);
          console.log('✅ Clinic data from service:', service.clinic);
        }
        
        // Update page title
        document.title = `${service.title_ar || service.title} - مجمع غيم الطبي`;
        
        setIsLoading(false);
        return;
      }

      // Fallback to API fetch if no state data
      try {
        console.log(`Fetching service details for service ID: ${serviceId}`);
        const result = await getClinicsServices();
        console.log('Clinics Services Response:', result);

        if (result.status === 'success' && result.data && result.data.services) {
          // Find the service by serviceId
          const service = result.data.services.find(s => s.id === parseInt(serviceId));

          if (service) {
            setServiceData(service);
            setClinicData(service.clinic); // Set clinic data from service.clinic
            console.log('✅ Service found:', service);
            console.log('✅ Clinic data:', service.clinic);
            
            // Update page title
            document.title = `${service.title_ar || service.title} - مجمع غيم الطبي`;
          } else {
            setError('الخدمة المطلوبة غير موجودة');
            console.error('❌ Service not found');
          }
        } else {
          setError('فشل تحميل بيانات الخدمة');
        }
      } catch (error) {
        setError('حدث خطأ في الاتصال بالخادم');
        console.error('❌ Error fetching service details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceSlug) {
      fetchServiceDetails();
    }
  }, [serviceSlug, location.state]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
        <Navbar />
        <MainNavbar />
        
        {/* Skeleton Loading */}
        <div className="flex-1 py-8 px-4">
          <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            
            {/* Service Details Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 md:p-8 min-h-[420px]">
              
              {/* Left Side Skeleton */}
              <div className="flex flex-col gap-8">
                {/* Title Skeleton */}
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full"></div>
                </div>

                {/* Description Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                </div>

                {/* Details Boxes Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-3 h-16 animate-pulse"></div>
                  <div className="bg-gray-100 rounded-xl p-3 h-16 animate-pulse"></div>
                </div>
              </div>

              {/* Right Side - Image Skeleton */}
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[500px] md:h-[600px] bg-gray-200 rounded-2xl animate-pulse">
                  {/* Overlay Skeleton */}
                  <div className="absolute bottom-5 left-5 right-5 bg-gray-300 rounded-xl h-16 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Clinic Information Skeleton */}
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              {/* Title Skeleton */}
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-48 mb-6"></div>
              
              <div className="flex flex-col gap-6">
                {/* Basic Info Card Skeleton */}
                <div className="p-6 bg-white rounded-2xl border border-gray-200">
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
                
                {/* Details Cards Skeleton */}
                <div className="grid gap-5">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 h-16 animate-pulse"></div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 h-16 animate-pulse"></div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 h-32 animate-pulse"></div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 h-24 animate-pulse"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (error || !serviceData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل الخدمة</h2>
            <p className="text-gray-600 text-lg mb-8">{error || 'الخدمة غير موجودة'}</p>
            <button 
              onClick={() => window.history.back()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              العودة للخدمات
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Use owner_photo as the main service image (fallback to service images)
  // Get the latest service image based on created_at or updated_at
  const getLatestServiceImage = () => {
    if (!serviceData.images || serviceData.images.length === 0) {
      return '/imge.png';
    }
    
    // Sort images by created_at (newest first) or use the first one if no date
    const sortedImages = [...serviceData.images].sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at || 0);
      const dateB = new Date(b.created_at || b.updated_at || 0);
      return dateB - dateA; // Newest first
    });
    
    return sortedImages[0].image;
  };

  const serviceImage = getLatestServiceImage() || clinicData?.owner_photo;
  
  // Debug logging to check image sources
  console.log('🖼️ Image Debug Info:');
  console.log('- serviceData.images:', serviceData?.images);
  console.log('- clinicData.owner_photo:', clinicData?.owner_photo);
  console.log('- Final serviceImage:', serviceImage);

  const hasPrice = serviceData.price && Number(serviceData.price) > 0;

  // Saudi Riyal Icon Component
  const SaudiRiyalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="15" height="15" aria-label="Saudi Riyal" title="Saudi Riyal" className="inline-block align-middle">
      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr">
      {/* Navbar */}
      <Navbar />
      <MainNavbar />

      {/* Toast Container for Success Message */}
      <style>{`
        @keyframes flyToCart {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(0.7) rotate(10deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.3) rotate(20deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Main Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Service Details Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 md:p-8 min-h-[420px]">
            
            {/* Left Side - Service Information */}
            <div className="flex flex-col gap-4 md:gap-8">
              {/* Service Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight text-right">
                {serviceData.title_ar || serviceData.title}
              </h1>

              {/* Service Description */}
              <p className="text-base md:text-lg text-gray-600 leading-relaxed text-right">
                {serviceData.about_ar || serviceData.about || 'خدمة متميزة بأحدث التقنيات'}
              </p>

              {/* Service Details Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Duration Box */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-1" style={{ background: '#0171BD' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600">دقيقة</span>
                    <span className="text-base font-bold" style={{ color: '#0171BD' }}>{serviceData.service_time}</span>
                  </div>
                </div>

                {/* Price Box */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-1" style={{ background: '#0171BD' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="16" height="16" aria-label="Saudi Riyal" title="Saudi Riyal">
                      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600">ريال</span>
                    <span className="text-base font-bold" style={{ color: '#0171BD' }}>{hasPrice ? serviceData.price : '0'}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-3 flex-row-reverse">
                <span className="text-sm text-gray-600 font-medium">الكمية</span>
                <div className="flex items-center bg-white rounded-lg border border-gray-300 overflow-hidden">
                  <button 
                    onClick={handleDecreaseQuantity}
                    className="w-10 h-10 flex items-center justify-center transition-all hover:bg-gray-50"
                    style={{ color: '#0171BD' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <span className="w-14 text-center font-bold text-lg" style={{ color: '#0171BD' }}>
                    {quantity}
                  </span>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button 
                    onClick={handleIncreaseQuantity}
                    className="w-10 h-10 flex items-center justify-center transition-all hover:bg-gray-50"
                    style={{ color: '#0171BD' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buy Now Button */}
                <button 
                  className="w-full py-3 px-6 rounded-lg font-semibold bg-white border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ borderColor: '#1F97C1', color: '#1F97C1' }}
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
                  style={{ background: '#1F97C1' }}
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

            {/* Right Side - Service Image with Overlay */}
            <div className="flex items-center justify-center">
              <div 
                className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img 
                  ref={imageRef}
                  src={serviceImage} 
                  alt={serviceData.title_ar || serviceData.title}
                  className="w-full h-full object-cover transition-all"
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', serviceImage);
                  }}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', serviceImage);
                    console.error('❌ Error details:', e);
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
                {/* Clinic Name Overlay */}
                <div className="absolute bottom-5 left-5 right-5 bg-black/70 text-white p-4 rounded-xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3 w-full">
                    <h2 className="text-lg font-semibold flex-1 text-right">
                      {clinicData?.clinic_name || clinicData?.salon_name || 'اسم العيادة'}
                    </h2>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: '#0171BD' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinic Information Section */}
          {clinicData && (
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-right pb-2.5 relative" style={{ borderBottom: '2px solid #0171BD' }}>
                معلومات العيادة
                <span className="absolute bottom-[-2px] right-0 w-15 h-0.5" style={{ background: '#0171BD' }}></span>
              </h3>
              
              <div className="flex flex-col gap-6">
                {/* Clinic Basic Info */}
                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="text-right">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">{clinicData.clinic_name || clinicData.salon_name}</h4>
                    <p className="text-base text-gray-600 mb-2.5 font-medium">{clinicData.owner_name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"></div>
                      <div className="flex items-center gap-1 text-lg font-bold" style={{ color: '#0171BD' }}>
                        {serviceData.price && Number(serviceData.price) > 0 ? (
                          <>
                            <span>{serviceData.price}</span>
                            <SaudiRiyalIcon />
                          </>
                        ) : (
                          <span>اتصل للسعر</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Clinic Details */}
                <div className="grid gap-5">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm text-gray-700 text-right" style={{ '--hover-border': '#0171BD' }}>
                    <strong className="font-semibold ml-2.5" style={{ color: '#0171BD' }}>العنوان:</strong> {clinicData.clinic_address || clinicData.salon_address}
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm text-gray-700 text-right">
                    <strong className="font-semibold ml-2.5" style={{ color: '#0171BD' }}>الهاتف:</strong> {clinicData.clinic_phone || clinicData.salon_phone}
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm text-gray-700 text-right">
                    <strong className="font-semibold ml-2.5" style={{ color: '#0171BD' }}>ساعات العمل:</strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 direction-rtl">
                      {clinicData.work_times && clinicData.work_times.length > 0 ? (
                        clinicData.work_times.map((workTime, index) => (
                          <span key={index} className="p-2.5 bg-gray-100 rounded-lg text-sm text-gray-700 border-r-[3px] text-right" style={{ borderRightColor: '#0171BD' }}>
                            {workTime.day_name === 'monday' && 'الاثنين'}
                            {workTime.day_name === 'tuesday' && 'الثلاثاء'}
                            {workTime.day_name === 'wednesday' && 'الأربعاء'}
                            {workTime.day_name === 'thursday' && 'الخميس'}
                            {workTime.day_name === 'friday' && 'الجمعة'}
                            {workTime.day_name === 'saturday' && 'السبت'}
                            {workTime.day_name === 'sunday' && 'الأحد'}
                            : {workTime.from} - {workTime.to}
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="p-2.5 bg-gray-100 rounded-lg text-sm text-gray-700 border-r-[3px] border-blue-500 text-right">
                            السبت - الخميس: {clinicData.mon_fri_from?.slice(0,2)}:{clinicData.mon_fri_from?.slice(2,4)} - {clinicData.mon_fri_to?.slice(0,2)}:{clinicData.mon_fri_to?.slice(2,4)}
                          </span>
                          <span className="p-2.5 bg-gray-100 rounded-lg text-sm text-gray-700 border-r-[3px] border-blue-500 text-right">
                            الجمعة: {clinicData.sat_sun_from?.slice(0,2)}:{clinicData.sat_sun_from?.slice(2,4)} - {clinicData.sat_sun_to?.slice(0,2)}:{clinicData.sat_sun_to?.slice(2,4)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {clinicData.clinic_about && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-500 text-sm text-gray-700 text-right">
                      <strong className="text-blue-600 font-semibold ml-2.5">عن العيادة:</strong>
                      <p className="mt-3 leading-relaxed text-gray-700 text-[15px] p-4 bg-gray-50 rounded-lg border-r-[3px] border-blue-500">{clinicData.clinic_about}</p>
                    </div>
                  )}
                </div>
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
            src={serviceImage}
            alt={serviceData.title_ar || serviceData.title}
            className="max-w-[90%] max-h-[90%] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ServiceDetails;
