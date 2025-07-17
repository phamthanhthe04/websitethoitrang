import { createSlice } from '@reduxjs/toolkit';

// Lấy cart data từ localStorage nếu có
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    if (serializedCart === null) {
      return {
        items: [],
        totalAmount: 0,
        totalQuantity: 0,
      };
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    return {
      items: [],
      totalAmount: 0,
      totalQuantity: 0,
    };
  }
};

// Hàm lưu cart vào localStorage
const saveCartToStorage = (state) => {
  try {
    const serializedCart = JSON.stringify({
      items: state.items,
      totalAmount: state.totalAmount,
      totalQuantity: state.totalQuantity,
    });
    localStorage.setItem('cart', serializedCart);
  } catch (err) {
    console.error('Could not save cart to localStorage:', err);
  }
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find(
        (item) =>
          item.id === newItem.id &&
          item.color === newItem.color &&
          item.size === newItem.size
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        state.items.push(newItem);
      }

      // Cập nhật totals
      state.totalQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Lưu vào localStorage
      saveCartToStorage(state);
    },

    removeFromCart: (state, action) => {
      const { id, color, size } = action.payload;
      state.items = state.items.filter(
        (item) =>
          !(item.id === id && item.color === color && item.size === size)
      );

      // Cập nhật totals
      state.totalQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Lưu vào localStorage
      saveCartToStorage(state);
    },

    updateQuantity: (state, action) => {
      const { id, color, size, quantity } = action.payload;
      const item = state.items.find(
        (item) => item.id === id && item.color === color && item.size === size
      );

      if (item) {
        item.quantity = quantity;

        // Nếu số lượng = 0, xóa item
        if (quantity === 0) {
          state.items = state.items.filter(
            (item) =>
              !(item.id === id && item.color === color && item.size === size)
          );
        }
      }

      // Cập nhật totals
      state.totalQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Lưu vào localStorage
      saveCartToStorage(state);
    },

    // Recalculate cart prices based on new pricing logic
    recalculateCartPrices: (state, action) => {
      const updatedProducts = action.payload; // Array of products with correct prices

      state.items = state.items.map((item) => {
        const product = updatedProducts.find((p) => p.id === item.id);
        if (product) {
          const correctPrice =
            product.sale_price && product.sale_price > 0
              ? product.price - product.sale_price
              : product.price;
          return {
            ...item,
            price: correctPrice,
          };
        }
        return item;
      });

      // Cập nhật totals với giá mới
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Lưu vào localStorage
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;

      // Lưu vào localStorage
      saveCartToStorage(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  recalculateCartPrices,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart?.items || [];
export const selectCartTotalQuantity = (state) =>
  state.cart?.totalQuantity || 0;
export const selectCartTotalAmount = (state) => state.cart?.totalAmount || 0;

export default cartSlice.reducer;
