import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import ProductGrid from './Product/ProductGrid';

const FilterSection = ({ filters, onFiltersChange, categories }) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const priceRanges = [
    { id: 'under-500k', label: 'Dưới 500.000đ', min: 0, max: 500000 },
    {
      id: '500k-1m',
      label: '500.000đ - 1.000.000đ',
      min: 500000,
      max: 1000000,
    },
    {
      id: '1m-2m',
      label: '1.000.000đ - 2.000.000đ',
      min: 1000000,
      max: 2000000,
    },
    {
      id: '2m-5m',
      label: '2.000.000đ - 5.000.000đ',
      min: 2000000,
      max: 5000000,
    },
    { id: 'over-5m', label: 'Trên 5.000.000đ', min: 5000000, max: 999999999 },
  ];

  const sortOptions = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'price-asc', label: 'Giá: Thấp đến cao' },
    { id: 'price-desc', label: 'Giá: Cao đến thấp' },
    { id: 'name-asc', label: 'Tên: A đến Z' },
    { id: 'name-desc', label: 'Tên: Z đến A' },
  ];

  const handlePriceRangeChange = (rangeId) => {
    const range = priceRanges.find((r) => r.id === rangeId);
    onFiltersChange({
      ...filters,
      priceRange: filters.priceRange?.id === rangeId ? null : range,
    });
  };

  const handleSortChange = (sortId) => {
    onFiltersChange({
      ...filters,
      sort: sortId,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      priceRange: null,
      sort: 'newest',
    });
  };

  const FilterContent = () => (
    <div className='space-y-6'>
      {/* Sort Dropdown */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>
          Sắp xếp theo
        </h3>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => handleSortChange(e.target.value)}
          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>Khoảng giá</h3>
        <div className='space-y-2'>
          {priceRanges.map((range) => (
            <label key={range.id} className='flex items-center'>
              <input
                type='radio'
                name='priceRange'
                checked={filters.priceRange?.id === range.id}
                onChange={() => handlePriceRangeChange(range.id)}
                className='border-gray-300 text-primary-600 focus:ring-primary-500'
              />
              <span className='ml-2 text-sm text-gray-700'>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={handleClearFilters}
        className='w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
      >
        Xóa tất cả bộ lọc
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className='hidden lg:block'>
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold text-gray-900 mb-6'>Bộ lọc</h2>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className='lg:hidden'>
        <button
          onClick={() => setShowMobileFilters(true)}
          className='w-full py-3 px-4 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center'
        >
          <svg
            className='w-5 h-5 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
            />
          </svg>
          Bộ lọc & Sắp xếp
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          <div
            className='fixed inset-0 bg-black bg-opacity-50'
            onClick={() => setShowMobileFilters(false)}
          />
          <div className='fixed bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-gray-900'>Bộ lọc</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const EnhancedCategoryPage = ({ categoryType }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    priceRange: null,
    sort: 'newest',
  });

  // Load initial data
  useEffect(() => {
    const categoryMap = {
      nam: ['ao-nam', 'quan-nam', 'giay-nam'],
      nu: ['ao-nu', 'quan-nu', 'giay-nu'],
      'tre-em': ['ao-tre-em', 'quan-tre-em', 'giay-tre-em'],
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all categories
        const categoriesRes = await categoryService.getCategories();
        const allCategories =
          categoriesRes.data?.data || categoriesRes.data || [];

        // Filter relevant categories
        const relevantSlugs = categoryMap[categoryType] || [];
        const relevantCategories = allCategories.filter(
          (cat) =>
            relevantSlugs.some((slug) =>
              cat.slug?.includes(slug.split('-')[1])
            ) || cat.name?.toLowerCase().includes(categoryType)
        );

        setCategories(relevantCategories);

        if (relevantCategories.length === 0) {
          setAllProducts([]);
          setProducts([]);
          setCategory({ name: `Sản phẩm ${categoryType}`, slug: categoryType });
          return;
        }

        // Get products from all relevant categories
        const allProductsData = [];
        for (const cat of relevantCategories) {
          try {
            const productsRes = await categoryService.getProductsByCategorySlug(
              cat.slug
            );
            const categoryProducts =
              productsRes.data?.data || productsRes.data || [];

            // Add category info to products
            const productsWithCategory = categoryProducts.map((product) => ({
              ...product,
              categoryId: cat.id,
              categoryName: cat.name,
            }));

            allProductsData.push(...productsWithCategory);
          } catch (err) {
            console.warn(
              `Error fetching products for category ${cat.slug}:`,
              err
            );
          }
        }

        setAllProducts(allProductsData);
        setProducts(allProductsData);
        setCategory({
          name: `Sản phẩm ${categoryType}`,
          description: `Bộ sưu tập thời trang dành cho ${categoryType}`,
          slug: categoryType,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Không thể tải sản phẩm ${categoryType}`);
      } finally {
        setLoading(false);
      }
    };

    if (categoryType) {
      fetchData();
    }
  }, [categoryType]);

  // Apply filters whenever filters change
  useEffect(() => {
    let filteredProducts = [...allProducts];

    // Filter by price range
    if (filters.priceRange) {
      filteredProducts = filteredProducts.filter((product) => {
        const price =
          product.sale_price && product.sale_price > 0
            ? product.price - product.sale_price
            : product.price;
        return (
          price >= filters.priceRange.min && price <= filters.priceRange.max
        );
      });
    }

    // Sort products
    switch (filters.sort) {
      case 'price-asc':
        filteredProducts.sort((a, b) => {
          const priceA =
            a.sale_price && a.sale_price > 0 ? a.price - a.sale_price : a.price;
          const priceB =
            b.sale_price && b.sale_price > 0 ? b.price - b.sale_price : b.price;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => {
          const priceA =
            a.sale_price && a.sale_price > 0 ? a.price - a.sale_price : a.price;
          const priceB =
            b.sale_price && b.sale_price > 0 ? b.price - b.sale_price : b.price;
          return priceB - priceA;
        });
        break;
      case 'name-asc':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        filteredProducts.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }

    setProducts(filteredProducts);
  }, [filters, allProducts]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    }
    if (newFilters.priceRange) {
      params.set('priceRange', newFilters.priceRange.id);
    }
    if (newFilters.sort && newFilters.sort !== 'newest') {
      params.set('sort', newFilters.sort);
    }

    setSearchParams(params);
  };

  // Load filters from URL on mount
  useEffect(() => {
    const categoryParams = searchParams.get('categories');
    const priceRangeParam = searchParams.get('priceRange');
    const sortParam = searchParams.get('sort');

    const priceRanges = [
      { id: 'under-500k', label: 'Dưới 500.000đ', min: 0, max: 500000 },
      {
        id: '500k-1m',
        label: '500.000đ - 1.000.000đ',
        min: 500000,
        max: 1000000,
      },
      {
        id: '1m-2m',
        label: '1.000.000đ - 2.000.000đ',
        min: 1000000,
        max: 2000000,
      },
      {
        id: '2m-5m',
        label: '2.000.000đ - 5.000.000đ',
        min: 2000000,
        max: 5000000,
      },
      { id: 'over-5m', label: 'Trên 5.000.000đ', min: 5000000, max: 999999999 },
    ];

    setFilters({
      categories: categoryParams ? categoryParams.split(',').map(Number) : [],
      priceRange: priceRangeParam
        ? priceRanges.find((r) => r.id === priceRangeParam)
        : null,
      sort: sortParam || 'newest',
    });
  }, [searchParams]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='loading-spinner mx-auto mb-4'></div>
          <p className='text-gray-600 text-lg'>
            🔄 Đang tải sản phẩm {categoryType}...
          </p>
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
            className='mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors'
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Category Header */}
      <section className='bg-gradient-to-r from-primary-500 to-purple-600 text-white py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>
            {category?.name || `Sản phẩm ${categoryType}`}
          </h1>
          {category?.description && (
            <p className='text-xl opacity-90 mb-4'>{category.description}</p>
          )}
          <div className='text-lg opacity-80'>
            {products.length > 0
              ? `${products.length} sản phẩm`
              : 'Chưa có sản phẩm nào'}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className='py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='lg:grid lg:grid-cols-4 lg:gap-8'>
            {/* Filters Sidebar */}
            <div className='lg:col-span-1 mb-8 lg:mb-0'>
              <FilterSection
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
              />
            </div>

            {/* Products Grid */}
            <div className='lg:col-span-3'>
              {products.length === 0 ? (
                <div className='text-center max-w-md mx-auto'>
                  <div className='text-gray-400 text-6xl mb-4'>📦</div>
                  <h3 className='text-2xl font-bold text-gray-800 mb-2'>
                    {allProducts.length === 0
                      ? `Chưa có sản phẩm ${categoryType}`
                      : 'Không tìm thấy sản phẩm phù hợp'}
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    {allProducts.length === 0
                      ? 'Hãy quay lại sau để xem các sản phẩm mới nhất!'
                      : 'Hãy thử điều chỉnh bộ lọc để tìm được sản phẩm bạn muốn.'}
                  </p>
                  {allProducts.length === 0 ? (
                    <Link
                      to='/'
                      className='inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors'
                    >
                      ← Quay về trang chủ
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          categories: [],
                          priceRange: null,
                          sort: 'newest',
                        })
                      }
                      className='inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors'
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <ProductGrid products={products} loading={false} error={null} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedCategoryPage;
