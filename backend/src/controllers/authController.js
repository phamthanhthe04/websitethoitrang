const { User, Wallet, Transaction } = require('../models');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Email đã được sử dụng',
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
    });

    // Automatically create wallet for new user with initial balance
    const initialBalance = 1000000; // 1M VND for new users

    const wallet = await Wallet.create({
      user_id: user.id,
      balance: initialBalance,
      status: 'active',
    });

    // Create initial transaction
    await Transaction.create({
      wallet_id: wallet.id,
      type: 'deposit',
      amount: initialBalance,
      description: 'Tiền thưởng đăng ký tài khoản',
      status: 'completed',
      balance_before: 0,
      balance_after: initialBalance,
      created_by: user.id,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('=== LOGIN API CALLED ===', req.body);

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng',
      });
    }

    const bcrypt = require('bcryptjs');
    // Check password
    console.log('User password in DB:', user.password);
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isPasswordMatch);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản đã bị khóa',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'password', 'phone', 'address'];

    // Filter out invalid updates
    Object.keys(updates).forEach((update) => {
      if (!allowedUpdates.includes(update)) {
        delete updates[update];
      }
    });

    // Update user
    await req.user.update(updates);

    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    // Get user with password field
    const userWithPassword = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'password'],
    });

    if (!userWithPassword) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu hiện tại không đúng',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userWithPassword.update({
      password: hashedNewPassword,
    });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
