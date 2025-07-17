const { Category, Product } = require('../models');
const sequelize = require('../config/database');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          attributes: ['id'],
        },
      ],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single category
const getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'sale_price', 'images'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    // Check if a category with the same name exists under the same parent
    const existingCategory = await Category.findOne({
      where: {
        name,
        parent_id: parent_id || null, // Handle both null and undefined
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Đã tồn tại danh mục với tên này trong cùng danh mục cha',
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục',
      });
    }

    // If changing name or parent, check for duplicates
    if (
      (req.body.name && req.body.name !== category.name) ||
      (req.body.parent_id !== undefined &&
        req.body.parent_id !== category.parent_id)
    ) {
      const existingCategory = await Category.findOne({
        where: {
          name: req.body.name || category.name,
          parent_id:
            req.body.parent_id !== undefined
              ? req.body.parent_id
              : category.parent_id,
          id: { [sequelize.Op.ne]: category.id }, // Exclude current category
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Đã tồn tại danh mục với tên này trong cùng danh mục cha',
        });
      }
    }

    await category.update(req.body);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục',
      });
    }

    await category.destroy();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get category by slug
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'sale_price', 'images'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get products by category slug
const getProductsByCategorySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục',
      });
    }

    const products = await Product.findAll({
      where: {
        category_id: category.id,
        status: 'active',
      },
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get categories with parent-child structure
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.findAll();

    // Build tree structure
    const categoryMap = {};
    categories.forEach((category) => {
      categoryMap[category.id] = { ...category.dataValues, children: [] };
    });

    const categoryTree = [];
    categories.forEach((category) => {
      if (category.parent_id) {
        categoryMap[category.parent_id].children.push(categoryMap[category.id]);
      } else {
        categoryTree.push(categoryMap[category.id]);
      }
    });

    res.json({
      success: true,
      data: categoryTree,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategories,
  getCategory,
  getCategoryBySlug,
  getProductsByCategorySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
};
