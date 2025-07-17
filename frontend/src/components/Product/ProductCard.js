import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';
import WishlistIcon from '../Wishlist/WishlistIcon';
import { getImageUrl } from '../../utils/imageUtils';
import useAuthAction from '../../hooks/useAuthAction';

const ProductCard = ({ product }) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { requireAuth } = useAuthAction();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const executeAddToCart = () => {
      setIsLoading(true);

      const cartItem = {
        id: product.id,
        name: product.name,
        price:
          product.sale_price && product.sale_price > 0
            ? product.price - product.sale_price
            : product.price,
        image: getImageUrl(product.images?.[0]),
        quantity: 1,
      };

      try {
        dispatch(addToCart(cartItem));
        toast.success(
          <div>
            <strong>Đã thêm vào giỏ hàng!</strong>
            <br />
            {product.name}
            <br />
            <small style={{ color: '#666' }}>
              {Number(
                product.sale_price && product.sale_price > 0
                  ? product.price - product.sale_price
                  : product.price
              ).toLocaleString('vi-VN')}{' '}
              đ
            </small>
          </div>,
          {
            icon: '🛒',
            position: 'top-right',
            autoClose: 3000,
          }
        );
      } catch (error) {
        toast.error('Không thể thêm sản phẩm vào giỏ hàng!');
      } finally {
        setIsLoading(false);
      }
    };

    requireAuth(executeAddToCart);
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString('vi-VN');
  };

  const calculateDiscount = (originalPrice, salePrice) => {
    if (!salePrice || salePrice <= 0) return 0;
    return Math.round((salePrice / originalPrice) * 100);
  };

  const productImage = getImageUrl(product.images?.[0]);

  const discount = calculateDiscount(product.price, product.sale_price);

  return (
    <div className='group h-full'>
      <div className='h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col'>
        {/* Badge */}
        {discount > 0 && (
          <div className='absolute top-3 left-3 z-10'>
            <span className='bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md'>
              -{discount}%
            </span>
          </div>
        )}

        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden'>
          <Link to={`/san-pham/${product.slug}`}>
            <img
              src={productImage}
              alt={product.name}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={(e) => {
                e.target.src = '/no-image.png';
              }}
            />
          </Link>
          <div className='absolute top-3 right-3'>
            <WishlistIcon productId={product.id} size='small' />
          </div>
        </div>

        {/* Product Info */}
        <div className='p-4 flex flex-col flex-grow'>
          {/* Category */}
          {product.category && (
            <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mb-1'>
              {product.category.name || 'Thời trang'}
            </div>
          )}

          <Link
            to={`/san-pham/${product.slug}`}
            className='text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors block'
          >
            {product.name}
          </Link>

          {/* Price */}
          <div className='mb-3 flex-grow'>
            {product.sale_price && product.sale_price > 0 ? (
              <>
                <div className='flex items-center space-x-2 mb-1'>
                  <span className='text-lg font-bold text-red-600'>
                    {formatPrice(product.price - product.sale_price)} đ
                  </span>
                  <span className='text-sm text-gray-500 line-through'>
                    {formatPrice(product.price)} đ
                  </span>
                </div>
                <div className='text-xs text-green-600 font-medium'>
                  Tiết kiệm: {formatPrice(product.sale_price)} đ
                </div>
              </>
            ) : (
              <span className='text-lg font-bold text-primary-600'>
                {formatPrice(product.price)} đ
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <>
                <i className='fas fa-spinner fa-spin mr-2'></i>
                Đang thêm...
              </>
            ) : (
              <>
                <i className='fas fa-shopping-cart mr-2'></i>
                Thêm vào giỏ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
