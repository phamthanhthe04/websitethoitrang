import api from './api';

// Get authentication token
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance for admin operations with auth
const adminApi = api.create({
  baseURL: 'http://localhost:5000/api/admin',
  timeout: 30000, // Longer timeout for file uploads
});

// Add auth header to all admin requests
adminApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for debugging
adminApi.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [ADMIN API] ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`
    );
    console.log('📊 [ADMIN API] Response:', response.data);
    return response;
  },
  (error) => {
    console.error(
      `❌ [ADMIN API] ${error.config?.method?.toUpperCase()} ${
        error.config?.url
      }`
    );
    console.error(
      '❌ [ADMIN API] Error:',
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard
  getDashboardStats: () => adminApi.get('/dashboard-stats'),

  // Products
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();

    // Add query parameters
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return adminApi.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getProduct: (id) => adminApi.get(`/products/${id}`),

  createProduct: (productData) => {
    const formData = new FormData();

    // Add text fields
    Object.keys(productData).forEach((key) => {
      if (
        key !== 'mainImage' &&
        key !== 'additionalImages' &&
        productData[key] !== null &&
        productData[key] !== ''
      ) {
        formData.append(key, productData[key]);
      }
    });

    // Add main image
    if (productData.mainImage) {
      formData.append('mainImage', productData.mainImage);
    }

    // Add additional images
    if (
      productData.additionalImages &&
      productData.additionalImages.length > 0
    ) {
      productData.additionalImages.forEach((image) => {
        formData.append('additionalImages', image);
      });
    }

    return adminApi.post('/products', formData);
  },

  updateProduct: (id, productData) => {
    const formData = new FormData();

    // Add text fields
    Object.keys(productData).forEach((key) => {
      if (
        key !== 'mainImage' &&
        key !== 'additionalImages' &&
        key !== 'keepOldAdditionalImages' &&
        key !== 'keepOldMainImage' &&
        productData[key] !== null &&
        productData[key] !== ''
      ) {
        formData.append(key, productData[key]);
      }
    });

    // Add main image if updated
    if (productData.mainImage) {
      formData.append('mainImage', productData.mainImage);
    }

    // Add flag to keep old main image
    if (productData.keepOldMainImage) {
      formData.append('keepOldMainImage', 'true');
    }

    // Add additional images if updated
    if (
      productData.additionalImages &&
      productData.additionalImages.length > 0
    ) {
      productData.additionalImages.forEach((image) => {
        formData.append('additionalImages', image);
      });
    }

    // Add keep old images flags
    if (productData.keepOldAdditionalImages) {
      formData.append(
        'keepOldAdditionalImages',
        JSON.stringify(productData.keepOldAdditionalImages)
      );
    }

    return adminApi.put(`/products/${id}`, formData);
  },

  deleteProduct: (id) => adminApi.delete(`/products/${id}`),

  bulkDeleteProducts: (productIds) =>
    adminApi.delete('/products/bulk-delete', { data: { productIds } }),

  updateProductStatus: (id, status) =>
    adminApi.put(`/products/${id}/status`, { status }),

  // Users
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    return adminApi.get(`/users${queryString ? `?${queryString}` : ''}`);
  },

  updateUserStatus: (id, status) =>
    adminApi.put(`/users/${id}/status`, { status }),

  updateUserRole: (id, role) => adminApi.put(`/users/${id}/role`, { role }),

  deleteUser: (id) => adminApi.delete(`/users/${id}`),

  // Orders
  getOrders: (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return adminApi.get(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  updateOrderStatus: (id, status) =>
    adminApi.put(`/orders/${id}/status`, { status }),

  deleteOrder: (id) => adminApi.delete(`/orders/${id}`),

  // Categories
  getCategories: () => adminApi.get('/categories'),

  createCategory: (categoryData) => adminApi.post('/categories', categoryData),

  updateCategory: (id, categoryData) =>
    adminApi.put(`/categories/${id}`, categoryData),

  deleteCategory: (id) => adminApi.delete(`/categories/${id}`),
};
