// Cart Utilities - إدارة السلة المحلية والمزامنة مع الـ API

const CART_STORAGE_KEY = 'ghaim_local_cart';

/**
 * جلب السلة المحلية من localStorage
 */
export const getLocalCart = () => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error reading local cart:', error);
    return [];
  }
};

/**
 * حفظ السلة المحلية في localStorage
 */
export const saveLocalCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // إطلاق حدث لتحديث عدد العناصر في الـ Navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error('Error saving local cart:', error);
  }
};

/**
 * إضافة عنصر للسلة المحلية
 */
export const addToLocalCart = (item) => {
  const cart = getLocalCart();
  cart.push({
    ...item,
    addedAt: new Date().toISOString(),
    localId: Date.now() + Math.random() // معرف محلي فريد
  });
  saveLocalCart(cart);
  return cart;
};

/**
 * حذف عنصر من السلة المحلية
 */
export const removeFromLocalCart = (localId) => {
  const cart = getLocalCart();
  const updatedCart = cart.filter(item => item.localId !== localId);
  saveLocalCart(updatedCart);
  return updatedCart;
};

/**
 * تحديث كمية عنصر في السلة المحلية
 */
export const updateLocalCartQuantity = (localId, newQuantity) => {
  const cart = getLocalCart();
  const item = cart.find(item => item.localId === localId);
  if (item) {
    item.quantity = newQuantity;
    saveLocalCart(cart);
  }
  return cart;
};

/**
 * مسح السلة المحلية بالكامل
 */
export const clearLocalCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

/**
 * مزامنة السلة المحلية مع الـ API بعد تسجيل الدخول
 */
export const syncLocalCartWithAPI = async (token) => {
  const localCart = getLocalCart();
  
  if (localCart.length === 0) {
    return { success: true, synced: 0 };
  }

  try {
    // تحويل السلة المحلية لصيغة الباك إند
    const carts = localCart.map(item => {
      const cartItem = {};
      
      // إضافة staff_id إذا موجود
      if (item.staff_id) {
        cartItem.staff_id = item.staff_id;
      }
      
      // إضافة service_id إذا موجود
      if (item.service_id) {
        cartItem.service_id = item.service_id;
      }
      
      return cartItem;
    });

    console.log('🔄 Syncing cart with API:', { carts });

    // إرسال كل العناصر مرة واحدة
    const response = await fetch('https://ghaimcenter.com/laravel/api/user/cart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ carts })
    });

    const result = await response.json();
    console.log('✅ Sync response:', result);

    if (response.ok && (result.status === true || result.status === 'success')) {
      // مسح السلة المحلية بعد المزامنة الناجحة
      clearLocalCart();
      
      return {
        success: true,
        synced: localCart.length,
        failed: 0,
        total: localCart.length
      };
    } else {
      return {
        success: false,
        error: result.message || 'فشل في مزامنة السلة',
        synced: 0,
        failed: localCart.length,
        total: localCart.length
      };
    }
  } catch (error) {
    console.error('❌ Error syncing cart:', error);
    return { 
      success: false, 
      error: error.message,
      synced: 0,
      failed: localCart.length,
      total: localCart.length
    };
  }
};

/**
 * جلب عدد عناصر السلة (محلي + API)
 */
export const getCartCount = async (token) => {
  let count = 0;
  
  // عدد العناصر المحلية
  const localCart = getLocalCart();
  count += localCart.length;
  
  // إذا كان المستخدم مسجل دخول، جلب عدد العناصر من الـ API
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
        if (result.status === true || result.status === 'success') {
          if (result.data && Array.isArray(result.data)) {
            count += result.data.length;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching API cart count:', error);
    }
  }
  
  return count;
};
