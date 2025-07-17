import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔄 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    console.log('📊 [API] Response:', response.data);
    return response;
  },
  (error) => {
    console.error(
      `❌ [API] ${error.config?.method?.toUpperCase()} ${error.config?.url}`
    );
    console.error('❌ [API] Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
