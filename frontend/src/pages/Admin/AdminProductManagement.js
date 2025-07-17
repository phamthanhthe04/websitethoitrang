import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import CategoryTreeSelect from '../../components/Admin/CategoryTreeSelect';
import CategoryFilterSelect from '../../components/Admin/CategoryFilterSelect';
import { getImageUrl } from '../../utils/imageUtils';

const AdminProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form state for adding/editing product
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    sale_price: '',
    stock: '',
    status: 'active',
    tags: '',
    sizes: '',
    colors: '',
    sku: '',
  });

  // Edit state
  const [editingProduct, setEditingProduct] = useState(null);
  const [keepOldImages, setKeepOldImages] = useState({
    mainImage: false,
    additionalImages: [],
  });

  // Image upload state
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getProducts();

      // Images are already arrays from backend, no need to parse
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data for development
    } finally {
      setLoading(false);
    }
  };

  // Form handling functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setMainImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setAdditionalImages(files);

    // Create previews
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((previews) => {
      setAdditionalPreviews(previews);
    });
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview(null);
  };

  const removeAdditionalImage = (index) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    const newPreviews = additionalPreviews.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
    setAdditionalPreviews(newPreviews);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: '',
      sale_price: '',
      stock: '',
      status: 'active',
      tags: '',
      sizes: '',
      colors: '',
      sku: '',
    });
    setMainImage(null);
    setMainImagePreview(null);
    setAdditionalImages([]);
    setAdditionalPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Prepare data for API
      const productData = {
        ...formData,
        mainImage,
        additionalImages,
      };

      // Call API
      const response = await adminService.createProduct(productData);

      if (response.data) {
        // Images are already arrays from backend
        const newProduct = response.data.product;

        // Add to products list
        setProducts((prev) => [...prev, newProduct]);

        // Close modal and reset form
        setShowAddModal(false);
        resetForm();

        alert('Thêm sản phẩm thành công!');
      }
    } catch (error) {
      console.error('Error creating product:', error);

      let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Prepare data for API
      const productData = {
        ...formData,
        // Only include new images if they are uploaded
        ...(mainImage && { mainImage }),
        ...(additionalImages.length > 0 && { additionalImages }),
      };

      // Always explicitly set keepOldMainImage flag if we want to keep old main image
      if (keepOldImages.mainImage) {
        productData.keepOldMainImage = true;
      }

      // Add flags to indicate which old additional images to keep
      if (keepOldImages.additionalImages.some((keep) => keep)) {
        productData.keepOldAdditionalImages = keepOldImages.additionalImages;
      }

      // Call API
      const response = await adminService.updateProduct(
        editingProduct.id,
        productData
      );

      if (response.data) {
        const updatedProduct = response.data.product;

        // Update products list
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
        );

        // Close modal and reset form
        setShowEditModal(false);
        resetEditForm();

        alert('Cập nhật sản phẩm thành công!');
      }
    } catch (error) {
      console.error('Error updating product:', error);

      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const resetEditForm = () => {
    setEditingProduct(null);
    resetForm();
    setKeepOldImages({
      mainImage: false,
      additionalImages: [],
    });
  };

  const handleToggleOldMainImage = () => {
    // Get the new state value
    const newValue = !keepOldImages.mainImage;

    setKeepOldImages((prev) => ({
      ...prev,
      mainImage: newValue,
    }));

    // If we're switching to keep the old image, clear any new image selection
    if (newValue) {
      setMainImage(null);
      // Reset preview to the original product image
      if (editingProduct && editingProduct.image_url) {
        setMainImagePreview(editingProduct.image_url);
      }
    } else {
      // If we're not keeping the old image, clear the preview
      setMainImagePreview(null);
    }
  };

  const handleToggleOldAdditionalImage = (index) => {
    setKeepOldImages((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.map((keep, i) =>
        i === index ? !keep : keep
      ),
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStockStatus = (stock) => {
    if (stock > 20) return { color: 'text-green-600', text: 'Còn hàng' };
    if (stock > 5) return { color: 'text-yellow-600', text: 'Sắp hết' };
    return { color: 'text-red-600', text: 'Hết hàng' };
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category_id === selectedCategory ||
      product.Category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewImages = (product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  };

  const handleEditProduct = (product) => {
    console.log('Edit product:', product);
    setEditingProduct(product);

    // Pre-fill form with existing data
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price || '',
      sale_price: product.sale_price || '',
      stock: product.stock || '',
      status: product.status || 'active',
      tags: Array.isArray(product.tags)
        ? product.tags.join(', ')
        : product.tags || '',
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(', ')
        : product.sizes || '',
      colors: Array.isArray(product.colors)
        ? product.colors.join(', ')
        : product.colors || '',
      sku: product.sku || '',
    });

    // Reset image upload states
    setMainImage(null);
    setAdditionalImages([]);

    // Set preview images to current product images
    setMainImagePreview(product.image_url || null);
    setAdditionalPreviews(Array.isArray(product.images) ? product.images : []);

    // Initialize keep old images state
    setKeepOldImages({
      mainImage: true, // Keep old main image by default
      additionalImages: (product.images || []).map(() => true), // Keep all old additional images by default
    });

    setShowEditModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (
      window.confirm(
        `Bạn có chắc muốn xóa sản phẩm "${product.name}"?\nTất cả ảnh liên quan cũng sẽ bị xóa.`
      )
    ) {
      try {
        await adminService.deleteProduct(product.id);

        // Remove from products list
        setProducts((prev) => prev.filter((p) => p.id !== product.id));

        alert('Xóa sản phẩm thành công!');
      } catch (error) {
        console.error('Error deleting product:', error);

        let errorMessage = 'Có lỗi xảy ra khi xóa sản phẩm';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-600'>Đang tải danh sách sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Quản lý sản phẩm
          </h1>
          <p className='text-gray-600 mt-1'>
            Tổng cộng {products.length} sản phẩm
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className='mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center'
        >
          <i className='fas fa-plus mr-2'></i>
          Thêm sản phẩm
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tìm kiếm
            </label>
            <div className='relative'>
              <i className='fas fa-search absolute left-3 top-3 text-gray-400'></i>
              <input
                type='text'
                placeholder='Tìm theo tên sản phẩm...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Danh mục
            </label>
            <CategoryFilterSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder='Tất cả danh mục'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Trạng thái
            </label>
            <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
              <option value='all'>Tất cả trạng thái</option>
              <option value='active'>Hoạt động</option>
              <option value='inactive'>Không hoạt động</option>
              <option value='out_of_stock'>Hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5'>
                  Sản phẩm
                </th>
                <th className='px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-24'>
                  Ảnh phụ
                </th>
                <th className='px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell'>
                  Danh mục
                </th>
                <th className='px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Giá
                </th>
                <th className='px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell'>
                  Tồn kho
                </th>
                <th className='px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell'>
                  Trạng thái
                </th>
                <th className='px-3 md:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr
                    key={product.id}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-3 md:px-4 py-4'>
                      <div className='flex items-start space-x-3 md:space-x-4'>
                        {/* Main Image */}
                        <div
                          className='w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex-shrink-0 relative group cursor-pointer'
                          onClick={() => handleViewImages(product)}
                        >
                          {product.image_url ? (
                            <img
                              src={getImageUrl(product.image_url)}
                              alt={product.name}
                              className='w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover hover:opacity-80 transition-opacity'
                            />
                          ) : (
                            <div className='w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-200 flex items-center justify-center'>
                              <i className='fas fa-image text-gray-400 text-sm'></i>
                            </div>
                          )}
                          {/* Main image badge */}
                          <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded'>
                            Chính
                          </div>
                          {/* Hover overlay */}
                          <div className='absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center'>
                            <i className='fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm'></i>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 mb-1 truncate'>
                            {product.name}
                          </div>
                          <div className='text-xs text-gray-500 mb-1'>
                            ID: {product.id}
                          </div>

                          {/* Mobile-only info */}
                          <div className='md:hidden space-y-1'>
                            <div className='text-xs text-gray-600'>
                              {product.Category?.name || 'Chưa phân loại'}
                            </div>
                            <div className='flex items-center space-x-2'>
                              <span className={`text-xs ${stockStatus.color}`}>
                                {product.stock} sản phẩm
                              </span>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                  product.status
                                )}`}
                              >
                                {product.status === 'active'
                                  ? 'Hoạt động'
                                  : product.status === 'inactive'
                                  ? 'Không hoạt động'
                                  : 'Hết hàng'}
                              </span>
                            </div>
                          </div>

                          {/* Additional Images - Mobile only */}
                          {product.images && product.images.length > 0 && (
                            <div className='md:hidden flex items-center space-x-1 mt-2'>
                              <span className='text-xs text-gray-400 mr-1'>
                                Ảnh phụ:
                              </span>
                              <div className='flex space-x-1'>
                                {product.images
                                  .slice(0, 3)
                                  .map((imageUrl, index) => (
                                    <div
                                      key={index}
                                      className='w-6 h-6 bg-gray-100 rounded border'
                                    >
                                      <img
                                        src={getImageUrl(imageUrl)}
                                        alt={`${product.name} - ảnh ${
                                          index + 1
                                        }`}
                                        className='w-6 h-6 rounded object-cover'
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.parentElement.innerHTML =
                                            '<i class="fas fa-image text-gray-300 text-xs flex items-center justify-center w-6 h-6"></i>';
                                        }}
                                      />
                                    </div>
                                  ))}
                                {product.images.length > 3 && (
                                  <div className='w-6 h-6 bg-gray-100 rounded border flex items-center justify-center'>
                                    <span className='text-xs text-gray-500'>
                                      +{product.images.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Additional Images Column - Desktop only */}
                    <td className='px-3 md:px-4 py-4 text-center hidden md:table-cell'>
                      {product.images && product.images.length > 0 ? (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-center space-x-1'>
                            {product.images
                              .slice(0, 3)
                              .map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className='w-8 h-8 bg-gray-100 rounded border relative group cursor-pointer'
                                  onClick={() => handleViewImages(product)}
                                >
                                  <img
                                    src={getImageUrl(imageUrl)}
                                    alt={`${product.name} - ảnh phụ ${
                                      index + 1
                                    }`}
                                    className='w-8 h-8 rounded object-cover hover:opacity-80 transition-opacity'
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML =
                                        '<i class="fas fa-image text-gray-300 text-xs flex items-center justify-center w-8 h-8"></i>';
                                    }}
                                  />
                                  <div className='absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded transition-all duration-200'></div>
                                </div>
                              ))}
                            {product.images.length > 3 && (
                              <div
                                className='w-8 h-8 bg-gray-100 rounded border flex items-center justify-center cursor-pointer'
                                onClick={() => handleViewImages(product)}
                              >
                                <span className='text-xs text-gray-500'>
                                  +{product.images.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                          {product.images.length > 1 && (
                            <button
                              onClick={() => handleViewImages(product)}
                              className='inline-flex items-center justify-center text-xs text-blue-600 hover:text-blue-800'
                              title='Xem tất cả ảnh'
                            >
                              <i className='fas fa-eye mr-1'></i>
                              <span>Xem tất cả</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className='text-xs text-gray-400'>Không có</div>
                      )}
                    </td>
                    <td className='px-3 md:px-4 py-4 text-sm text-gray-900 hidden md:table-cell'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
                        {product.Category?.name || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className='px-3 md:px-4 py-4 text-sm text-gray-900'>
                      <div className='space-y-1'>
                        <div className='font-medium'>
                          {formatCurrency(product.price)}
                        </div>
                        {product.sale_price && (
                          <div className='text-xs text-green-600'>
                            KM: {formatCurrency(product.sale_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-3 md:px-4 py-4 hidden lg:table-cell'>
                      <div className='text-sm text-gray-900'>
                        {product.stock} sản phẩm
                      </div>
                      <div className={`text-xs ${stockStatus.color}`}>
                        {stockStatus.text}
                      </div>
                    </td>
                    <td className='px-3 md:px-4 py-4 hidden sm:table-cell'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status === 'active'
                          ? 'Hoạt động'
                          : product.status === 'inactive'
                          ? 'Không hoạt động'
                          : 'Hết hàng'}
                      </span>
                    </td>
                    <td className='px-3 md:px-4 py-4 text-right'>
                      <div className='flex items-center justify-end space-x-1 md:space-x-2'>
                        <button
                          className='text-blue-600 hover:text-blue-700 p-1.5 md:p-2 hover:bg-blue-50 rounded-lg transition-colors'
                          title='Chỉnh sửa'
                          onClick={() => handleEditProduct(product)}
                        >
                          <i className='fas fa-edit text-sm'></i>
                        </button>
                        <button
                          className='text-red-600 hover:text-red-700 p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors'
                          title='Xóa'
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <i className='fas fa-trash text-sm'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 px-4 md:px-6 py-3'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0'>
          <div className='text-sm text-gray-700 text-center sm:text-left'>
            Hiển thị{' '}
            <span className='font-medium'>1-{filteredProducts.length}</span> của{' '}
            <span className='font-medium'>{filteredProducts.length}</span> sản
            phẩm
          </div>
          <div className='flex items-center justify-center space-x-2'>
            <button className='px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              Trước
            </button>
            <button className='px-3 py-2 text-sm bg-blue-600 text-white rounded-lg'>
              1
            </button>
            <button className='px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full'>
              <div className='bg-white px-6 pt-6 pb-4'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Thêm sản phẩm mới
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className='text-gray-400 hover:text-gray-600 text-xl'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Left Column - Basic Info */}
                    <div className='space-y-4'>
                      <h4 className='text-lg font-medium text-gray-900 border-b pb-2'>
                        Thông tin cơ bản
                      </h4>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Tên sản phẩm <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='text'
                          name='name'
                          value={formData.name}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Nhập tên sản phẩm'
                          required
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Mô tả
                        </label>
                        <textarea
                          name='description'
                          value={formData.description}
                          onChange={handleInputChange}
                          rows='3'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Mô tả sản phẩm...'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Danh mục <span className='text-red-500'>*</span>
                        </label>
                        <CategoryTreeSelect
                          value={formData.category_id}
                          onChange={(category) => {
                            setFormData((prev) => ({
                              ...prev,
                              category_id: category.id,
                            }));
                          }}
                          placeholder='Chọn danh mục sản phẩm'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Giá gốc <span className='text-red-500'>*</span>
                          </label>
                          <input
                            type='number'
                            name='price'
                            value={formData.price}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                            min='0'
                            required
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Giá khuyến mãi
                          </label>
                          <input
                            type='number'
                            name='sale_price'
                            value={formData.sale_price}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                            min='0'
                          />
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Tồn kho <span className='text-red-500'>*</span>
                          </label>
                          <input
                            type='number'
                            name='stock'
                            value={formData.stock}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                            min='0'
                            required
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Trạng thái
                          </label>
                          <select
                            name='status'
                            value={formData.status}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          >
                            <option value='active'>Hoạt động</option>
                            <option value='inactive'>Không hoạt động</option>
                            <option value='out_of_stock'>Hết hàng</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          SKU
                        </label>
                        <input
                          type='text'
                          name='sku'
                          value={formData.sku}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Mã sản phẩm (tự động tạo nếu để trống)'
                        />
                      </div>
                    </div>

                    {/* Right Column - Additional Info & Images */}
                    <div className='space-y-4'>
                      <h4 className='text-lg font-medium text-gray-900 border-b pb-2'>
                        Thông tin bổ sung & Ảnh
                      </h4>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Tags (phân cách bằng dấu phẩy)
                        </label>
                        <input
                          type='text'
                          name='tags'
                          value={formData.tags}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='ví dụ: hot, sale, new'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Kích thước (phân cách bằng dấu phẩy)
                        </label>
                        <input
                          type='text'
                          name='sizes'
                          value={formData.sizes}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='ví dụ: S, M, L, XL'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Màu sắc (phân cách bằng dấu phẩy)
                        </label>
                        <input
                          type='text'
                          name='colors'
                          value={formData.colors}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='ví dụ: Đỏ, Xanh, Trắng'
                        />
                      </div>

                      {/* Main Image Upload */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Ảnh chính
                        </label>
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 relative hover:border-blue-400 transition-colors'>
                          {mainImagePreview ? (
                            <div className='relative'>
                              <img
                                src={mainImagePreview}
                                alt='Preview'
                                className='w-full h-32 object-cover rounded-lg'
                              />
                              <button
                                type='button'
                                onClick={removeMainImage}
                                className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors'
                              >
                                ×
                              </button>
                              <div className='absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center'>
                                <span className='text-white opacity-0 hover:opacity-100 text-sm font-medium'>
                                  Nhấn để thay đổi ảnh
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className='text-center py-6'>
                              <i className='fas fa-cloud-upload-alt text-gray-400 text-3xl mb-3'></i>
                              <p className='text-sm text-gray-600 mb-2'>
                                Nhấn để chọn ảnh chính
                              </p>
                              <p className='text-xs text-gray-500'>
                                PNG, JPG, JPEG tối đa 5MB
                              </p>
                            </div>
                          )}
                          <input
                            type='file'
                            accept='image/*'
                            onChange={handleMainImageChange}
                            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                          />
                        </div>
                      </div>

                      {/* Additional Images Upload */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Ảnh phụ (tối đa 10 ảnh)
                        </label>
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors'>
                          <div className='text-center mb-3'>
                            <i className='fas fa-images text-gray-400 text-2xl mb-2'></i>
                            <p className='text-sm text-gray-600 mb-2'>
                              Chọn nhiều ảnh phụ
                            </p>
                            <label className='inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-100 transition-colors'>
                              <i className='fas fa-plus mr-2'></i>
                              Thêm ảnh phụ
                              <input
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={handleAdditionalImagesChange}
                                className='hidden'
                              />
                            </label>
                          </div>
                          {additionalPreviews.length > 0 && (
                            <div className='grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200'>
                              {additionalPreviews.map((preview, index) => (
                                <div key={index} className='relative group'>
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className='w-full h-20 object-cover rounded-lg'
                                  />
                                  <button
                                    type='button'
                                    onClick={() => removeAdditionalImage(index)}
                                    className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100'
                                  >
                                    ×
                                  </button>
                                  <div className='absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded'>
                                    {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className='bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={uploading}
                  onClick={handleSubmit}
                  className='w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {uploading ? (
                    <>
                      <i className='fas fa-spinner fa-spin mr-2'></i>
                      Đang tải...
                    </>
                  ) : (
                    'Thêm sản phẩm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full'>
              <div className='bg-white px-6 pt-6 pb-4'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Chỉnh sửa sản phẩm: {editingProduct.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetEditForm();
                    }}
                    className='text-gray-400 hover:text-gray-600 text-xl'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Left Column - Basic Info */}
                    <div className='space-y-4'>
                      <h4 className='text-lg font-medium text-gray-900 border-b pb-2'>
                        Thông tin cơ bản
                      </h4>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Tên sản phẩm *
                        </label>
                        <input
                          type='text'
                          name='name'
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Nhập tên sản phẩm'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Mô tả
                        </label>
                        <textarea
                          name='description'
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Nhập mô tả sản phẩm'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Danh mục *
                          </label>
                          <CategoryTreeSelect
                            value={formData.category_id}
                            onChange={(category) => {
                              setFormData((prev) => ({
                                ...prev,
                                category_id: category.id,
                              }));
                            }}
                            placeholder='Chọn danh mục sản phẩm'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Trạng thái
                          </label>
                          <select
                            name='status'
                            value={formData.status}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          >
                            <option value='active'>Hoạt động</option>
                            <option value='inactive'>Không hoạt động</option>
                            <option value='out_of_stock'>Hết hàng</option>
                          </select>
                        </div>
                      </div>

                      <div className='grid grid-cols-3 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Giá gốc *
                          </label>
                          <input
                            type='number'
                            name='price'
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            min='0'
                            step='0.01'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Giá khuyến mãi
                          </label>
                          <input
                            type='number'
                            name='sale_price'
                            value={formData.sale_price}
                            onChange={handleInputChange}
                            min='0'
                            step='0.01'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Số lượng *
                          </label>
                          <input
                            type='number'
                            name='stock'
                            value={formData.stock}
                            onChange={handleInputChange}
                            required
                            min='0'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='0'
                          />
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          SKU
                        </label>
                        <input
                          type='text'
                          name='sku'
                          value={formData.sku}
                          onChange={handleInputChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='Mã sản phẩm (tự động tạo nếu để trống)'
                        />
                      </div>

                      <div className='grid grid-cols-1 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Tags
                          </label>
                          <input
                            type='text'
                            name='tags'
                            value={formData.tags}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='Ví dụ: mới, hot, sale (cách nhau bằng dấu phẩy)'
                          />
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Kích thước
                          </label>
                          <input
                            type='text'
                            name='sizes'
                            value={formData.sizes}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='Ví dụ: S, M, L, XL'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Màu sắc
                          </label>
                          <input
                            type='text'
                            name='colors'
                            value={formData.colors}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            placeholder='Ví dụ: Đỏ, Xanh, Vàng'
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Images */}
                    <div className='space-y-4'>
                      <h4 className='text-lg font-medium text-gray-900 border-b pb-2'>
                        Ảnh sản phẩm
                      </h4>

                      {/* Current Main Image */}
                      {editingProduct.image_url && (
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Ảnh chính hiện tại
                          </label>
                          <div className='relative'>
                            <img
                              src={getImageUrl(editingProduct.image_url)}
                              alt='Current main'
                              className='w-32 h-32 object-cover rounded-lg border-2 border-gray-200'
                            />
                            <div className='absolute top-2 right-2'>
                              <label className='flex items-center'>
                                <input
                                  type='checkbox'
                                  checked={keepOldImages.mainImage}
                                  onChange={handleToggleOldMainImage}
                                  className='mr-1'
                                />
                                <span className='text-xs bg-white px-1 rounded'>
                                  Giữ
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Main Image Upload */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          {editingProduct.image_url
                            ? 'Thay ảnh chính mới'
                            : 'Ảnh chính *'}
                        </label>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleMainImageChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                        {mainImagePreview && (
                          <div className='mt-2 relative'>
                            <img
                              src={mainImagePreview}
                              alt='New main preview'
                              className='w-32 h-32 object-cover rounded-lg border-2 border-blue-200'
                            />
                            <button
                              type='button'
                              onClick={removeMainImage}
                              className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600'
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Current Additional Images */}
                      {editingProduct.images &&
                        editingProduct.images.length > 0 && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                              Ảnh phụ hiện tại
                            </label>
                            <div className='grid grid-cols-3 gap-2'>
                              {editingProduct.images.map((image, index) => (
                                <div key={index} className='relative'>
                                  <img
                                    src={getImageUrl(image)}
                                    alt={`Current additional ${index + 1}`}
                                    className='w-20 h-20 object-cover rounded border-2 border-gray-200'
                                  />
                                  <div className='absolute top-1 right-1'>
                                    <label className='flex items-center'>
                                      <input
                                        type='checkbox'
                                        checked={
                                          keepOldImages.additionalImages[
                                            index
                                          ] || false
                                        }
                                        onChange={() =>
                                          handleToggleOldAdditionalImage(index)
                                        }
                                        className='mr-1 scale-75'
                                      />
                                      <span className='text-xs bg-white px-1 rounded'>
                                        Giữ
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* New Additional Images Upload */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          {editingProduct.images &&
                          editingProduct.images.length > 0
                            ? 'Thêm ảnh phụ mới'
                            : 'Ảnh phụ'}
                        </label>
                        <input
                          type='file'
                          accept='image/*'
                          multiple
                          onChange={handleAdditionalImagesChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                        {additionalPreviews.length > 0 && (
                          <div className='mt-2 grid grid-cols-3 gap-2'>
                            {additionalPreviews.map((preview, index) => (
                              <div key={index} className='relative'>
                                <img
                                  src={preview}
                                  alt={`New additional preview ${index + 1}`}
                                  className='w-20 h-20 object-cover rounded border-2 border-blue-200'
                                />
                                <button
                                  type='button'
                                  onClick={() => removeAdditionalImage(index)}
                                  className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600'
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className='flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowEditModal(false);
                        resetEditForm();
                      }}
                      className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                    >
                      Hủy
                    </button>
                    <button
                      type='submit'
                      disabled={uploading}
                      className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                      {uploading ? (
                        <>
                          <i className='fas fa-spinner fa-spin mr-2'></i>
                          Đang cập nhật...
                        </>
                      ) : (
                        'Cập nhật sản phẩm'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageModal && selectedProduct && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Gallery ảnh - {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                {/* Main Image Section */}
                <div className='mb-6'>
                  <h4 className='text-sm font-medium text-gray-700 flex items-center mb-2'>
                    <i className='fas fa-star text-blue-500 mr-2'></i>
                    Ảnh chính
                  </h4>
                  <div className='flex justify-center bg-gray-100 rounded-lg overflow-hidden'>
                    {selectedProduct.image_url ? (
                      <img
                        src={getImageUrl(selectedProduct.image_url)}
                        alt={selectedProduct.name}
                        className='h-72 object-contain rounded-lg'
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA2QzMgNC4zNDMxNSA0LjM0MzE1IDMgNiAzSDEySDFhQzE5LjY1NjkgMyAyMSA0LjM0MzE1IDIxIDZWMTRWMThDMjEgMTkuNjU2OSAxOS42NTY5IDIxIDE4IDIxSDEySDZDNC4zNDMxNSAyMSAzIDE5LjY1NjkgMyAxOFYxNFY2WiIgc3Ryb2tlPSIjOUU5RTlFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDdMMTAuNSAxNEwyMSA3IiBzdHJva2U9IiM5RTlFOUUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className='w-full h-72 bg-gray-200 flex items-center justify-center rounded-lg'>
                        <i className='fas fa-image text-gray-400 text-4xl'></i>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Images Section */}
                <div>
                  <h4 className='text-sm font-medium text-gray-700 flex items-center mb-2'>
                    <i className='fas fa-images text-green-500 mr-2'></i>
                    Ảnh phụ (
                    {selectedProduct.images ? selectedProduct.images.length : 0}
                    )
                  </h4>

                  {selectedProduct.images &&
                  selectedProduct.images.length > 0 ? (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                      {selectedProduct.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className='relative group bg-gray-100 rounded-lg p-1 border border-gray-200'
                        >
                          <div className='aspect-w-1 aspect-h-1'>
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`${selectedProduct.name} - ảnh ${index + 1}`}
                              className='w-full h-32 object-contain rounded'
                              onError={(e) => {
                                e.target.src =
                                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA2QzMgNC4zNDMxNSA0LjM0MzE1IDMgNiAzSDEySDFhQzE5LjY1NjkgMyAyMSA0LjM0MzE1IDIxIDZWMTRWMThDMjEgMTkuNjU2OSAxOS42NTY5IDIxIDE4IDIxSDEySDZDNC4zNDMxNSAyMSAzIDE5LjY1NjkgMyAxOFYxNFY2WiIgc3Ryb2tlPSIjOUU5RTlFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDdMMTAuNSAxNEwyMSA3IiBzdHJva2U9IiM5RTlFOUUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                              }}
                            />
                          </div>
                          <div className='absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded'>
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center'>
                      <div className='text-center'>
                        <i className='fas fa-images text-gray-400 text-2xl mb-2'></i>
                        <p className='text-sm text-gray-500'>Chưa có ảnh phụ</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Summary */}
                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-500'>Danh mục:</span>
                      <span className='ml-2 text-gray-900'>
                        {selectedProduct.Category?.name || 'Chưa phân loại'}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-500'>Giá:</span>
                      <span className='ml-2 text-gray-900'>
                        {formatCurrency(selectedProduct.price)}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-500'>Tồn kho:</span>
                      <span className='ml-2 text-gray-900'>
                        {selectedProduct.stock} sản phẩm
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-500'>Tổng ảnh:</span>
                      <span className='ml-2 text-gray-900'>
                        {1 +
                          (selectedProduct.images
                            ? selectedProduct.images.length
                            : 0)}{' '}
                        ảnh
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  onClick={() => setShowImageModal(false)}
                  className='w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm'
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagement;
