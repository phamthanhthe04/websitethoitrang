const express = require('express');
const router = express.Router();

// Auth routes
router.use('/auth', require('./auth'));

// Product routes
router.use('/products', require('./products'));

// Category routes
router.use('/categories', require('./categories'));

// Order routes
router.use('/orders', require('./orders'));

// Cart routes
router.use('/cart', require('./cart'));

// Wishlist routes
router.use('/wishlist', require('./wishlist'));

// Wallet routes
router.use('/wallet', require('./wallet'));

// Admin routes
router.use('/admin', require('./admin'));

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;
