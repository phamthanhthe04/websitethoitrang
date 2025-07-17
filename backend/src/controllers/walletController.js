const { Wallet, Transaction, User, Order } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class WalletController {
  // Lấy thông tin ví của user
  async getWallet(req, res) {
    try {
      const userId = req.user.id;

      let wallet = await Wallet.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      // Tự động tạo ví nếu chưa có với số dư ban đầu
      if (!wallet) {
        const initialBalance = 1000000; // 1M VND cho user mới

        wallet = await Wallet.create({
          user_id: userId,
          balance: initialBalance,
          status: 'active',
        });

        // Tạo transaction ban đầu
        await Transaction.create({
          wallet_id: wallet.id,
          type: 'deposit',
          amount: initialBalance,
          description: 'Tiền thưởng đăng ký tài khoản',
          status: 'completed',
          balance_before: 0,
          balance_after: initialBalance,
          created_by: userId,
        });

        // Reload để lấy thông tin user
        wallet = await Wallet.findByPk(wallet.id, {
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email'],
            },
          ],
        });
      }

      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      console.error('Error getting wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin ví',
      });
    }
  }

  // Lấy lịch sử giao dịch
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, type, status } = req.query;
      const offset = (page - 1) * limit;

      console.log('💰 [WALLET] Getting transactions for user:', userId);

      // Tìm ví của user
      const wallet = await Wallet.findOne({
        where: { user_id: userId },
      });

      if (!wallet) {
        console.log('❌ [WALLET] Wallet not found for user:', userId);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ví',
        });
      }

      console.log('💰 [WALLET] Found wallet:', wallet.id);

      // Điều kiện lọc
      const whereConditions = {
        wallet_id: wallet.id,
      };

      if (type) {
        whereConditions.type = type;
      }

      if (status) {
        whereConditions.status = status;
      }

      console.log('💰 [WALLET] Query conditions:', whereConditions);

      // Thử query đơn giản trước để debug
      const simpleTransactions = await Transaction.findAll({
        where: whereConditions,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        raw: true,
      });

      console.log(
        '💰 [WALLET] Simple transactions found:',
        simpleTransactions.length
      );

      // Query với include nhưng handle error riêng
      let transactions = [];
      let count = 0;

      try {
        const result = await Transaction.findAndCountAll({
          where: whereConditions,
          include: [
            {
              model: Order,
              attributes: ['id', 'total_amount', 'order_status'],
              required: false,
            },
          ],
          order: [['created_at', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset),
        });

        transactions = result.rows;
        count = result.count;
        console.log(
          '💰 [WALLET] Transactions with include:',
          transactions.length
        );
      } catch (includeError) {
        console.error('❌ [WALLET] Error with include query:', includeError);
        // Fallback to simple query
        transactions = simpleTransactions;
        count = await Transaction.count({ where: whereConditions });
      }

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('❌ [WALLET] Error getting transactions:', error);
      console.error('❌ [WALLET] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử giao dịch',
        error: error.message,
      });
    }
  }

  // Thanh toán đơn hàng bằng ví
  async payOrder(req, res) {
    const t = await sequelize.transaction();

    try {
      const userId = req.user.id;
      const { orderId } = req.body;

      console.log('💰 [WALLET] PayOrder request:', { userId, orderId });

      // Tìm đơn hàng - kiểm tra tất cả trạng thái trước
      let order = await Order.findOne({
        where: {
          id: orderId,
          user_id: userId,
        },
      });

      console.log(
        '📦 [WALLET] Found order:',
        order
          ? {
              id: order.id,
              status: order.order_status,
              payment_status: order.payment_status,
              total_amount: order.total_amount,
              user_id: order.user_id,
            }
          : 'Not found'
      );

      if (!order) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng',
        });
      }

      // Kiểm tra trạng thái đơn hàng có thể thanh toán
      if (order.payment_status === 'paid') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng này đã được thanh toán',
        });
      }

      if (order.order_status === 'cancelled') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Không thể thanh toán đơn hàng đã hủy',
        });
      }

      // Tìm ví
      const wallet = await Wallet.findOne({
        where: { user_id: userId },
        lock: true,
        transaction: t,
      });

      console.log(
        '💳 [WALLET] Found wallet:',
        wallet
          ? {
              id: wallet.id,
              balance: wallet.balance,
              status: wallet.status,
              user_id: wallet.user_id,
            }
          : 'Not found'
      );

      if (!wallet) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ví',
        });
      }

      // Kiểm tra trạng thái ví
      if (wallet.status !== 'active') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Ví của bạn đang bị tạm khóa',
        });
      }

      // Kiểm tra số dư
      const walletBalance = parseFloat(wallet.balance);
      const orderAmount = parseFloat(order.total_amount);

      console.log('💵 [WALLET] Balance check:', { walletBalance, orderAmount });

      if (walletBalance < orderAmount) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Số dư ví không đủ để thanh toán. Cần: ${orderAmount.toLocaleString(
            'vi-VN'
          )}đ, Có: ${walletBalance.toLocaleString('vi-VN')}đ`,
        });
      }

      const oldBalance = parseFloat(wallet.balance);
      const paymentAmount = parseFloat(order.total_amount);
      const newBalance = oldBalance - paymentAmount;

      console.log('🔄 [WALLET] Processing payment:', {
        oldBalance,
        paymentAmount,
        newBalance,
      });

      // Cập nhật số dư ví
      await wallet.update(
        {
          balance: newBalance,
        },
        { transaction: t }
      );

      // Tạo giao dịch thanh toán
      const transaction = await Transaction.create(
        {
          wallet_id: wallet.id,
          type: 'payment',
          amount: paymentAmount,
          description: `Thanh toán đơn hàng #${order.id}`,
          order_id: order.id,
          status: 'completed',
          balance_before: oldBalance,
          balance_after: newBalance,
          created_by: userId,
        },
        { transaction: t }
      );

      // Cập nhật trạng thái đơn hàng
      await order.update(
        {
          order_status: 'confirmed',
          payment_method: 'wallet',
          payment_status: 'paid',
        },
        { transaction: t }
      );

      await t.commit();

      console.log('✅ [WALLET] Payment successful:', {
        orderId: order.id,
        amount: paymentAmount,
        newBalance: newBalance,
        transactionId: transaction.id,
      });

      res.json({
        success: true,
        message: 'Thanh toán thành công',
        data: {
          orderId: order.id,
          amount: paymentAmount,
          newBalance: newBalance,
          transaction: {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
          },
        },
      });
    } catch (error) {
      await t.rollback();
      console.error('❌ [WALLET] Error paying order:', error);
      console.error('❌ [WALLET] Error stack:', error.stack);
      console.error('❌ [WALLET] Error details:', {
        message: error.message,
        name: error.name,
        sql: error.sql || 'No SQL',
        original: error.original || 'No original error',
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi khi thanh toán đơn hàng: ' + error.message,
      });
    }
  }

  // Admin: Nạp tiền cho user
  async depositMoney(req, res) {
    const t = await sequelize.transaction();

    try {
      const adminId = req.user.id;
      const { userId, amount, description } = req.body;

      if (!userId || !amount || amount <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Thông tin không hợp lệ',
        });
      }

      // Tìm hoặc tạo ví cho user
      let wallet = await Wallet.findOne({
        where: { user_id: userId },
        lock: true,
        transaction: t,
      });

      if (!wallet) {
        wallet = await Wallet.create(
          {
            user_id: userId,
            balance: 0.0,
            status: 'active',
          },
          { transaction: t }
        );
      }

      const oldBalance = parseFloat(wallet.balance);
      const depositAmount = parseFloat(amount);
      const newBalance = oldBalance + depositAmount;

      // Cập nhật số dư
      await wallet.update(
        {
          balance: newBalance,
        },
        { transaction: t }
      );

      // Tạo giao dịch nạp tiền
      await Transaction.create(
        {
          wallet_id: wallet.id,
          type: 'deposit',
          amount: depositAmount,
          description: description || `Admin nạp tiền`,
          status: 'completed',
          balance_before: oldBalance,
          balance_after: newBalance,
          created_by: adminId,
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        success: true,
        message: 'Nạp tiền thành công',
        data: {
          userId,
          amount: depositAmount,
          newBalance: newBalance,
        },
      });
    } catch (error) {
      await t.rollback();
      console.error('Error depositing money:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nạp tiền',
      });
    }
  }

  // Admin: Lấy danh sách ví của tất cả user
  async getAllWallets(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = {};
      let userWhere = {};

      if (search) {
        userWhere = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: wallets } = await Wallet.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role'],
            where: userWhere,
            required: true,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          wallets,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error getting all wallets:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách ví',
      });
    }
  }

  // Admin: Lấy tất cả giao dịch
  async getAllTransactions(req, res) {
    try {
      const { page = 1, limit = 10, type, status, userId } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = {};

      if (type) {
        whereConditions.type = type;
      }

      if (status) {
        whereConditions.status = status;
      }

      let walletWhere = {};
      if (userId) {
        walletWhere.user_id = userId;
      }

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Wallet,
            attributes: ['id', 'user_id'],
            where: walletWhere,
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: Order,
            attributes: ['id', 'total_amount', 'status'],
            required: false,
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error getting all transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách giao dịch',
      });
    }
  }

  // Update wallet status (admin only)
  async updateWalletStatus(req, res) {
    try {
      const { walletId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
        });
      }

      // Find and update wallet
      const wallet = await Wallet.findByPk(walletId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ví',
        });
      }

      await wallet.update({ status });

      res.json({
        success: true,
        message: 'Cập nhật trạng thái ví thành công',
        data: {
          wallet: {
            id: wallet.id,
            user_id: wallet.user_id,
            balance: wallet.balance,
            status: wallet.status,
            User: wallet.User,
          },
        },
      });
    } catch (error) {
      console.error('Error updating wallet status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái ví',
      });
    }
  }

  // Get user transactions (admin only)
  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 10,
        type,
        status,
        sort = 'created_at',
        order = 'DESC',
      } = req.query;

      // Find user's wallet
      const wallet = await Wallet.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ví của người dùng',
        });
      }

      // Build where conditions
      const whereConditions = {
        wallet_id: wallet.id,
      };

      if (type) {
        whereConditions.type = type;
      }

      if (status) {
        whereConditions.status = status;
      }

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereConditions,
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          transactions,
          wallet: {
            id: wallet.id,
            user_id: wallet.user_id,
            balance: wallet.balance,
            status: wallet.status,
            User: wallet.User,
          },
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy giao dịch của người dùng',
      });
    }
  }
}

module.exports = new WalletController();
