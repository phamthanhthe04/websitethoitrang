import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';

const CartPriceUpdater = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    // Check if cart has items with potentially old pricing
    if (cartItems.length > 0) {
      const hasOldPricing = cartItems.some((item) => {
        // Check if this item might have old pricing logic
        // This is a one-time fix for the pricing change
        return localStorage.getItem('cart_price_updated') !== 'true';
      });

      if (hasOldPricing) {
        // Clear cart and notify user
        dispatch(clearCart());
        localStorage.setItem('cart_price_updated', 'true');

        toast.info(
          '🔄 Giỏ hàng đã được cập nhật do thay đổi cách tính giá. Vui lòng thêm lại sản phẩm.',
          {
            position: 'top-center',
            autoClose: 5000,
          }
        );
      }
    }
  }, [cartItems, dispatch]);

  return null; // This component doesn't render anything
};

export default CartPriceUpdater;
