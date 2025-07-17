import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const walletApi = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
walletApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User wallet services
export const getMyWallet = async () => {
  const response = await walletApi.get('/wallet/my-wallet');
  return response.data;
};

export const getMyTransactions = async (params = {}) => {
  const response = await walletApi.get('/wallet/my-transactions', { params });
  return response.data;
};

export const payOrderWithWallet = async (orderId) => {
  console.log('💰 [WALLET SERVICE] Paying order with wallet:', orderId);
  try {
    const response = await walletApi.post('/wallet/pay-order', { orderId });
    console.log('✅ [WALLET SERVICE] Payment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [WALLET SERVICE] Payment error:', error);
    console.error('❌ [WALLET SERVICE] Error response:', error.response?.data);
    throw error;
  }
};

// Admin wallet services
export const getAllWallets = async (params = {}) => {
  const response = await walletApi.get('/wallet/admin/wallets', { params });
  return response.data;
};

export const getAllTransactions = async (params = {}) => {
  const response = await walletApi.get('/wallet/admin/transactions', {
    params,
  });
  return response.data;
};

export const depositMoney = async (userId, amount, description) => {
  const response = await walletApi.post('/wallet/admin/deposit', {
    userId,
    amount,
    description,
  });
  return response.data;
};

export const updateWalletStatus = async (walletId, status) => {
  const response = await walletApi.put(
    `/wallet/admin/wallets/${walletId}/status`,
    {
      status,
    }
  );
  return response.data;
};

export const getUserTransactions = async (userId, params = {}) => {
  const response = await walletApi.get(
    `/wallet/admin/users/${userId}/transactions`,
    {
      params,
    }
  );
  return response.data;
};
