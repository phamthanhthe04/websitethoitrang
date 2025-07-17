import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as walletService from '../../services/walletService';

const AdminWalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallets');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: '', status: '', userId: '' });

  // Deposit Money Modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositing, setDepositing] = useState(false);

  // User Transactions Modal
  const [showUserTransactionsModal, setShowUserTransactionsModal] =
    useState(false);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userTransactionsLoading, setUserTransactionsLoading] = useState(false);

  // Confirm Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Status update loading
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});

  useEffect(() => {
    if (activeTab === 'wallets') {
      fetchWallets();
    } else {
      fetchTransactions();
    }
  }, [activeTab, currentPage, searchTerm, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };

      const response = await walletService.getAllWallets(params);
      if (response.success) {
        setWallets(response.data.wallets);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filter,
      };

      const response = await walletService.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !depositAmount || depositAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setDepositing(true);
      const response = await walletService.depositMoney(
        selectedWallet.user_id,
        parseFloat(depositAmount),
        depositDescription
      );

      if (response.success) {
        alert('Nạp tiền thành công!');
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositDescription('');
        setSelectedWallet(null);
        fetchWallets();
      } else {
        alert(response.message || 'Có lỗi xảy ra khi nạp tiền');
      }
    } catch (error) {
      console.error('Error depositing money:', error);
      alert('Có lỗi xảy ra khi nạp tiền');
    } finally {
      setDepositing(false);
    }
  };

  const handleStatusUpdate = async (wallet, newStatus) => {
    const actionText = newStatus === 'active' ? 'mở khóa' : 'khóa';

    setConfirmAction({
      title: `Xác nhận ${actionText} ví`,
      message: `Bạn có chắc chắn muốn ${actionText} ví của ${wallet.User?.name}?`,
      confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      onConfirm: () => performStatusUpdate(wallet, newStatus),
    });
    setShowConfirmModal(true);
  };

  const performStatusUpdate = async (wallet, newStatus) => {
    try {
      setStatusUpdateLoading((prev) => ({ ...prev, [wallet.id]: true }));

      await walletService.updateWalletStatus(wallet.id, newStatus);

      // Refresh wallets list
      await fetchWallets();

      toast.success(`Cập nhật trạng thái ví thành công`);
    } catch (error) {
      console.error('Error updating wallet status:', error);
      toast.error(
        error.response?.data?.message || 'Lỗi khi cập nhật trạng thái ví'
      );
    } finally {
      setStatusUpdateLoading((prev) => ({ ...prev, [wallet.id]: false }));
      setShowConfirmModal(false);
    }
  };

  const handleViewUserTransactions = async (wallet) => {
    try {
      setUserTransactionsLoading(true);
      setSelectedWallet(wallet);
      setShowUserTransactionsModal(true);

      const response = await walletService.getUserTransactions(wallet.user_id, {
        page: 1,
        limit: 50,
      });

      if (response.success) {
        setUserTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      toast.error('Lỗi khi tải giao dịch của người dùng');
    } finally {
      setUserTransactionsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransactionTypeText = (type) => {
    const types = {
      deposit: 'Nạp tiền',
      withdraw: 'Rút tiền',
      payment: 'Thanh toán',
      refund: 'Hoàn tiền',
    };
    return types[type] || type;
  };

  const getTransactionStatusText = (status) => {
    const statuses = {
      pending: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      cancelled: 'Đã hủy',
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      deposit: 'bg-green-100 text-green-800',
      withdraw: 'bg-orange-100 text-orange-800',
      payment: 'bg-red-100 text-red-800',
      refund: 'bg-blue-100 text-blue-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold text-gray-900'>Quản Lý Ví Tiền</h2>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danh Sách Ví
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lịch Sử Giao Dịch
          </button>
        </nav>
      </div>

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div className='space-y-4'>
          {/* Search */}
          <div className='flex justify-between items-center'>
            <div className='flex-1 max-w-md'>
              <input
                type='text'
                placeholder='Tìm kiếm theo tên, email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          {/* Wallets List */}
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            {loading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Người dùng
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Số dư
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Ngày tạo
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {wallets.map((wallet) => (
                      <tr key={wallet.id}>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {wallet.User?.name || 'N/A'}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {wallet.User?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {formatCurrency(wallet.balance)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              wallet.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {wallet.status === 'active'
                              ? 'Hoạt động'
                              : 'Không hoạt động'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(wallet.created_at)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setShowDepositModal(true);
                              }}
                              className='text-blue-600 hover:text-blue-900'
                            >
                              Nạp tiền
                            </button>
                            <button
                              onClick={() => handleViewUserTransactions(wallet)}
                              className='text-green-600 hover:text-green-900'
                            >
                              Lịch sử
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  wallet,
                                  wallet.status === 'active'
                                    ? 'inactive'
                                    : 'active'
                                )
                              }
                              disabled={statusUpdateLoading[wallet.id]}
                              className={`${
                                wallet.status === 'active'
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-orange-600 hover:text-orange-900'
                              } ${
                                statusUpdateLoading[wallet.id]
                                  ? 'opacity-50'
                                  : ''
                              }`}
                            >
                              {statusUpdateLoading[wallet.id]
                                ? 'Đang xử lý...'
                                : wallet.status === 'active'
                                ? 'Khóa'
                                : 'Mở khóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className='space-y-4'>
          {/* Filters */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Loại giao dịch
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Tất cả</option>
                <option value='deposit'>Nạp tiền</option>
                <option value='withdraw'>Rút tiền</option>
                <option value='payment'>Thanh toán</option>
                <option value='refund'>Hoàn tiền</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Trạng thái
              </label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Tất cả</option>
                <option value='pending'>Đang xử lý</option>
                <option value='completed'>Hoàn thành</option>
                <option value='failed'>Thất bại</option>
                <option value='cancelled'>Đã hủy</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                User ID
              </label>
              <input
                type='text'
                placeholder='Nhập User ID...'
                value={filter.userId}
                onChange={(e) =>
                  setFilter({ ...filter, userId: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            {transactionsLoading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Người dùng
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Loại
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Số tiền
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Mô tả
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {transaction.Wallet?.User?.username || 'N/A'}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {transaction.Wallet?.User?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                              transaction.type
                            )}`}
                          >
                            {getTransactionTypeText(transaction.type)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getTransactionStatusText(transaction.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            {transaction.description}
                          </div>
                          {transaction.Order && (
                            <div className='text-sm text-blue-600'>
                              Đơn hàng: #{transaction.Order.id.slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center space-x-2'>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className='px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Trước
          </button>
          <span className='px-3 py-1 text-gray-600'>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className='px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Sau
          </button>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Nạp tiền vào ví</h3>
            <form onSubmit={handleDeposit}>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Người dùng
                </label>
                <p className='text-sm text-gray-900'>
                  {selectedWallet?.User?.name} ({selectedWallet?.User?.email})
                </p>
              </div>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Số tiền (VND)
                </label>
                <input
                  type='number'
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Nhập số tiền'
                  min='1'
                  required
                />
              </div>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Mô tả
                </label>
                <textarea
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Mô tả giao dịch'
                  rows='3'
                />
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowDepositModal(false);
                    setSelectedWallet(null);
                    setDepositAmount('');
                    setDepositDescription('');
                  }}
                  className='px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={depositing}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  {depositing ? 'Đang nạp...' : 'Nạp tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Transactions Modal */}
      {showUserTransactionsModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>
                Lịch sử giao dịch - {selectedWallet?.User?.name}
              </h3>
              <button
                onClick={() => {
                  setShowUserTransactionsModal(false);
                  setUserTransactions([]);
                }}
                className='text-gray-500 hover:text-gray-700'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            {userTransactionsLoading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Loại
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Số tiền
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Mô tả
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Ngày tạo
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Số dư sau GD
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {userTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                              transaction.type
                            )}`}
                          >
                            {getTransactionTypeText(transaction.type)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div
                            className={`text-sm font-medium ${
                              transaction.type === 'deposit' ||
                              transaction.type === 'refund'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'deposit' ||
                            transaction.type === 'refund'
                              ? '+'
                              : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900 max-w-xs truncate'>
                            {transaction.description}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getTransactionStatusText(transaction.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {formatCurrency(transaction.balance_after || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {userTransactions.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    Không có giao dịch nào
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>
              {confirmAction.title}
            </h3>
            <p className='text-gray-600 mb-6'>{confirmAction.message}</p>

            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowConfirmModal(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Hủy
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                {confirmAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletManagement;
