import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminService.getUsers();

        // Lưu trữ giá trị ban đầu cho việc so sánh khi cập nhật
        const usersWithOriginalValues = res.data.map((user) => ({
          ...user,
          originalRole: user.role,
          originalStatus: user.status,
        }));

        setUsers(usersWithOriginalValues);
        console.log('Dữ liệu người dùng nhận được:', usersWithOriginalValues);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Xử lý chọn người dùng để chỉnh sửa
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Xử lý lưu thông tin người dùng
  const handleSaveUser = async (e) => {
    e.preventDefault();

    try {
      // Cập nhật vai trò
      if (selectedUser.role !== selectedUser.originalRole) {
        await adminService.updateUserRole(selectedUser.id, selectedUser.role);
      }

      // Cập nhật trạng thái
      if (selectedUser.status !== selectedUser.originalStatus) {
        await adminService.updateUserStatus(
          selectedUser.id,
          selectedUser.status
        );
      }

      // Cập nhật danh sách người dùng
      setUsers(
        users.map((user) => (user.id === selectedUser.id ? selectedUser : user))
      );

      setShowEditModal(false);
      alert('Cập nhật người dùng thành công!');
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Có lỗi xảy ra khi cập nhật người dùng');
    }
  };

  // Xử lý xóa người dùng
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter((user) => user.id !== userId));
        alert('Xóa người dùng thành công!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  // Xử lý thay đổi thông tin người dùng khi chỉnh sửa
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: value,
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-600'>Đang tải danh sách người dùng...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Quản lý người dùng
          </h1>
          <p className='text-gray-600 mt-1'>
            Tổng cộng {users.length} người dùng
          </p>
        </div>
        <button className='mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center'>
          <i className='fas fa-user-plus mr-2'></i>
          Thêm người dùng
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tìm kiếm
            </label>
            <div className='relative'>
              <i className='fas fa-search absolute left-3 top-3 text-gray-400'></i>
              <input
                type='text'
                placeholder='Tìm theo tên hoặc email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tất cả vai trò</option>
              <option value='admin'>Quản trị viên</option>
              <option value='user'>Người dùng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Người dùng
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Vai trò
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trạng thái
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Ngày tham gia
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredUsers.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-4'>
                        <i className='fas fa-user text-gray-600'></i>
                      </div>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status === 'active'
                        ? 'Hoạt động'
                        : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {formatDate(user.created_at)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end space-x-2'>
                      <button
                        onClick={() => handleEditUser(user)}
                        className='text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors'
                      >
                        <i className='fas fa-edit'></i>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className='text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <i className='fas fa-trash'></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-users text-blue-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Tổng người dùng
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {users.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-user-check text-green-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Đang hoạt động
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-user-shield text-purple-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Quản trị viên</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-user-plus text-yellow-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Mới tháng này</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {
                  users.filter(
                    (u) =>
                      new Date(u.created_at).getMonth() ===
                      new Date().getMonth()
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Chỉnh sửa người dùng
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                <form className='space-y-4' onSubmit={handleSaveUser}>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Tên
                    </label>
                    <input
                      type='text'
                      name='name'
                      value={selectedUser.name}
                      onChange={handleUserChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email
                    </label>
                    <input
                      type='email'
                      name='email'
                      value={selectedUser.email}
                      onChange={handleUserChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Vai trò
                      </label>
                      <select
                        name='role'
                        value={selectedUser.role}
                        onChange={handleUserChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value='user'>Người dùng</option>
                        <option value='admin'>Quản trị viên</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Trạng thái
                      </label>
                      <select
                        name='status'
                        value={selectedUser.status}
                        onChange={handleUserChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value='active'>Hoạt động</option>
                        <option value='inactive'>Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button className='w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm'>
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className='mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
