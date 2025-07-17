import React, { useState, useEffect } from 'react';
import { getMyWallet, getMyTransactions } from '../../services/walletService';

const WalletInfo = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ type: '', status: '' });

  useEffect(() => {
    fetchWalletInfo();
    fetchTransactions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWalletInfo = async () => {
    try {
      const response = await getMyWallet();
      if (response.success) {
        setWallet(response.data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
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

      const response = await getMyTransactions(params);
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
      pending: 'text-yellow-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      cancelled: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getTypeColor = (type) => {
    const colors = {
      deposit: 'text-green-600',
      withdraw: 'text-orange-600',
      payment: 'text-red-600',
      refund: 'text-blue-600',
    };
    return colors[type] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Wallet Info Card */}
      <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white'>
        <h2 className='text-2xl font-bold mb-4'>Ví Tiền Của Tôi</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-blue-100 mb-1'>Số dư hiện tại</p>
            <p className='text-3xl font-bold'>
              {formatCurrency(wallet?.balance || 0)}
            </p>
          </div>
          <div>
            <p className='text-blue-100 mb-1'>Trạng thái ví</p>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                wallet?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {wallet?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className='bg-white rounded-lg shadow-md'>
        <div className='p-6 border-b border-gray-200'>
          <h3 className='text-xl font-semibold mb-4'>Lịch Sử Giao Dịch</h3>

          {/* Filters */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
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
          </div>
        </div>

        <div className='p-6'>
          {transactionsLoading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              Chưa có giao dịch nào
            </div>
          ) : (
            <div className='space-y-4'>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='border border-gray-200 rounded-lg p-4'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <span
                          className={`font-semibold ${getTypeColor(
                            transaction.type
                          )}`}
                        >
                          {getTransactionTypeText(transaction.type)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {getTransactionStatusText(transaction.status)}
                        </span>
                      </div>
                      <p className='text-gray-600 text-sm mb-1'>
                        {transaction.description}
                      </p>
                      <p className='text-gray-500 text-xs'>
                        {formatDate(transaction.created_at)}
                      </p>
                      {transaction.Order && (
                        <p className='text-blue-600 text-xs mt-1'>
                          Đơn hàng: #{transaction.Order.id.slice(0, 8)}
                        </p>
                      )}
                    </div>
                    <div className='text-right'>
                      <p
                        className={`font-bold text-lg ${
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
                      </p>
                      <p className='text-gray-500 text-sm'>
                        Số dư: {formatCurrency(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center space-x-2 mt-6'>
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
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
