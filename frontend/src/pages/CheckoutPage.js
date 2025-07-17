import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMyWallet, payOrderWithWallet } from '../services/walletService';
import { orderService } from '../services/orderService';
import { clearCart } from '../features/cart/cartSlice';

const CheckoutPage = () => {
  const { items: cartItems } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
  });

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = 30000; // Fixed shipping fee
  const total = subtotal + shippingFee;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/gio-hang');
      return;
    }

    fetchWalletInfo();
  }, [isAuthenticated, cartItems, navigate]);

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

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (
      paymentMethod === 'wallet' &&
      (!wallet || parseFloat(wallet.balance) < total)
    ) {
      alert(
        'Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền hoặc chọn phương thức thanh toán khác.'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create order
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null,
        })),
        shipping_address: `${shippingInfo.name} - ${shippingInfo.phone} - ${
          shippingInfo.address
        }${shippingInfo.note ? ` - Ghi chú: ${shippingInfo.note}` : ''}`,
        payment_method: paymentMethod,
        notes: shippingInfo.note,
      };

      const orderResponse = await orderService.createOrder(orderData);
      console.log('📦 [CHECKOUT] Order creation response:', orderResponse);

      if (orderResponse.success) {
        console.log('💰 [CHECKOUT] Payment method:', paymentMethod);
        // If paying with wallet, process payment
        if (paymentMethod === 'wallet') {
          console.log(
            '🔄 [CHECKOUT] Processing wallet payment for order:',
            orderResponse.data.id
          );
          const paymentResponse = await payOrderWithWallet(
            orderResponse.data.id
          );
          console.log('💳 [CHECKOUT] Payment response:', paymentResponse);

          if (paymentResponse.success) {
            dispatch(clearCart());
            alert('Đặt hàng và thanh toán thành công!');
            navigate('/profile?tab=orders');
          } else {
            alert(paymentResponse.message || 'Có lỗi xảy ra khi thanh toán');
          }
        } else {
          // For other payment methods, just redirect
          dispatch(clearCart());
          alert('Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng.');
          navigate('/profile?tab=orders');
        }
      } else {
        alert(orderResponse.message || 'Có lỗi xảy ra khi đặt hàng');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Có lỗi xảy ra khi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='min-h-screen py-8 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>Thanh toán</h1>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Shipping Information */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold mb-6'>Thông tin giao hàng</h2>

            <form onSubmit={handleSubmitOrder}>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Họ và tên *
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Số điện thoại *
                  </label>
                  <input
                    type='tel'
                    name='phone'
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Địa chỉ giao hàng *
                  </label>
                  <textarea
                    name='address'
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    required
                    rows='3'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    name='note'
                    value={shippingInfo.note}
                    onChange={handleInputChange}
                    rows='2'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Ghi chú đặc biệt cho đơn hàng...'
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-4'>
                  Phương thức thanh toán
                </h3>

                <div className='space-y-3'>
                  {/* Wallet Payment */}
                  <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                    <input
                      type='radio'
                      id='wallet'
                      name='paymentMethod'
                      value='wallet'
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className='text-blue-600'
                    />
                    <label htmlFor='wallet' className='flex-1 cursor-pointer'>
                      <div className='flex justify-between items-center'>
                        <div className='flex items-center space-x-2'>
                          <i className='fas fa-wallet text-blue-600'></i>
                          <span className='font-medium'>
                            Thanh toán bằng ví
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm text-gray-600'>Số dư:</div>
                          <div
                            className={`font-semibold ${
                              wallet && parseFloat(wallet.balance) >= total
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(wallet?.balance || 0)}
                          </div>
                        </div>
                      </div>
                      {wallet && parseFloat(wallet.balance) < total && (
                        <div className='text-sm text-red-600 mt-1'>
                          Số dư không đủ. Thiếu{' '}
                          {formatCurrency(total - parseFloat(wallet.balance))}
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Cash on Delivery */}
                  <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                    <input
                      type='radio'
                      id='cod'
                      name='paymentMethod'
                      value='cod'
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className='text-blue-600'
                    />
                    <label
                      htmlFor='cod'
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <i className='fas fa-hand-holding-usd text-green-600'></i>
                      <span className='font-medium'>
                        Thanh toán khi nhận hàng
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type='submit'
                disabled={
                  submitting ||
                  (paymentMethod === 'wallet' &&
                    (!wallet || parseFloat(wallet.balance) < total))
                }
                className='w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium'
              >
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold mb-6'>Đơn hàng của bạn</h2>

            <div className='space-y-4'>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className='flex justify-between items-center py-3 border-b'
                >
                  <div className='flex items-center space-x-3'>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className='w-16 h-16 object-cover rounded'
                    />
                    <div>
                      <h3 className='font-medium'>{item.name}</h3>
                      <p className='text-sm text-gray-600'>
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-6 space-y-2'>
              <div className='flex justify-between'>
                <span>Tạm tính:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className='flex justify-between'>
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
              <hr className='my-2' />
              <div className='flex justify-between text-lg font-semibold'>
                <span>Tổng cộng:</span>
                <span className='text-blue-600'>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
