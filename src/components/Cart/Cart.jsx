import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastManager';
import { getLocalCart, removeFromLocalCart } from '../../utils/cartUtils';
import { createUniqueSlug } from '../../utils/slugUtils';
import MainNavbar from '../Navbar/MainNavbar';
import Footer from '../footer/footer';

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [localCartItems, setLocalCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    document.title = 'سلة التسوق - مجمع غيم الطبي';
  }, []);

  // جلب عناصر السلة (محلية + API)
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        
        // جلب السلة المحلية
        const localCart = getLocalCart();
        setLocalCartItems(localCart);
        
        // جلب السلة من API إذا كان المستخدم مسجل دخول
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const result = await response.json();
              console.log('📦 Cart API Response:', result);
              
              let items = [];
              
              if (result.status === true || result.status === 'success') {
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
              
              // طباعة تفاصيل كل item لفهم الـ structure
              items.forEach((item, index) => {
                console.log(`📦 Item ${index}:`, {
                  id: item.id,
                  service: item.service,
                  staff: item.staff,
                  service_id: item.service_id,
                  staff_id: item.staff_id
                });
              });
              
              // تجميع المنتجات المتشابهة
              const groupedItems = items.reduce((acc, item) => {
                // تحديد المعرف الفريد للعنصر
                const serviceId = item.service?.id || item.service_id;
                const staffId = item.staff?.id || item.staff_id;
                
                // البحث عن عنصر موجود بنفس service_id أو staff_id
                const existingItem = acc.find(i => {
                  const existingServiceId = i.service?.id || i.service_id;
                  const existingStaffId = i.staff?.id || i.staff_id;
                  
                  // مقارنة service_id أو staff_id
                  if (serviceId && existingServiceId) {
                    return existingServiceId === serviceId;
                  }
                  if (staffId && existingStaffId) {
                    return existingStaffId === staffId;
                  }
                  return false;
                });
                
                if (existingItem) {
                  // زيادة الكمية وإضافة ID للقائمة
                  existingItem.quantity = (existingItem.quantity || 1) + 1;
                  if (!existingItem.cartIds) {
                    existingItem.cartIds = [existingItem.id];
                  }
                  existingItem.cartIds.push(item.id);
                } else {
                  // إضافة عنصر جديد
                  acc.push({
                    ...item,
                    quantity: 1,
                    cartIds: [item.id]
                  });
                }
                
                return acc;
              }, []);
              
              console.log('📦 Grouped cart items:', groupedItems);
              setCartItems(groupedItems);
            } else {
              const errorData = await response.json();
              console.error('❌ Cart API Error:', errorData);
            }
          } catch (error) {
            console.error('❌ Error fetching API cart:', error);
          }
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('❌ Error fetching cart:', error);
        showError('حدث خطأ في تحميل السلة');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [showError]);

  // حذف عنصر من السلة المحلية
  const handleRemoveLocalItem = (localId) => {
    try {
      removeFromLocalCart(localId);
      setLocalCartItems(getLocalCart());
      showSuccess('تم حذف العنصر من السلة');
    } catch (error) {
      console.error('Error removing local item:', error);
      showError('حدث خطأ أثناء حذف العنصر');
    }
  };

  // حذف عنصر من السلة
  const handleRemoveItem = async (item) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const itemId = item.id;
    setRemoving(prev => ({ ...prev, [itemId]: true }));

    try {
      // لو في أكتر من ID (يعني المنتج متكرر)، احذفهم كلهم
      const idsToDelete = item.cartIds || [itemId];
      
      const deletePromises = idsToDelete.map(id =>
        fetch(`https://ghaimcenter.com/laravel/api/user/cart/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
      );

      const results = await Promise.all(deletePromises);
      console.log('🗑️ Delete responses:', results);

      // لو كل الطلبات نجحت
      if (results.every(result => result.status === true || result.status === 'success')) {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
        showSuccess('تم حذف العنصر من السلة');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        showError('حدث خطأ أثناء حذف العنصر');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showError('حدث خطأ في الاتصال');
    } finally {
      setRemoving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // تحديث كمية عنصر في السلة
  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const itemId = item.id;
    setUpdating(prev => ({ ...prev, [itemId]: true }));

    try {
      const currentQuantity = item.quantity || 1;
      const cartIds = item.cartIds || [itemId];
      
      if (newQuantity > currentQuantity) {
        // زيادة الكمية: أضف items جديدة
        const itemsToAdd = newQuantity - currentQuantity;
        const addPromises = [];
        
        for (let i = 0; i < itemsToAdd; i++) {
          // تحديد إذا كان العنصر خدمة أو طبيب
          const serviceId = item.service?.id || item.service_id;
          const staffId = item.staff?.id || item.staff_id;
          
          const requestBody = staffId 
            ? { staff_id: staffId }
            : { service_id: serviceId, quantity: 1 };
          
          addPromises.push(
            fetch('https://ghaimcenter.com/laravel/api/user/cart', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            }).then(res => res.json())
          );
        }
        
        const results = await Promise.all(addPromises);
        console.log('➕ Add responses:', results);
        
        if (results.every(r => r.status === true || r.status === 'success')) {
          // أعد تحميل السلة
          window.location.reload();
        } else {
          showError('حدث خطأ أثناء تحديث الكمية');
        }
        
      } else if (newQuantity < currentQuantity) {
        // تقليل الكمية: احذف items
        const itemsToRemove = currentQuantity - newQuantity;
        const idsToDelete = cartIds.slice(0, itemsToRemove);
        
        const deletePromises = idsToDelete.map(id =>
          fetch(`https://ghaimcenter.com/laravel/api/user/cart/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(res => res.json())
        );
        
        const results = await Promise.all(deletePromises);
        console.log('➖ Delete responses:', results);
        
        if (results.every(r => r.status === true || r.status === 'success')) {
          // أعد تحميل السلة
          window.location.reload();
        } else {
          showError('حدث خطأ أثناء تحديث الكمية');
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('حدث خطأ في الاتصال');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
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
          ) : (cartItems.length === 0 && localCartItems.length === 0) ? (
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
              {/* عناصر السلة المحلية */}
              {localCartItems.length > 0 && (
                <>
                  {localCartItems.map((item) => (
                    <div
                      key={item.localId}
                      className="bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
                    >
                      {/* صورة الخدمة */}
                      <div 
                        className="w-full md:w-32 h-32 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          // إذا كان العنصر دكتور (staff)
                          if (item.staff_id) {
                            const slug = createUniqueSlug(item.staff_name || 'دكتور', item.staff_id);
                            navigate(`/doctor/${slug}`);
                          } 
                          // إذا كان العنصر خدمة (service)
                          else if (item.service_id) {
                            const slug = createUniqueSlug(item.title_ar || item.title || item.name || 'خدمة', item.service_id);
                            navigate(`/service/${slug}`);
                          }
                        }}
                      >
                        <img
                          src={item.image || item.images?.[0]?.image || '/1.png'}
                          alt={item.title_ar || item.title || item.name || 'خدمة'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
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
                          {item.title_ar || item.title || item.name || 'خدمة'}
                        </h3>
                        
                        {item.about_ar && (
                          <p 
                            className="text-gray-600 text-sm mb-2"
                            style={{ fontFamily: 'Almarai' }}
                          >
                            {item.about_ar}
                          </p>
                        )}
                      </div>

                      {/* السعر وزر الحذف */}
                      <div className="flex md:flex-col items-center md:items-end gap-4 w-full md:w-auto">
                        {(item.price || item.ghaim_price) && (
                          <div className="text-2xl font-bold text-[#0171bd] flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                            {parseFloat(item.price || item.ghaim_price || 0).toFixed(2)}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="20" height="20" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                              <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                              <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                            </svg>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleRemoveLocalItem(item.localId)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          style={{ fontFamily: 'Almarai' }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* عناصر السلة من API */}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  {/* صورة الخدمة */}
                  <div 
                    className="w-full md:w-32 h-32 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      // إذا كان العنصر دكتور (staff)
                      if (item.staff?.id || item.staff_id) {
                        const staffId = item.staff?.id || item.staff_id;
                        const staffName = item.staff?.name || 'دكتور';
                        const slug = createUniqueSlug(staffName, staffId);
                        navigate(`/doctor/${slug}`);
                      } 
                      // إذا كان العنصر خدمة (service)
                      else if (item.service?.id || item.service_id) {
                        const serviceId = item.service?.id || item.service_id;
                        const title = item.service?.title_ar || item.service?.title || 'خدمة';
                        const slug = createUniqueSlug(title, serviceId);
                        navigate(`/service/${slug}`);
                      }
                    }}
                  >
                    <img
                      src={
                        item.service?.images?.[0]?.image || 
                        item.service?.image || 
                        (item.service?.images && item.service.images.length > 0 ? item.service.images[0] : null) ||
                        item.staff?.image ||
                        item.staff?.photo ||
                        '/1.png'
                      }
                      alt={item.service?.title_ar || item.service?.title || item.staff?.name || 'خدمة'}
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
                      {item.service?.title_ar || item.service?.title || item.staff?.name || 'خدمة'}
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
                      {item.staff?.ghaim_price && !item.service?.price && (
                        <span style={{ fontFamily: 'Almarai' }}>
                          السعر: {item.staff.ghaim_price || item.staff.price} ر.س
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Almarai' }}>
                        الكمية:
                      </span>
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item, (item.quantity || 1) - 1)}
                          disabled={updating[item.id] || (item.quantity || 1) <= 1}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <span className="w-12 text-center font-bold text-gray-900" style={{ fontFamily: 'Almarai' }}>
                          {item.quantity || 1}
                        </span>
                        
                        <button
                          onClick={() => handleUpdateQuantity(item, (item.quantity || 1) + 1)}
                          disabled={updating[item.id]}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* السعر وزر الحذف */}
                  <div className="flex md:flex-col items-center md:items-end gap-4 w-full md:w-auto">
                    {(item.service?.price || item.staff?.ghaim_price || item.staff?.price) && (
                      <div className="text-2xl font-bold text-[#0171bd] flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                        {(parseFloat(item.service?.price || item.staff?.ghaim_price || item.staff?.price || 0) * (item.quantity || 1)).toFixed(2)}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="20" height="20" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                          <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                          <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleRemoveItem(item)}
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
                    عدد الخدمات: {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) + localCartItems.length}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 flex items-center gap-1" style={{ fontFamily: 'Almarai' }}>
                    الإجمالي: {(
                      cartItems.reduce((sum, item) => sum + ((parseFloat(item.service?.price || item.staff?.ghaim_price || item.staff?.price || 0)) * (item.quantity || 1)), 0) +
                      localCartItems.reduce((sum, item) => sum + parseFloat(item.price || item.ghaim_price || 0), 0)
                    ).toFixed(2)}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="24" height="24" aria-label="Saudi Riyal" title="Saudi Riyal" style={{display: 'inline-block', verticalAlign: 'middle'}}>
                      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path>
                      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>
                    </svg>
                  </p>
                </div>
                
                {localCartItems.length > 0 && !localStorage.getItem('authToken') ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold text-lg hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    سجل الدخول لإتمام الشراء
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#0171bd] to-[#015a99] text-white rounded-lg font-bold text-lg hover:from-[#015a99] hover:to-[#013d73] transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ fontFamily: 'Almarai' }}
                  >
                    اتمام الشراء 
                  </button>
                )}
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
