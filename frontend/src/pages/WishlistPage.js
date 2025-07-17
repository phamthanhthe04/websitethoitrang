import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchWishlist,
  removeFromWishlist,
} from '../features/wishlist/wishlistSlice';
import { addToCart } from '../features/cart/cartSlice';
import { getImageUrl } from '../utils/imageUtils';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
    } catch (err) {
      toast.error(err || 'Có lỗi xảy ra khi xóa sản phẩm khỏi yêu thích');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await dispatch(
        addToCart({
          productId: product.id,
          quantity: 1,
          size:
            product.sizes && product.sizes.length > 0 ? product.sizes[0] : null,
          color:
            product.colors && product.colors.length > 0
              ? product.colors[0]
              : null,
        })
      ).unwrap();
      toast.success('Đã thêm sản phẩm vào giỏ hàng!');
    } catch (err) {
      toast.error(err || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Danh sách yêu thích</h1>
          <p>Vui lòng đăng nhập để xem danh sách yêu thích của bạn.</p>
          <Link
            to='/dang-nhap'
            className='inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Danh sách yêu thích</h1>
        <div className='flex justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Danh sách yêu thích</h1>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          <p>Có lỗi xảy ra khi tải danh sách yêu thích: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-6'>Danh sách yêu thích</h1>

      {items.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 rounded-lg'>
          <i className='fas fa-heart-broken text-4xl text-gray-400 mb-4'></i>
          <h2 className='text-xl font-semibold mb-2'>
            Danh sách yêu thích trống
          </h2>
          <p className='text-gray-500 mb-6'>
            Bạn chưa thêm sản phẩm nào vào danh sách yêu thích
          </p>
          <Link
            to='/'
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {items.map((item) => {
            const product = item.Product || {};

            return (
              <div key={item.id} className='group h-full'>
                <div className='h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col'>
                  {/* Discount Badge */}
                  {product.sale_price && product.sale_price > 0 && (
                    <div className='absolute top-3 left-3 z-10'>
                      <span className='bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                        -
                        {Math.round((product.sale_price / product.price) * 100)}
                        %
                      </span>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className='relative aspect-square overflow-hidden'>
                    <Link to={`/san-pham/${product.slug}`}>
                      <img
                        src={
                          product.image_url
                            ? getImageUrl(product.image_url)
                            : product.images && product.images.length > 0
                            ? getImageUrl(product.images[0])
                            : '/placeholder-image.jpg'
                        }
                        alt={product.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </Link>
                    <div className='absolute top-3 right-3'>
                      <button
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        className='w-8 h-8 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors'
                      >
                        <i className='fas fa-heart'></i>
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className='p-4 flex flex-col flex-grow'>
                    {/* Category */}
                    {product.category && (
                      <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mb-1'>
                        {product.category}
                      </div>
                    )}

                    <Link
                      to={`/san-pham/${product.slug}`}
                      className='text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors block'
                    >
                      {product.name}
                    </Link>

                    {/* Price */}
                    <div className='mb-3 flex-grow'>
                      {product.sale_price && product.sale_price > 0 ? (
                        <>
                          <div className='flex items-center space-x-2 mb-1'>
                            <span className='text-lg font-bold text-red-600'>
                              {formatPrice(product.price - product.sale_price)}
                            </span>
                            <span className='text-sm text-gray-500 line-through'>
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <div className='text-xs text-green-600 font-medium'>
                            Tiết kiệm: {formatPrice(product.sale_price)}
                          </div>
                        </>
                      ) : (
                        <span className='text-lg font-bold text-blue-600'>
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        product.stock <= 0
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                      }`}
                    >
                      <i className='fas fa-shopping-cart mr-2'></i>
                      {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
