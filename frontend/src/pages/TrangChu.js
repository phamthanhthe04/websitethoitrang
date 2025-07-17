import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/productService';
import ProductGrid from '../components/Product/ProductGrid';

const TrangChu = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get search params from URL
        const searchQuery = searchParams.get('search');
        const params = {};
        if (searchQuery) {
          params.search = searchQuery;
        }

        // ĐÚNG: Gọi hàm trực tiếp
        const res = await getProducts(params);

        let products = [];
        // Cần kiểm tra cấu trúc response.data từ backend của bạn.
        // Ví dụ: nếu backend trả về { success: true, data: { products: [...] } }
        if (res?.data?.data?.products) {
          products = res.data.data.products;
        }
        // Hoặc nếu backend trả về { success: true, data: [...] }
        else if (res && res.data && Array.isArray(res.data)) {
          products = res.data;
        }
        // Hoặc nếu backend trả về thẳng mảng sản phẩm
        else if (res && Array.isArray(res)) {
          // Trường hợp getProducts() trả về thẳng mảng
          products = res;
        } else {
          console.warn('Cấu trúc dữ liệu sản phẩm không như mong đợi:', res);
          products = [];
        }

        setAllProducts(products);

        // Nếu đang tìm kiếm, không chia section
        if (!searchQuery && products.length > 0) {
          // Sắp xếp theo ngày tạo để lấy sản phẩm mới nhất
          const sortedByDate = [...products].sort(
            (a, b) =>
              new Date(b.createdAt || b.created_at || 0) -
              new Date(a.createdAt || a.created_at || 0)
          );
          setLatestProducts(sortedByDate.slice(0, 8)); // Lấy 8 sản phẩm mới nhất

          // Lọc sản phẩm có giảm giá
          const onSaleProducts = products.filter((product) => {
            const salePrice = parseFloat(
              product.sale_price || product.salePrice || 0
            );
            return salePrice > 0;
          });
          setSaleProducts(onSaleProducts.slice(0, 8)); // Lấy 8 sản phẩm giảm giá
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
        // Lấy thông báo lỗi cụ thể từ response.data.error nếu có, hoặc lỗi chung
        setError(
          err.response?.data?.error ||
            err.message ||
            'Lỗi không xác định khi tải sản phẩm'
        );
        setAllProducts([]);
        setLatestProducts([]);
        setSaleProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='loading-spinner mx-auto mb-4'></div>
          <p className='text-gray-600 text-lg'>🔄 Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto'>
          <div className='text-red-500 text-6xl mb-4'>❌</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Có lỗi xảy ra
          </h2>
          <p className='text-gray-600'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='btn btn-primary mt-4'
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const searchQuery = searchParams.get('search');
  const displayProducts = searchQuery ? allProducts : [];

  if (!searchQuery && allProducts.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto'>
          <div className='text-gray-400 text-6xl mb-4'>📦</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Không có sản phẩm
          </h2>
          <p className='text-gray-600'>Không có sản phẩm nào được tìm thấy.</p>
          <Link to='/' className='btn btn-primary mt-4'>
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (searchQuery && displayProducts.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto'>
          <div className='text-gray-400 text-6xl mb-4'>🔍</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Không tìm thấy kết quả
          </h2>
          <p className='text-gray-600'>
            Không tìm thấy sản phẩm nào cho "{searchQuery}".
          </p>
          <Link to='/' className='btn btn-primary mt-4'>
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-primary-500 to-purple-600 text-white py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 animate-fade-in'>
            {searchQuery
              ? `Kết quả tìm kiếm: "${searchQuery}"`
              : 'Thời Trang Hiện Đại'}
          </h1>
          <p className='text-xl md:text-2xl opacity-90 animate-slide-up'>
            {searchQuery
              ? `Tìm thấy ${displayProducts.length} sản phẩm`
              : 'Khám phá bộ sưu tập thời trang mới nhất'}
          </p>
        </div>
      </section>

      {/* Search Results Section */}
      {searchQuery && (
        <section className='py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                Kết quả tìm kiếm
              </h2>
              <div className='w-24 h-1 bg-primary-500 mx-auto rounded-full'></div>
            </div>

            <ProductGrid
              products={displayProducts}
              loading={loading}
              error={error}
              emptyMessage={`Không tìm thấy sản phẩm nào cho "${searchQuery}"`}
            />

            {displayProducts.length > 0 && (
              <div className='text-center mt-12'>
                <button className='btn btn-outline btn-lg'>
                  Xem thêm sản phẩm
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest Products Section - Only show when not searching */}
      {!searchQuery && latestProducts.length > 0 && (
        <section className='py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                Sản phẩm mới nhất
              </h2>
              <div className='w-24 h-1 bg-primary-500 mx-auto rounded-full'></div>
              <p className='text-gray-600 mt-4'>
                Khám phá những sản phẩm mới nhất trong bộ sưu tập của chúng tôi
              </p>
            </div>

            <ProductGrid
              products={latestProducts}
              loading={false}
              error={null}
              emptyMessage='Chưa có sản phẩm mới'
            />

            <div className='text-center mt-12'>
              <Link
                to='/nam'
                className='inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors'
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Sale Products Section - Only show when not searching */}
      {!searchQuery && saleProducts.length > 0 && (
        <section className='py-16 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                🔥 Khuyến mại đặc biệt
              </h2>
              <div className='w-24 h-1 bg-red-500 mx-auto rounded-full'></div>
              <p className='text-gray-600 mt-4'>
                Đừng bỏ lỡ cơ hội sở hữu những sản phẩm với giá ưu đãi
              </p>
            </div>

            <ProductGrid
              products={saleProducts}
              loading={false}
              error={null}
              emptyMessage='Hiện tại không có sản phẩm khuyến mại'
            />

            <div className='text-center mt-12'>
              <Link
                to='/khuyen-mai'
                className='inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors'
              >
                Xem tất cả khuyến mại
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Banner/CTA Section - Only show when not searching */}
      {!searchQuery && (
        <section className='py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Khám phá phong cách của bạn
            </h2>
            <p className='text-xl mb-8 opacity-90'>
              Tìm kiếm và mua sắm những sản phẩm thời trang phù hợp với cá tính
              của bạn
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                to='/nam'
                className='bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors'
              >
                Thời trang Nam
              </Link>
              <Link
                to='/nu'
                className='bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors'
              >
                Thời trang Nữ
              </Link>
              <Link
                to='/tre-em'
                className='bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors'
              >
                Thời trang Trẻ em
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default TrangChu;
