import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { saveAuthData } from '../utils/auth'; // Lưu token & user vào localStorage
import { useDispatch } from 'react-redux';
import { setAuthData } from '../features/auth/authSlice';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(formData.email, formData.password);
      const { token, ...user } = res.data;

      // Lưu token + user vào localStorage
      saveAuthData(token, user);

      // Cập nhật Redux
      dispatch(setAuthData({ token, user }));

      // Điều hướng về trang trước đó hoặc trang chủ
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-2xl shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='px-8 pt-8 pb-6 text-center'>
            <h2 className='text-3xl font-bold text-gray-800 mb-2'>Đăng nhập</h2>
            <p className='text-gray-600'>Chào mừng bạn quay trở lại</p>
          </div>

          {/* Form */}
          <form className='px-8 pb-8' onSubmit={handleSubmit}>
            {error && (
              <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm'>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className='mb-4'>
              <label className='block text-gray-700 text-sm font-semibold mb-2'>
                Email
              </label>
              <div className='relative'>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder='Nhập email của bạn'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                />
                <i className='fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'></i>
              </div>
            </div>

            {/* Password Field */}
            <div className='mb-6'>
              <label className='block text-gray-700 text-sm font-semibold mb-2'>
                Mật khẩu
              </label>
              <div className='relative'>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder='Nhập mật khẩu'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                />
                <i className='fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'></i>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className='flex items-center justify-between mb-6'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                />
                <span className='ml-2 text-sm text-gray-600'>
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <button
                type='button'
                className='text-sm text-blue-600 hover:text-blue-800 transition-colors'
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
              }`}
            >
              {loading ? (
                <div className='flex items-center justify-center'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                  Đang đăng nhập...
                </div>
              ) : (
                <div className='flex items-center justify-center'>
                  <i className='fas fa-sign-in-alt mr-2'></i>
                  Đăng nhập
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className='px-8 py-4'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className='px-8 pb-6'>
            <div className='grid grid-cols-2 gap-3'>
              <button className='flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                <i className='fab fa-google text-red-500 mr-2'></i>
                <span className='text-gray-700'>Google</span>
              </button>
              <button className='flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                <i className='fab fa-facebook-f text-blue-600 mr-2'></i>
                <span className='text-gray-700'>Facebook</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className='px-8 py-4 bg-gray-50 text-center'>
            <p className='text-gray-600'>
              Chưa có tài khoản?{' '}
              <a
                href='/dang-ky'
                className='text-blue-600 hover:text-blue-800 font-semibold transition-colors'
              >
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
