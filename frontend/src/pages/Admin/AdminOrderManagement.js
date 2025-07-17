import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await adminService.getOrders();
        const ordersData = response.data.data || response.data || [];
        setOrders(ordersData);
        setLoading(false);
        console.log(`👥 [ORDERS] Found ${ordersData.length} orders`);
        console.log(response);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const textMap = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return textMap[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusText = (status) => {
    const textMap = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
    };
    return textMap[status] || status;
  };

  const getPaymentMethodText = (method) => {
    const textMap = {
      COD: 'Thanh toán khi nhận hàng',
      'bank-transfer': 'Chuyển khoản',
      'e-wallet': 'Ví điện tử',
    };
    return textMap[method] || method;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm)) ??
      false;
    const orderStatus = order.order_status;
    const matchesStatus =
      statusFilter === 'all' || orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.order_status === 'pending').length,
    confirmed: orders.filter((o) => o.order_status === 'confirmed').length,
    shipped: orders.filter((o) => o.order_status === 'shipped').length,
    delivered: orders.filter((o) => o.order_status === 'delivered').length,
    cancelled: orders.filter((o) => o.order_status === 'cancelled').length,
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !selectedStatus) return;

    try {
      setUpdatingStatus(true);
      await adminService.updateOrderStatus(selectedOrder.id, selectedStatus);

      // Update local state
      const updatedOrders = orders.map((order) => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            order_status: selectedStatus,
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setSelectedOrder({
        ...selectedOrder,
        order_status: selectedStatus,
      });
      setShowStatusModal(false);

      // Show success message
      alert('Cập nhật trạng thái đơn hàng thành công');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.order_status);
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-600'>Đang tải danh sách đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-gray-900'>
          Quản lý đơn hàng
        </h1>
        <p className='text-gray-600 mt-1'>Tổng cộng {orders.length} đơn hàng</p>
      </div>

      {/* Status Filter Tabs */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex flex-wrap gap-2'>
          {[
            { key: 'all', label: 'Tất cả', count: statusCounts.all },
            { key: 'pending', label: 'Chờ xử lý', count: statusCounts.pending },
            {
              key: 'confirmed',
              label: 'Đã xác nhận',
              count: statusCounts.confirmed,
            },
            { key: 'shipped', label: 'Đang giao', count: statusCounts.shipped },
            {
              key: 'delivered',
              label: 'Đã giao',
              count: statusCounts.delivered,
            },
            {
              key: 'cancelled',
              label: 'Đã hủy',
              count: statusCounts.cancelled,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className='mt-4'>
          <div className='relative'>
            <i className='fas fa-search absolute left-3 top-3 text-gray-400'></i>
            <input
              type='text'
              placeholder='Tìm theo ID, tên khách hàng hoặc email...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Đơn hàng
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Khách hàng
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Tổng tiền
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trạng thái
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Thanh toán
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Ngày đặt
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredOrders.map((order) => (
                <tr key={order.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        #{order.id}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {order.items_count} sản phẩm
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {order.customer_name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {order.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        order.status || order.order_status
                      )}`}
                    >
                      {getStatusText(order.status || order.order_status)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {getPaymentStatusText(order.payment_status)}
                      </span>
                      <div className='text-xs text-gray-500 mt-1'>
                        {getPaymentMethodText(order.payment_method)}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end space-x-2'>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className='text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors'
                        title='Xem chi tiết'
                      >
                        <i className='fas fa-eye'></i>
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(order)}
                        className='text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors'
                        title='Cập nhật trạng thái'
                      >
                        <i className='fas fa-edit'></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-shopping-cart text-blue-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-clock text-yellow-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Chờ xử lý</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.pending}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-check-circle text-green-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Đã giao</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.delivered}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4'>
              <i className='fas fa-times-circle text-red-600'></i>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Đã hủy</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.cancelled}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Chi tiết đơn hàng #{selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Khách hàng
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.customer_name}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Email
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.customer_email}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Tổng tiền
                      </label>
                      <p className='text-sm font-semibold text-gray-900'>
                        {formatCurrency(selectedOrder.total_amount)}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Số sản phẩm
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.items_count} sản phẩm
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Trạng thái đơn hàng
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Trạng thái thanh toán
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                          selectedOrder.payment_status
                        )}`}
                      >
                        {getPaymentStatusText(selectedOrder.payment_status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Phương thức thanh toán
                    </label>
                    <p className='text-sm text-gray-900'>
                      {getPaymentMethodText(selectedOrder.payment_method)}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Ngày đặt hàng
                    </label>
                    <p className='text-sm text-gray-900'>
                      {formatDateTime(selectedOrder.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  onClick={() => handleOpenStatusModal(selectedOrder)}
                  className='w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cập nhật trạng thái
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className='mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center'>
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

            <div className='inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Cập nhật trạng thái đơn hàng #{selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <i className='fas fa-times'></i>
                  </button>
                </div>

                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Khách hàng
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.customer_name}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Email
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.customer_email}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Tổng tiền
                      </label>
                      <p className='text-sm font-semibold text-gray-900'>
                        {formatCurrency(selectedOrder.total_amount)}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Số sản phẩm
                      </label>
                      <p className='text-sm text-gray-900'>
                        {selectedOrder.items_count} sản phẩm
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Trạng thái đơn hàng
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Trạng thái thanh toán
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                          selectedOrder.payment_status
                        )}`}
                      >
                        {getPaymentStatusText(selectedOrder.payment_status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Phương thức thanh toán
                    </label>
                    <p className='text-sm text-gray-900'>
                      {getPaymentMethodText(selectedOrder.payment_method)}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Ngày đặt hàng
                    </label>
                    <p className='text-sm text-gray-900'>
                      {formatDateTime(selectedOrder.created_at)}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Chọn trạng thái mới
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value=''>-- Chọn trạng thái --</option>
                      <option value='pending'>Chờ xử lý</option>
                      <option value='confirmed'>Đã xác nhận</option>
                      <option value='shipped'>Đang giao</option>
                      <option value='delivered'>Đã giao</option>
                      <option value='cancelled'>Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  onClick={async () => {
                    setUpdatingStatus(true);
                    try {
                      await adminService.updateOrderStatus(
                        selectedOrder.id,
                        selectedStatus
                      );
                      setOrders((prevOrders) =>
                        prevOrders.map((order) =>
                          order.id === selectedOrder.id
                            ? {
                                ...order,
                                status: selectedStatus,
                                order_status: selectedStatus,
                              }
                            : order
                        )
                      );
                      setShowStatusModal(false);
                      alert('Cập nhật trạng thái đơn hàng thành công!');
                    } catch (error) {
                      console.error('Error updating order status:', error);
                      alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
                    } finally {
                      setUpdatingStatus(false);
                    }
                  }}
                  className='w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm'
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className='mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
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

export default AdminOrderManagement;
