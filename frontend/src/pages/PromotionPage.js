import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import { getProducts } from '../services/productService';
import { toast } from 'react-toastify';
import WishlistIcon from '../components/Wishlist/WishlistIcon';
import { getImageUrl } from '../utils/imageUtils';

const PromotionPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [sortBy, setSortBy] = useState('discount-desc'); // Mặc định sắp xếp theo % giảm giá
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPromotionProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy tất cả sản phẩm
        const res = await getProducts();
        let allProducts = [];

        if (res?.data?.data?.products) {
          allProducts = res.data.data.products;
        } else if (res && res.data && Array.isArray(res.data)) {
          allProducts = res.data;
        } else if (res && Array.isArray(res)) {
          allProducts = res;
        }

        // Lọc chỉ những sản phẩm có sale_price
        const promotionProducts = allProducts
          .filter((product) => product.sale_price && product.sale_price > 0)
          .map((product) => ({
            ...product,
            discountPercent: Math.round(
              (product.sale_price / product.price) * 100
            ),
          }));

        // Sắp xếp theo sortBy
        const sortedProducts = sortProducts(promotionProducts, sortBy);
        setProducts(sortedProducts);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm khuyến mại:', err);
        setError(
          err.response?.data?.error || err.message || 'Lỗi không xác định'
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionProducts();
  }, [sortBy]);

  const sortProducts = (products, sortType) => {
    const sorted = [...products];

    switch (sortType) {
      case 'discount-desc':
        return sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      case 'discount-asc':
        return sorted.sort((a, b) => a.discountPercent - b.discountPercent);
      case 'price-asc':
        return sorted.sort((a, b) => {
          const priceA = a.price - a.sale_price;
          const priceB = b.price - b.sale_price;
          return priceA - priceB;
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const priceA = a.price - a.sale_price;
          const priceB = b.price - b.sale_price;
          return priceB - priceA;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(product.id);

    const size =
      Array.isArray(product.sizes) && product.sizes.length > 0
        ? product.sizes[0]
        : '';
    const color =
      Array.isArray(product.colors) && product.colors.length > 0
        ? product.colors[0]
        : '';

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price - product.sale_price, // Sử dụng giá sau khi giảm
      image: getImageUrl(product.images?.[0]),
      quantity: 1,
      size,
      color,
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
            Giá khuyến mại:{' '}
            {Number(product.price - product.sale_price).toLocaleString('vi-VN')}{' '}
            đ
          </small>
        </div>,
        {
          icon: '🛒',
          position: 'top-right',
          autoClose: 2000,
        }
      );

      setTimeout(() => setAddingToCart(null), 500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng!');
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4'></div>
          <div className='text-gray-600'>Đang tải sản phẩm khuyến mại...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>❌</div>
          <div className='text-red-600 text-lg'>Lỗi: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className='mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='bg-white rounded-2xl p-8 shadow-lg mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              <i className='fas fa-fire text-orange-500 mr-3'></i>
              KHUYẾN MẠI HẤP DẪN
            </h1>
            <p className='text-xl text-gray-600 mb-6'>
              🎉 {products.length} sản phẩm đang được giảm giá đặc biệt!
            </p>
          </div>

          <div className='bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-xl max-w-md mx-auto'>
            <div className='text-center'>
              <span className='text-2xl font-bold block'>
                🔥 SALE UP TO 50% 🔥
              </span>
              <span className='text-sm opacity-90'>
                Cơ hội vàng không thể bỏ lỡ!
              </span>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className='text-center py-16 bg-white rounded-2xl shadow-lg'>
            <div className='text-8xl mb-6'>
              <i className='fas fa-tags text-gray-300'></i>
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Hiện tại không có sản phẩm nào đang khuyến mại
            </h3>
            <p className='text-gray-600 mb-8'>
              Hãy quay lại sau để không bỏ lỡ những ưu đãi hấp dẫn!
            </p>
            <Link
              to='/'
              className='inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
            >
              <i className='fas fa-home mr-2'></i>
              Về trang chủ
            </Link>
          </div>
        ) : (
          <>
            {/* Sort Controls */}
            <div className='flex flex-col sm:flex-row justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-lg'>
              <div className='flex items-center space-x-3'>
                <label
                  htmlFor='sort-select'
                  className='text-gray-700 font-medium flex items-center'
                >
                  <i className='fas fa-sort mr-2'></i>
                  Sắp xếp theo:
                </label>
                <select
                  id='sort-select'
                  value={sortBy}
                  onChange={handleSortChange}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
                >
                  <option value='discount-desc'>% Giảm giá (Cao → Thấp)</option>
                  <option value='discount-asc'>% Giảm giá (Thấp → Cao)</option>
                  <option value='price-asc'>Giá bán (Thấp → Cao)</option>
                  <option value='price-desc'>Giá bán (Cao → Thấp)</option>
                  <option value='name'>Tên sản phẩm (A → Z)</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {products.map((product) => (
                <div key={product.id} className='group h-full'>
                  <Link
                    to={`/san-pham/${product.slug || product.id}`}
                    className='block h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'
                  >
                    {/* Badge */}
                    <div className='absolute top-3 left-3 z-10'>
                      <span className='bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                        -{product.discountPercent}%
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className='relative aspect-square overflow-hidden'>
                      <img
                        src={getImageUrl(product.images?.[0])}
                        alt={product.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                      <div className='absolute top-3 right-3'>
                        <WishlistIcon productId={product.id} size='small' />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className='p-4 flex flex-col h-[calc(100%-theme(spacing.64))]'>
                      <h3 className='text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]'>
                        {product.name}
                      </h3>

                      <div className='mb-3 flex-grow'>
                        <div className='flex items-center space-x-2 mb-1'>
                          <span className='text-lg font-bold text-red-600'>
                            {Number(
                              product.price - product.sale_price
                            ).toLocaleString('vi-VN')}{' '}
                            đ
                          </span>
                          <span className='text-sm text-gray-500 line-through'>
                            {Number(product.price).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <div className='text-xs text-green-600 font-medium'>
                          Tiết kiệm:{' '}
                          {Number(product.sale_price).toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={addingToCart === product.id}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 mt-auto ${
                          addingToCart === product.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md'
                        }`}
                      >
                        {addingToCart === product.id ? (
                          <>
                            <i className='fas fa-spinner fa-spin mr-1'></i>
                            Đang thêm...
                          </>
                        ) : (
                          <>
                            <i className='fas fa-shopping-cart mr-1'></i>
                            Thêm vào giỏ
                          </>
                        )}
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PromotionPage;
