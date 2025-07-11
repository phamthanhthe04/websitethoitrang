const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

// User routes
router.post('/', auth, createOrder);
router.get('/my-orders', auth, getUserOrders);
router.get('/my-orders/:id', auth, getOrder);

// Admin routes
router.get('/', auth, isAdmin, getAllOrders);
router.put('/:id/status', auth, isAdmin, updateOrderStatus);

module.exports = router;
