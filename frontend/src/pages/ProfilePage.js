import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, updateUserProfile } from '../features/auth/authSlice';
import authService from '../services/authService';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }

    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [isAuthenticated, user, navigate]);

  // Lấy danh sách đơn hàng khi tab đơn hàng được chọn
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      console.log('🔍 [PROFILE] Fetching user orders...');
      const response = await orderService.getUserOrders();
      console.log('📦 [PROFILE] Orders response:', response);
      console.log('📋 [PROFILE] Orders data:', response.data);

      if (response.data && response.data.length > 0) {
        console.log(
          '📅 [PROFILE] First order created_at:',
          response.data[0].created_at
        );
        console.log('📅 [PROFILE] First order full data:', response.data[0]);
      }

      setOrders(response.data || []);
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching orders:', error);
      console.error('❌ [PROFILE] Error response:', error.response);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gọi action Redux để cập nhật thông tin người dùng
      await dispatch(updateUserProfile(profileData)).unwrap();
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error || 'Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error || 'Có lỗi xảy ra khi đổi mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết đơn hàng
  const handleViewOrderDetail = (order) => {
    setSelectedOrder(order);
  };

  // Quay lại danh sách đơn hàng
  const handleBackToOrdersList = () => {
    setSelectedOrder(null);
  };

  // Hiển thị trạng thái đơn hàng dưới dạng badge
  const getOrderStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      pending: 'Chờ xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusClasses[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Đăng xuất thành công!');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='bg-gray-50 min-h-screen py-8'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          <div className='md:flex'>
            {/* Sidebar */}
            <div className='md:w-1/4 border-r border-gray-200'>
              <div className='p-6 text-center border-b border-gray-200'>
                <div className='w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-12 w-12 text-gray-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
                <h3 className='text-xl font-semibold text-gray-800'>
                  {user?.name || 'Người dùng'}
                </h3>
                <p className='text-gray-600 mt-1 text-sm'>{user?.email}</p>
              </div>

              <nav className='p-4'>
                <button
                  className={`w-full text-left py-3 px-4 rounded-md mb-2 flex items-center transition ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-3'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                  Thông tin cá nhân
                </button>
                <button
                  className={`w-full text-left py-3 px-4 rounded-md mb-2 flex items-center transition ${
                    activeTab === 'orders'
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('orders')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-3'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                    />
                  </svg>
                  Đơn hàng của tôi
                </button>
                <button
                  className={`w-full text-left py-3 px-4 rounded-md mb-2 flex items-center transition hover:bg-gray-100`}
                  onClick={() => navigate('/wishlist')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-3'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                    />
                  </svg>
                  Sản phẩm yêu thích
                </button>
                <button
                  className={`w-full text-left py-3 px-4 rounded-md mb-2 flex items-center transition ${
                    activeTab === 'password'
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('password')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-3'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                  Đổi mật khẩu
                </button>
                <hr className='my-4' />
                <button
                  className='w-full text-left py-3 px-4 rounded-md flex items-center transition text-red-600 hover:bg-red-50'
                  onClick={handleLogout}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-3'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                  Đăng xuất
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className='md:w-3/4 p-6'>
              {activeTab === 'profile' && (
                <div className='profile-section'>
                  <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>
                      Thông tin cá nhân
                    </h2>
                    <button
                      className={`flex items-center px-4 py-2 rounded-md transition ${
                        isEditing
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4 mr-2'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                          Hủy
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4 mr-2'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                          </svg>
                          Chỉnh sửa
                        </>
                      )}
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='form-group'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Họ và tên
                        </label>
                        <input
                          type='text'
                          name='name'
                          value={profileData.name}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          required
                          className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                        />
                      </div>
                      <div className='form-group'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Email
                        </label>
                        <input
                          type='email'
                          name='email'
                          value={profileData.email}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          required
                          className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                        />
                      </div>
                    </div>

                    <div className='form-group'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Số điện thoại
                      </label>
                      <input
                        type='tel'
                        name='phone'
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                      />
                    </div>

                    <div className='form-group'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Địa chỉ
                      </label>
                      <textarea
                        name='address'
                        value={profileData.address}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        rows={3}
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                      />
                    </div>

                    {isEditing && (
                      <button
                        type='submit'
                        className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className='orders-section'>
                  <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>
                      {selectedOrder ? 'Chi tiết đơn hàng' : 'Đơn hàng của tôi'}
                    </h2>
                    {selectedOrder && (
                      <button
                        onClick={handleBackToOrdersList}
                        className='flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4 mr-2'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M10 19l-7-7m0 0l7-7m-7 7h18'
                          />
                        </svg>
                        Quay lại
                      </button>
                    )}
                  </div>

                  {loadingOrders ? (
                    <div className='flex justify-center items-center h-64'>
                      <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
                    </div>
                  ) : selectedOrder ? (
                    <div className='bg-white rounded-lg border border-gray-200'>
                      <div className='p-4 border-b border-gray-200'>
                        <div className='flex flex-wrap justify-between items-center'>
                          <div>
                            <p className='text-sm text-gray-500'>Mã đơn hàng</p>
                            <p className='font-medium'>#{selectedOrder.id}</p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Ngày đặt</p>
                            <p className='font-medium'>
                              {selectedOrder.created_at
                                ? new Date(
                                    selectedOrder.created_at
                                  ).toLocaleDateString('vi-VN')
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Tổng tiền</p>
                            <p className='font-medium text-blue-600'>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(selectedOrder.total_amount)}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Trạng thái</p>
                            {getOrderStatusBadge(selectedOrder.status)}
                          </div>
                        </div>
                      </div>

                      <div className='p-4'>
                        <h3 className='font-semibold text-gray-800 mb-2'>
                          Thông tin giao hàng
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                          <div>
                            <p className='text-sm text-gray-500'>Người nhận</p>
                            <p className='font-medium'>
                              {selectedOrder.shipping_name}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>
                              Số điện thoại
                            </p>
                            <p className='font-medium'>
                              {selectedOrder.shipping_phone}
                            </p>
                          </div>
                          <div className='md:col-span-2'>
                            <p className='text-sm text-gray-500'>Địa chỉ</p>
                            <p className='font-medium'>
                              {selectedOrder.shipping_address}
                            </p>
                          </div>
                        </div>

                        <h3 className='font-semibold text-gray-800 mb-2'>
                          Sản phẩm
                        </h3>
                        <div className='space-y-4'>
                          {selectedOrder.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className='flex items-center border-b border-gray-100 pb-4'
                            >
                              <div className='w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden'>
                                {item.product?.image_url && (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    className='w-full h-full object-cover'
                                  />
                                )}
                              </div>
                              <div className='ml-4 flex-grow'>
                                <h4 className='font-medium text-gray-800'>
                                  {item.product?.name}
                                </h4>
                                <p className='text-sm text-gray-500'>
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(item.price)}{' '}
                                  x {item.quantity}
                                </p>
                              </div>
                              <div className='text-right'>
                                <p className='font-medium text-blue-600'>
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className='mt-6 border-t border-gray-200 pt-4'>
                          <div className='flex justify-between items-center'>
                            <p className='font-medium text-gray-700'>
                              Tạm tính:
                            </p>
                            <p className='font-medium'>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(selectedOrder.subtotal_amount || 0)}
                            </p>
                          </div>
                          <div className='flex justify-between items-center mt-2'>
                            <p className='font-medium text-gray-700'>
                              Phí vận chuyển:
                            </p>
                            <p className='font-medium'>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(selectedOrder.shipping_fee || 0)}
                            </p>
                          </div>
                          <div className='flex justify-between items-center mt-2'>
                            <p className='font-semibold text-gray-800'>
                              Tổng cộng:
                            </p>
                            <p className='font-semibold text-blue-600'>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(selectedOrder.total_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className='space-y-4'>
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className='bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition'
                        >
                          <div className='p-4 flex flex-wrap justify-between items-center'>
                            <div className='mb-2 md:mb-0'>
                              <p className='text-sm text-gray-500'>
                                Mã đơn hàng
                              </p>
                              <p className='font-medium'>#{order.id}</p>
                            </div>
                            <div className='mb-2 md:mb-0'>
                              <p className='text-sm text-gray-500'>Ngày đặt</p>
                              <p className='font-medium'>
                                {order.created_at
                                  ? new Date(
                                      order.created_at
                                    ).toLocaleDateString('vi-VN')
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className='mb-2 md:mb-0'>
                              <p className='text-sm text-gray-500'>Tổng tiền</p>
                              <p className='font-medium text-blue-600'>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(order.total_amount)}
                              </p>
                            </div>
                            <div className='mb-2 md:mb-0'>
                              <p className='text-sm text-gray-500'>
                                Trạng thái
                              </p>
                              {getOrderStatusBadge(order.status)}
                            </div>
                            <button
                              onClick={() => handleViewOrderDetail(order)}
                              className='px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition mt-2 md:mt-0'
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-16 border border-gray-200 rounded-lg bg-white'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='mx-auto h-12 w-12 text-gray-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                        />
                      </svg>
                      <h3 className='mt-2 text-sm font-medium text-gray-900'>
                        Chưa có đơn hàng
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        Bạn chưa có đơn hàng nào
                      </p>
                      <div className='mt-6'>
                        <button
                          onClick={() => navigate('/')}
                          className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                          Mua sắm ngay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'password' && (
                <div className='password-section'>
                  <h2 className='text-2xl font-bold text-gray-800 mb-6'>
                    Đổi mật khẩu
                  </h2>
                  <form
                    onSubmit={handleChangePassword}
                    className='space-y-6 max-w-lg'
                  >
                    <div className='form-group'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type='password'
                        name='currentPassword'
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <div className='form-group'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Mật khẩu mới
                      </label>
                      <input
                        type='password'
                        name='newPassword'
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <div className='form-group'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type='password'
                        name='confirmPassword'
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <button
                      type='submit'
                      className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                      disabled={loading}
                    >
                      {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
