import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastManager';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});

  // جلب عناصر السلة
  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('📦 Cart API Response:', result);
          
          // التعامل مع أشكال مختلفة من الـ response
          let items = [];
          
          // API بيرجع status: true مش status: 'success'
          if (result.status === true || result.status === 'success') {
            // حاول الوصول للبيانات بطرق مختلفة
            if (result.data && Array.isArray(result.data)) {
              items = result.data;
            } else if (result.data && result.data.cart && Array.isArray(result.data.cart)) {
              items = result.data.cart;
            } else if (result.data && result.data.items && Array.isArray(result.data.items)) {
              items = result.data.items;
            } else if (result.cart && Array.isArray(result.cart)) {
              items = result.cart;
            }
          }
          
          console.log('📦 Processed cart items:', items);
          
          // طباعة تفاصيل أول item للتأكد من البنية
          if (items.length > 0) {
            console.log('📦 First cart item structure:', items[0]);
            console.log('📦 Service data:', items[0].service);
            console.log('📦 Images data:', items[0].service?.images);
          }
          
          setCartItems(items);
        } else {
          const errorData = await response.json();
          console.error('❌ Cart API Error:', errorData);
          showError('حدث خطأ في تحميل السلة');
        }
      } catch (error) {
        console.error('❌ Error fetching cart:', error);
        showError('حدث خطأ في الاتصال');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, navigate, showError]);

  // حذف عنصر من السلة
  const handleRemoveItem = async (itemId) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    setRemoving(prev => ({ ...prev, [itemId]: true }));

    try {
      const response = await fetch(`https://ghaimcenter.com/laravel/api/user/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('🗑️ Delete response:', result);

      if (response.ok && (result.status === true || result.status === 'success')) {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        showSuccess('تم حذف العنصر من السلة');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        showError(result.message || 'حدث خطأ أثناء حذف العنصر');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showError('حدث خطأ في الاتصال');
    } finally {
      setRemoving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // الانتقال للحجز
  const handleCheckout = () => {
    navigate('/dashboard?filter=NewBooking');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <main className="flex-grow py-8 md:py-12" dir="rtl">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-8"
            style={{ fontFamily: 'Almarai', fontWeight: 700 }}
          >
            سلة التسوق
          </h1>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0171bd]"></div>
              <p className="mt-4 text-gray-600" style={{ fontFamily: 'Almarai' }}>جاري تحميل السلة...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Almarai' }}>
                السلة فارغة
              </h2>
              <p className="text-gray-500 mb-6" style={{ fontFamily: 'Almarai' }}>
                لم تقم بإضافة أي خدمات للسلة بعد
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300"
                style={{ fontFamily: 'Almarai' }}
              >
                تصفح الخدمات
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  {/* صورة الخدمة */}
                  <div className="w-full md:w-32 h-32 flex-shrink-0">
                    <img
                      src={
                        item.service?.images?.[0]?.image || 
                        item.service?.image || 
                        (item.service?.images && item.service.images.length > 0 ? item.service.images[0] : null) ||
                        '/1.png'
                      }
                      alt={item.service?.title_ar || item.service?.title || 'خدمة'}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        console.log('❌ Image failed to load:', e.target.src);
                        console.log('📦 Item data:', item);
                        e.target.src = '/1.png';
                      }}
                    />
                  </div>

                  {/* معلومات الخدمة */}
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold text-gray-900 mb-2"
                      style={{ fontFamily: 'Almarai', fontWeight: 700 }}
                    >
                      {item.service?.title_ar || item.service?.title}
                    </h3>
                    
                    {item.service?.about_ar && (
                      <p 
                        className="text-gray-600 text-sm mb-2"
                        style={{ fontFamily: 'Almarai' }}
                      >
                        {item.service.about_ar}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {item.staff?.name && (
                        <span style={{ fontFamily: 'Almarai' }}>
                          الطبيب: {item.staff.name}
                        </span>
                      )}
                      {item.service?.service_time && (
                        <span style={{ fontFamily: 'Almarai' }}>
                          المدة: {item.service.service_time} دقيقة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* السعر وزر الحذف */}
                  <div className="flex md:flex-col items-center md:items-end gap-4 w-full md:w-auto">
                    {item.service?.price && (
                      <div className="text-2xl font-bold text-[#0171bd] flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                        {item.service.price}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="20" height="20" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removing[item.id]}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      {removing[item.id] ? 'جاري الحذف...' : 'حذف'}
                    </button>
                  </div>
                </div>
              ))}

              {/* زر إتمام الحجز */}
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-gray-600 mb-2" style={{ fontFamily: 'Almarai' }}>
                    عدد الخدمات: {cartItems.length}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                    الإجمالي: {cartItems.reduce((sum, item) => sum + (parseFloat(item.service?.price) || 0), 0).toFixed(2)}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="24" height="24" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                    </svg>
                  </p>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold text-lg hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: 'Almarai' }}
                >
                  اتمام الشراء 
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default Cart;
