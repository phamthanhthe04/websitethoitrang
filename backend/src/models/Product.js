const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sale_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
      defaultValue: 'active',
    },
    tags: {
      type: DataTypes.STRING,
    },
    sizes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    colors: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    sku: {
      type: DataTypes.STRING,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true, // Dòng này rất quan trọng!
  }
);

module.exports = Product;
