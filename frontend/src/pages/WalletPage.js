import React from 'react';
import WalletInfo from '../components/Wallet/WalletInfo';

const WalletPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Quản Lý Ví Tiền
          </h1>
          <p className='text-gray-600'>
            Xem số dư ví và lịch sử giao dịch của bạn
          </p>
        </div>

        <WalletInfo />
      </div>
    </div>
  );
};

export default WalletPage;
