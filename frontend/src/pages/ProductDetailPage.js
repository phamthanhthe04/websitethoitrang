import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getProductBySlug } from '../services/productService';
import { addToCart } from '../features/cart/cartSlice';
import { toast } from 'react-toastify';
import WishlistIcon from '../components/Wishlist/WishlistIcon';
import { getImageUrl } from '../utils/imageUtils';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const dispatch = useDispatch();

  // Helper functions to parse arrays from different formats
  const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed)
          ? parsed
          : field
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item);
      } catch {
        return field
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item);
      }
    }
    return [];
  };

  const getSizes = () => parseArrayField(product?.sizes);
  const getColors = () => parseArrayField(product?.colors);
  const getTags = () => parseArrayField(product?.tags);

  const hasSizes = () => getSizes().length > 0;
  const hasColors = () => getColors().length > 0;
  const isSelectionRequired = () =>
    (hasSizes() && !selectedSize) || (hasColors() && !selectedColor);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!slug) {
          setError('Slug không hợp lệ');
          return;
        }

        // Try to fetch by slug first, then fallback to ID if needed
        let res;
        try {
          res = await getProductBySlug(slug);
        } catch (slugError) {
          // If slug fails, try treating it as an ID
          const { getProduct } = require('../services/productService');
          res = await getProduct(slug);
        }

        const productData = res.data?.data || res.data;
        setProduct(productData);

        // Set default selections
        const sizes = parseArrayField(productData?.sizes);
        const colors = parseArrayField(productData?.colors);

        if (sizes.length > 0) {
          setSelectedSize(sizes[0]);
        }
        if (colors.length > 0) {
          setSelectedColor(colors[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    } else {
      setError('Slug không được tìm thấy');
      setLoading(false);
    }
  }, [slug]);

  const handleAddToCart = async () => {
    if (isSelectionRequired()) {
      const missing = [];
      if (hasSizes() && !selectedSize) missing.push('size');
      if (hasColors() && !selectedColor) missing.push('màu sắc');
      toast.error(`Vui lòng chọn ${missing.join(' và ')}!`);
      return;
    }

    setAddingToCart(true);

    const cartItem = {
      id: product.id,
      name: product.name,
      price:
        product.sale_price && product.sale_price > 0
          ? product.price - product.sale_price
          : product.price,
      image: getImageUrl(product.images?.[0]),
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    };

    try {
      dispatch(addToCart(cartItem));
      toast.success(
        <div>
          <strong>Đã thêm vào giỏ hàng!</strong>
          <br />
          {product.name}
          <br />
          <small>
            Số lượng: {quantity} | Size: {selectedSize} | Màu: {selectedColor}
          </small>
        </div>,
        {
          icon: '🛒',
          position: 'top-right',
          autoClose: 3000,
        }
      );

      setTimeout(() => setAddingToCart(false), 500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng!');
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      navigate('/gio-hang');
    }, 1000);
  };

  const calculateDiscount = () => {
    if (product?.sale_price && product?.sale_price > 0 && product?.price) {
      return Math.round((product.sale_price / product.price) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <div className='text-gray-600 text-lg'>
            Đang tải thông tin sản phẩm...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto px-4'>
          <div className='text-red-500 text-6xl mb-4'>❌</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Đã xảy ra lỗi
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <button
            onClick={() => navigate('/')}
            className='px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const currentPrice =
    product.sale_price && product.sale_price > 0
      ? product.price - product.sale_price
      : product.price;
  const hasDiscount = product.sale_price && product.sale_price > 0;
  const discountPercent = calculateDiscount();

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 p-6 lg:p-8'>
            {/* Left Side - Images (2/5 of width on lg screens) */}
            <div className='lg:col-span-2 space-y-4 max-w-md mx-auto lg:mx-0'>
              {/* Main Image */}
              <div className='relative bg-gray-100 rounded-lg overflow-hidden aspect-square max-w-xs mx-auto'>
                <img
                  src={getImageUrl(product.images?.[selectedImageIndex])}
                  alt={product.name}
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                />
                {hasDiscount && (
                  <div className='absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg'>
                    Sale -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className='grid grid-cols-4 gap-2 max-w-xs mx-auto'>
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative bg-gray-100 rounded-md overflow-hidden aspect-square border-2 transition-all duration-200 ${
                        selectedImageIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Product Info (3/5 of width on lg screens) */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Product Header */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-2'>
                    {product.name}
                  </h1>
                  {product.category && (
                    <div className='text-sm text-gray-500 mb-4'>
                      Danh mục:{' '}
                      <span className='font-medium'>
                        {product.category.name || product.category}
                      </span>
                    </div>
                  )}
                </div>
                <WishlistIcon
                  productId={product.id}
                  className='flex-shrink-0 ml-4'
                />
              </div>

              {/* Price Section */}
              <div className='border-b border-gray-200 pb-6'>
                <div className='flex items-center gap-3 mb-2'>
                  <span className='text-3xl font-bold text-gray-900'>
                    {Number(currentPrice).toLocaleString('vi-VN')} đ
                  </span>
                  {hasDiscount && (
                    <>
                      <span className='text-xl text-gray-500 line-through'>
                        {Number(product.price).toLocaleString('vi-VN')} đ
                      </span>
                      <span className='bg-red-100 text-red-800 text-sm font-semibold px-2 py-1 rounded-full'>
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <div className='text-sm text-green-600 font-medium'>
                    Tiết kiệm:{' '}
                    {Number(product.sale_price).toLocaleString('vi-VN')} đ
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className='border-b border-gray-200 pb-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Mô tả sản phẩm
                  </h3>
                  <p className='text-gray-600 leading-relaxed'>
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Options */}
              <div className='space-y-6'>
                {/* Size Selection */}
                {hasSizes() && (
                  <div>
                    <label className='block text-sm font-semibold text-gray-900 mb-3'>
                      Chọn size <span className='text-red-500'>*</span>
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {getSizes().map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border rounded-lg font-medium transition-all duration-200 ${
                            selectedSize === size
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {hasColors() && (
                  <div>
                    <label className='block text-sm font-semibold text-gray-900 mb-3'>
                      Chọn màu <span className='text-red-500'>*</span>
                    </label>
                    <div className='flex flex-wrap gap-3'>
                      {getColors().map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                            selectedColor === color
                              ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{
                            backgroundColor:
                              color === 'trắng'
                                ? '#ffffff'
                                : color === 'đen'
                                ? '#000000'
                                : color === 'xanh'
                                ? '#007bff'
                                : color === 'đỏ'
                                ? '#dc3545'
                                : color === 'vàng'
                                ? '#ffc107'
                                : color === 'hồng'
                                ? '#e83e8c'
                                : color === 'xám'
                                ? '#6c757d'
                                : color === 'nâu'
                                ? '#795548'
                                : '#f8f9fa',
                          }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <div className='w-full h-full rounded-full flex items-center justify-center'>
                              <i className='fas fa-check text-white text-sm drop-shadow-lg'></i>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedColor && (
                      <div className='mt-2 text-sm text-gray-600'>
                        Đã chọn:{' '}
                        <span className='font-medium capitalize'>
                          {selectedColor}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selection */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-3'>
                    Số lượng
                  </label>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center border border-gray-300 rounded-lg'>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className='p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <i className='fas fa-minus text-sm'></i>
                      </button>
                      <span className='px-4 py-2 font-semibold min-w-[60px] text-center'>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= (product.stock || 99)}
                        className='p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <i className='fas fa-plus text-sm'></i>
                      </button>
                    </div>
                    <div className='text-sm text-gray-600'>
                      {product.stock > 0 ? (
                        <span className='text-green-600'>
                          <i className='fas fa-check-circle mr-1'></i>
                          Còn {product.stock} sản phẩm
                        </span>
                      ) : (
                        <span className='text-red-600'>
                          <i className='fas fa-times-circle mr-1'></i>
                          Hết hàng
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='space-y-3 pt-6 border-t border-gray-200'>
                <button
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart || product.stock === 0 || isSelectionRequired()
                  }
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    addingToCart || product.stock === 0 || isSelectionRequired()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  <i
                    className={`fas ${
                      addingToCart ? 'fa-spinner fa-spin' : 'fa-shopping-cart'
                    }`}
                  ></i>
                  {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={
                    addingToCart || product.stock === 0 || isSelectionRequired()
                  }
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    addingToCart || product.stock === 0 || isSelectionRequired()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  <i className='fas fa-bolt'></i>
                  Mua ngay
                </button>
              </div>

              {/* Product Meta Information */}
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <h4 className='font-semibold text-gray-900 mb-3'>
                  Thông tin sản phẩm
                </h4>
                <div className='grid grid-cols-1 gap-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>SKU:</span>
                    <span className='font-medium text-gray-900'>
                      {product.sku || 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Tình trạng:</span>
                    <span
                      className={`font-medium ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.stock > 0
                        ? `Còn ${product.stock} sản phẩm`
                        : 'Hết hàng'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Danh mục:</span>
                    <span className='font-medium text-gray-900'>
                      {product.category?.name || product.category || 'N/A'}
                    </span>
                  </div>
                  {getTags().length > 0 && (
                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600'>Tags:</span>
                      <div className='flex flex-wrap gap-1 max-w-[200px]'>
                        {getTags().map((tag, index) => (
                          <span
                            key={index}
                            className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
