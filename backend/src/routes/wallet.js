const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { auth, isAdmin } = require('../middleware/auth');

// Routes cho user
router.get('/my-wallet', auth, walletController.getWallet);
router.get('/my-transactions', auth, walletController.getTransactions);
router.post('/pay-order', auth, walletController.payOrder);

// Routes cho admin
router.get('/admin/wallets', auth, isAdmin, walletController.getAllWallets);
router.get(
  '/admin/transactions',
  auth,
  isAdmin,
  walletController.getAllTransactions
);
router.post('/admin/deposit', auth, isAdmin, walletController.depositMoney);
router.put(
  '/admin/wallets/:walletId/status',
  auth,
  isAdmin,
  walletController.updateWalletStatus
);
router.get(
  '/admin/users/:userId/transactions',
  auth,
  isAdmin,
  walletController.getUserTransactions
);

module.exports = router;
