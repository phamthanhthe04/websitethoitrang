const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import models
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const CartItem = require('./CartItem');
const WishlistItem = require('./WishlistItem');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');

// === Define relationships ===

// Categories ↔ Products
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Users ↔ Orders
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// Orders ↔ OrderItems
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// OrderItems ↔ Products
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(OrderItem, { foreignKey: 'product_id' }); // <- thêm dòng này

// Users ↔ CartItems
User.hasMany(CartItem, { foreignKey: 'user_id' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// Users ↔ WishlistItems
User.hasMany(WishlistItem, { foreignKey: 'user_id' });
WishlistItem.belongsTo(User, { foreignKey: 'user_id' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id' });

// Users ↔ Wallets
User.hasOne(Wallet, { foreignKey: 'user_id' });
Wallet.belongsTo(User, { foreignKey: 'user_id' });

// Wallets ↔ Transactions
Wallet.hasMany(Transaction, { foreignKey: 'wallet_id' });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

// Orders ↔ Transactions
Order.hasMany(Transaction, { foreignKey: 'order_id' });
Transaction.belongsTo(Order, { foreignKey: 'order_id' });

// Users ↔ Transactions (created_by)
User.hasMany(Transaction, { foreignKey: 'created_by' });
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });

module.exports = {
  sequelize,
  User,
  Product,
  Category,
  Order,
  OrderItem,
  CartItem,
  WishlistItem,
  Wallet,
  Transaction,
};
