const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    wallet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Wallets',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('deposit', 'withdraw', 'payment', 'refund'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Orders',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    balance_before: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Transaction;
