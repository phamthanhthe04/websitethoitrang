// src/services/productService.js
import api from './api';

export const getProducts = (params = {}) => api.get('/products', { params }); // Thêm params nếu API hỗ trợ
export const getProduct = (id) => api.get(`/products/${id}`);
export const getProductBySlug = (slug) => api.get(`/products/slug/${slug}`);
