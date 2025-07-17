import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      dispatch(logout());
      navigate('/');
    }
  };

  const menuItems = [
    {
      path: '/admin',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      exact: true,
    },
    {
      path: '/admin/products',
      icon: 'fas fa-box',
      label: 'Quản lý Sản phẩm',
    },
    {
      path: '/admin/orders',
      icon: 'fas fa-shopping-cart',
      label: 'Quản lý Đơn hàng',
    },
    {
      path: '/admin/users',
      icon: 'fas fa-users',
      label: 'Quản lý Người dùng',
    },
    {
      path: '/admin/categories',
      icon: 'fas fa-tags',
      label: 'Quản lý Danh mục',
    },
    {
      path: '/admin/wallets',
      icon: 'fas fa-wallet',
      label: 'Quản lý Ví Tiền',
    },
    {
      path: '/admin/reports',
      icon: 'fas fa-chart-bar',
      label: 'Báo cáo & Thống kê',
    },
    {
      path: '/admin/settings',
      icon: 'fas fa-cog',
      label: 'Cài đặt',
    },
  ];

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-6'>
        <div className='bg-white rounded-lg shadow-md p-8 text-center max-w-md w-full'>
          <div className='text-red-500 text-5xl mb-4'>
            <i className='fas fa-exclamation-triangle'></i>
          </div>
          <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
            Truy cập bị từ chối
          </h2>
          <p className='text-gray-600 mb-6'>
            Bạn không có quyền truy cập vào trang quản trị.
          </p>
          <Link
            to='/'
            className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className='flex items-center justify-between h-16 px-4 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <i className='fas fa-store text-white text-sm'></i>
            </div>
            {!sidebarCollapsed && (
              <span className='font-semibold text-gray-800'>Admin Panel</span>
            )}
          </div>
          <button
            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i
              className={`fas text-sm ${
                sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'
              }`}
            ></i>
          </button>
        </div>

        <nav className='p-4'>
          <ul className='space-y-2'>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActiveRoute(item.path, item.exact)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${item.icon} text-sm w-4`}></i>
                  {!sidebarCollapsed && (
                    <span className='font-medium'>{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white'>
          <div className='space-y-2'>
            <Link
              to='/'
              className='flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors'
              title='Về trang chủ'
            >
              <i className='fas fa-home text-sm w-4'></i>
              {!sidebarCollapsed && (
                <span className='font-medium'>Về trang chủ</span>
              )}
            </Link>
            <button
              className='flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left'
              onClick={handleLogout}
              title='Đăng xuất'
            >
              <i className='fas fa-sign-out-alt text-sm w-4'></i>
              {!sidebarCollapsed && (
                <span className='font-medium'>Đăng xuất</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 flex flex-col'>
        <header className='bg-white shadow-sm border-b border-gray-200 h-16'>
          <div className='flex items-center justify-between h-full px-6'>
            <div>
              <h1 className='text-xl font-semibold text-gray-800'>
                {menuItems.find((item) => isActiveRoute(item.path, item.exact))
                  ?.label || 'Admin Panel'}
              </h1>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-3 text-sm'>
                <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
                  <i className='fas fa-user-circle text-gray-600'></i>
                </div>
                <div className='hidden md:block'>
                  <div className='font-medium text-gray-900'>
                    {user?.name || user?.username}
                  </div>
                  <div className='text-gray-500'>Quản trị viên</div>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <button
                  className='relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                  title='Thông báo'
                >
                  <i className='fas fa-bell'></i>
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    3
                  </span>
                </button>

                <button
                  className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  onClick={handleLogout}
                  title='Đăng xuất'
                >
                  <i className='fas fa-sign-out-alt'></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className='flex-1 p-6 overflow-auto'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
