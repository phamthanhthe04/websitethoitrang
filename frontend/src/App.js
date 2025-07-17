import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './app/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import './styles/ProductCard.css';
import './pages/CategoryPages.css';

// Components
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
// Public pages
import TrangChu from './pages/TrangChu';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MenPage from './pages/MenPage';
import WomenPage from './pages/WomenPage';
import KidsPage from './pages/KidsPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import PromotionPage from './pages/PromotionPage';
import WalletPage from './pages/WalletPage';

// Admin pages
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProductManagement from './pages/Admin/AdminProductManagement';
import AdminOrderManagement from './pages/Admin/AdminOrderManagement';
import AdminUserManagement from './pages/Admin/AdminUserManagement';
import AdminCategoryManagement from './pages/Admin/AdminCategoryManagement';
import AdminWalletManagement from './pages/Admin/AdminWalletManagement';

// Auth utils
import { getAuthData } from './utils/auth';
import { setAuthData } from './features/auth/authSlice';
import { fetchWishlist } from './features/wishlist/wishlistSlice';
import ProtectedRoute from './components/ProtectedRoute';
import CartPriceUpdater from './components/Cart/CartPriceUpdater';

// Wrapper for authentication state
function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const { token, user } = getAuthData();
    if (token && user) {
      dispatch(setAuthData({ token, user }));
      dispatch(fetchWishlist());
    }
  }, [dispatch]);

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthInitializer>
          <CartPriceUpdater />
          <Routes>
            {/* Admin Routes */}
            <Route
              path='/admin'
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path='products' element={<AdminProductManagement />} />
              <Route path='orders' element={<AdminOrderManagement />} />
              <Route path='users' element={<AdminUserManagement />} />
              <Route path='categories' element={<AdminCategoryManagement />} />
              <Route path='wallets' element={<AdminWalletManagement />} />
              <Route path='reports' element={<div>Báo cáo & Thống kê</div>} />
              <Route path='settings' element={<div>Cài đặt</div>} />
            </Route>

            {/* Public Routes */}
            <Route
              path='/*'
              element={
                <>
                  <Header />
                  <main className='min-h-screen bg-gray-50'>
                    <Routes>
                      <Route path='/' element={<TrangChu />} />
                      <Route
                        path='/san-pham/:slug'
                        element={<ProductDetailPage />}
                      />
                      <Route path='/gio-hang' element={<CartPage />} />
                      <Route
                        path='/thanh-toan'
                        element={
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path='/dang-nhap' element={<LoginPage />} />
                      <Route path='/dang-ky' element={<RegisterPage />} />
                      <Route path='/nam' element={<MenPage />} />
                      <Route path='/nu' element={<WomenPage />} />
                      <Route path='/tre-em' element={<KidsPage />} />
                      <Route path='/khuyen-mai' element={<PromotionPage />} />
                      <Route
                        path='/wishlist'
                        element={
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/profile'
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/wallet'
                        element={
                          <ProtectedRoute>
                            <WalletPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='*'
                        element={<div>404 - Không tìm thấy trang</div>}
                      />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />
          </Routes>

          <ToastContainer
            position='top-right'
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme='light'
          />
        </AuthInitializer>
      </Router>
    </Provider>
  );
}

export default App;
