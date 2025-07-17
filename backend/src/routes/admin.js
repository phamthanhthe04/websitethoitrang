const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  console.log(
    '👑 [ADMIN] Checking admin role for user:',
    req.user ? `${req.user.name} (${req.user.role})` : 'No user'
  );
  if (req.user.role !== 'admin') {
    console.log('❌ [ADMIN] Access denied - not admin');
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  console.log('✅ [ADMIN] Admin access granted');
  next();
};

// Dashboard
router.get(
  '/dashboard-stats',
  auth,
  requireAdmin,
  adminController.getDashboardStats
);

// Product Management
router.get('/products', auth, requireAdmin, adminController.getAllProducts);
router.get('/products/:id', auth, requireAdmin, adminController.getProduct);
router.post(
  '/products',
  auth,
  requireAdmin,
  adminController.uploadProductImages,
  adminController.createProduct
);
router.put(
  '/products/:id',
  auth,
  requireAdmin,
  adminController.uploadProductImages,
  adminController.updateProduct
);
router.delete(
  '/products/:id',
  auth,
  requireAdmin,
  adminController.deleteProduct
);
router.delete(
  '/products/bulk-delete',
  auth,
  requireAdmin,
  adminController.bulkDeleteProducts
);
router.put(
  '/products/:id/status',
  auth,
  requireAdmin,
  adminController.updateProductStatus
);

// Order Management
router.get('/orders', auth, requireAdmin, adminController.getAllOrders);
router.put(
  '/orders/:id/status',
  auth,
  requireAdmin,
  adminController.updateOrderStatus
);

// User Management
router.get('/users', auth, requireAdmin, adminController.getAllUsers);
router.put(
  '/users/:id/status',
  auth,
  requireAdmin,
  adminController.updateUserStatus
);
router.put(
  '/users/:id/role',
  auth,
  requireAdmin,
  adminController.updateUserRole
);
router.delete('/users/:id', auth, requireAdmin, adminController.deleteUser);

// Category Management
router.get('/categories', auth, requireAdmin, adminController.getAllCategories);
router.post('/categories', auth, requireAdmin, adminController.createCategory);
router.put(
  '/categories/:id',
  auth,
  requireAdmin,
  adminController.updateCategory
);
router.delete(
  '/categories/:id',
  auth,
  requireAdmin,
  adminController.deleteCategory
);

// Test endpoint - không cần auth
router.get('/test-categories', adminController.testGetCategories);

module.exports = router;
