import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  selectCartItems,
  selectCartTotalAmount,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../features/cart/cartSlice';
import { getImageUrl } from '../utils/imageUtils';

const CartPage = () => {
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotalAmount);
  const dispatch = useDispatch();

  const handleQuantityChange = (item, newQuantity) => {
    // Prevent negative quantities
    if (newQuantity < 1) return;

    // Check stock limit if available
    if (item.stock && newQuantity > item.stock) {
      alert(`Chỉ còn ${item.stock} sản phẩm trong kho.`);
      newQuantity = item.stock;
    }

    dispatch(
      updateQuantity({
        id: item.id,
        color: item.color,
        size: item.size,
        quantity: newQuantity,
      })
    );
  };

  const handleRemoveItem = (item) => {
    dispatch(
      removeFromCart({
        id: item.id,
        color: item.color,
        size: item.size,
      })
    );
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart());
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto px-4'>
          <div className='text-gray-300 text-8xl mb-6'>
            <i className='fas fa-shopping-cart'></i>
          </div>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>
            Giỏ hàng trống
          </h2>
          <p className='text-gray-600 mb-8'>
            Chưa có sản phẩm nào trong giỏ hàng của bạn
          </p>
          <Link
            to='/'
            className='inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
          >
            <i className='fas fa-shopping-bag mr-2'></i>
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8'>
            Giỏ hàng của bạn
          </h2>

          <div className='space-y-6'>
            {cartItems.map((item) => (
              <div
                key={item.id + item.size + item.color}
                className='flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow'
              >
                <img
                  className='w-20 h-20 object-cover rounded-lg'
                  src={
                    item.image
                      ? item.image.startsWith('http')
                        ? item.image
                        : getImageUrl(item.image)
                      : '/no-image.png'
                  }
                  alt={item.name}
                />

                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {item.name}
                  </h3>
                  <div className='text-sm text-gray-600 mt-1'>
                    {item.size && <span>Size: {item.size}</span>}
                    {item.size && item.color && <span className='mx-2'>|</span>}
                    {item.color && <span>Màu: {item.color}</span>}
                  </div>
                  <div className='text-xl font-bold text-primary-600 mt-2'>
                    {Number(item.price).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='flex items-center border border-gray-300 rounded-lg'>
                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className='px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <i className='fas fa-minus'></i>
                    </button>
                    <span className='px-4 py-2 font-medium min-w-[50px] text-center'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.quantity + 1)
                      }
                      className='px-3 py-2 text-gray-600 hover:text-gray-800'
                    >
                      <i className='fas fa-plus'></i>
                    </button>
                  </div>

                  <button
                    className='px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                    onClick={() => handleRemoveItem(item)}
                  >
                    <i className='fas fa-trash'></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-8 pt-6 border-t border-gray-200'>
            <div className='flex justify-between items-center mb-6'>
              <span className='text-2xl font-bold text-gray-900'>
                Tổng cộng:
              </span>
              <span className='text-3xl font-bold text-primary-600'>
                {Number(total).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className='flex flex-col sm:flex-row gap-4'>
              <button
                className='flex-1 px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors'
                onClick={handleClearCart}
              >
                <i className='fas fa-trash mr-2'></i>
                Xóa toàn bộ giỏ hàng
              </button>
              <Link
                to='/thanh-toan'
                className='flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium'
              >
                <i className='fas fa-credit-card mr-2'></i>
                Thanh toán
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
