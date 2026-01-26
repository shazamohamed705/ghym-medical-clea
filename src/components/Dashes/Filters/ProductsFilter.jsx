import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaSignOutAlt } from 'react-icons/fa';
import profileImage from '../../../assets/photo/service.png';

// Products filter component - Products management
const ProductsFilter = () => {
  const navigate = useNavigate();

  // Products data
  const products = [
    {
      id: 1,
      title: 'منتج تجميلي 1',
      description: 'وصف المنتج الأول',
      category: 'عناية بالبشرة',
      price: '150 إ',
      stock: 50,
      discount: 'خصم 10%',
      image: profileImage
    },
    {
      id: 2,
      title: 'منتج تجميلي 2',
      description: 'وصف المنتج الثاني',
      category: 'مكياج',
      price: '200 إ',
      stock: 30,
      image: profileImage
    }
  ];

  return (
    <div className="products-section">
      {/* Products Header */}
      <div className="products-header">
        <h2 className="products-title">المنتجات</h2>
        <button className="add-product-btn" onClick={() => navigate('/add-product')}>
          <FaPlus className="btn-icon" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="products-search-bar">
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="البحث في المنتجات..."
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              <img 
                src={product.image} 
                alt={product.title} 
                className="product-image"
              />
              {product.discount && <div className="discount-badge">{product.discount}</div>}
            </div>
            
            <div className="product-content">
              <h3 className="product-title">{product.title}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-category">{product.category}</div>
              
              <div className="product-details">
                <div className="product-price">{product.price}</div>
                <div className="product-stock">المخزون: {product.stock}</div>
              </div>
              
              <div className="product-actions">
                <button className="delete-btn">
                  <FaSignOutAlt className="action-icon" />
                </button>
                <button className="edit-btn">
                  <FaEdit className="action-icon" />
                  تعديل
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsFilter;

