const { Product, User, Order, OrderItem, Category } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình Multer để tải lên hình ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/images/products');
    // Đảm bảo thư mục tải lên tồn tại
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Kiểm tra loại tệp
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
});

// Hàm hỗ trợ xóa tệp hình ảnh một cách an toàn
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;

  try {
    const fullPath = path.join(__dirname, '../../public', imagePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Lỗi khi xóa tệp hình ảnh:', imagePath, err);
      } else if (!err) {
        console.log('✅ [FILE] Đã xóa thành công:', imagePath);
      }
    });
  } catch (error) {
    console.log('[ERROR] Chi tiết lỗi:', error.stack);
    console.error('Lỗi khi xử lý xóa hình ảnh:', imagePath, error);
  }
};

// Hàm hỗ trợ xóa nhiều tệp hình ảnh
const deleteImageFiles = (imagePaths) => {
  if (!imagePaths || !Array.isArray(imagePaths)) return;

  imagePaths.forEach((imagePath) => {
    deleteImageFile(imagePath);
  });
};

// Xuất middleware upload để sử dụng trong routes
exports.uploadProductImages = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 },
]);

// Thống kê Dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      Product.count(),
      Order.count(),
      User.count(),
      Order.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                attributes: ['name', 'image_url'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
      }),
      Product.findAll({
        where: {
          stock: {
            [Op.lte]: 5,
          },
        },
        order: [['stock', 'ASC']],
        limit: 10,
      }),
    ]);

    // Tính tổng doanh thu
    const totalRevenue =
      (await Order.sum('total_amount', {
        where: {
          order_status: 'delivered',
        },
      })) || 0;

    const stats = {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customer: order.User?.name || 'Unknown',
        total: order.total_amount,
        status: order.order_status,
        created_at: order.created_at,
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
      })),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Quản lý Sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category && category !== 'all') {
      whereClause.category_id = category;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const allowedSortFields = [
      'name',
      'price',
      'stock',
      'created_at',
      'updated_at',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'DESC';

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order: [[validSortBy, validSortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug'],
        },
      ],
      attributes: [
        'id',
        'name',
        'description',
        'category_id',
        'price',
        'sale_price',
        'stock',
        'image_url',
        'images',
        'status',
        'tags',
        'sizes',
        'colors',
        'sku',
        'slug',
        'created_at',
        'updated_at',
      ],
    });

    const totalPages = Math.ceil(count / limit);

    const result = {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      price,
      sale_price,
      stock,
      status,
      tags,
      sizes,
      colors,
      sku,
      slug,
    } = req.body;

    if (!name || !category_id || !price || !stock) {
      return res.status(400).json({
        message:
          'Vui lòng điền đầy đủ thông tin bắt buộc (tên, danh mục, giá, tồn kho)',
      });
    }

    let image_url = null;
    let images = [];

    if (req.files) {
      if (req.files.mainImage && req.files.mainImage[0]) {
        image_url = `/images/products/${req.files.mainImage[0].filename}`;
      }
      if (req.files.additionalImages) {
        images = req.files.additionalImages.map(
          (file) => `/images/products/${file.filename}`
        );
      }
    }

    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const product = await Product.create({
      name,
      description,
      category_id,
      price: parseFloat(price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock: parseInt(stock),
      image_url,
      images: images,
      status: status || 'active',
      tags: tags || '',
      sizes: sizes ? sizes.split(',').map((size) => size.trim()) : [],
      colors: colors ? colors.split(',').map((color) => color.trim()) : [],
      sku: sku || `SKU-${Date.now()}`,
      slug: productSlug,
    });

    console.log('✅ [ADMIN] Đã tạo sản phẩm thành công:', product.id);
    res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      product,
    });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi tạo sản phẩm:', error);

    if (req.files) {
      const filesToDelete = [];
      if (req.files.mainImage) {
        filesToDelete.push(...req.files.mainImage);
      }
      if (req.files.additionalImages) {
        filesToDelete.push(...req.files.additionalImages);
      }

      filesToDelete.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Lỗi khi xóa tệp đã tải lên:', file.filename, err);
          } else if (!err) {
            console.log('✅ [CLEANUP] Đã xóa tệp đã tải lên:', file.filename);
          }
        });
      });
    }

    res.status(500).json({
      message: 'Lỗi tạo sản phẩm',
      error: error.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug'],
        },
      ],
      attributes: [
        'id',
        'name',
        'description',
        'category_id',
        'price',
        'sale_price',
        'stock',
        'image_url',
        'images',
        'status',
        'tags',
        'sizes',
        'colors',
        'sku',
        'slug',
        'created_at',
        'updated_at',
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json(product);
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi lấy sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category_id,
      price,
      sale_price,
      stock,
      status,
      tags,
      sizes,
      colors,
      sku,
      slug,
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    let updateData = {
      name: name || product.name,
      description: description || product.description,
      category_id: category_id || product.category_id,
      price: price ? parseFloat(price) : product.price,
      sale_price: sale_price ? parseFloat(sale_price) : product.sale_price,
      stock: stock ? parseInt(stock) : product.stock,
      status: status || product.status,
      tags: tags || product.tags,
      sizes: sizes
        ? sizes.split(',').map((size) => size.trim())
        : product.sizes,
      colors: colors
        ? colors.split(',').map((color) => color.trim())
        : product.colors,
      sku: sku || product.sku,
      slug: slug || product.slug,
    };

    if (req.files) {
      // Cập nhật ảnh chính
      if (req.files.mainImage && req.files.mainImage[0]) {
        if (product.image_url) {
          deleteImageFile(product.image_url);
        }
        updateData.image_url = `/images/products/${req.files.mainImage[0].filename}`;
      }

      // Cập nhật ảnh phụ
      if (req.files.additionalImages) {
        let newAdditionalImages = req.files.additionalImages.map(
          (file) => `/images/products/${file.filename}`
        );

        if (req.body.keepOldAdditionalImages) {
          const keepFlags = JSON.parse(
            req.body.keepOldAdditionalImages || '[]'
          );
          const oldImages = product.images || [];

          const keptOldImages = oldImages.filter(
            (img, index) => keepFlags[index]
          );
          const deletedOldImages = oldImages.filter(
            (img, index) => !keepFlags[index]
          );

          if (deletedOldImages.length > 0) {
            deleteImageFiles(deletedOldImages);
          }

          updateData.images = [...keptOldImages, ...newAdditionalImages];
        } else {
          if (product.images && product.images.length > 0) {
            deleteImageFiles(product.images);
          }
          updateData.images = newAdditionalImages;
        }
      }
    }

    await product.update(updateData);

    console.log('✅ [ADMIN] Đã cập nhật sản phẩm thành công:', product.id);
    res.json({
      message: 'Cập nhật sản phẩm thành công',
      product,
    });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi cập nhật sản phẩm:', error);

    if (req.files) {
      const filesToDelete = [];
      if (req.files.mainImage) {
        filesToDelete.push(...req.files.mainImage);
      }
      if (req.files.additionalImages) {
        filesToDelete.push(...req.files.additionalImages);
      }
      filesToDelete.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Lỗi khi xóa tệp đã tải lên:', file.filename, err);
          } else if (!err) {
            console.log('✅ [CLEANUP] Đã xóa tệp đã tải lên:', file.filename);
          }
        });
      });
    }

    res.status(500).json({
      message: 'Lỗi cập nhật sản phẩm',
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    if (product.image_url) {
      deleteImageFile(product.image_url);
    }
    if (product.images && product.images.length > 0) {
      deleteImageFiles(product.images);
    }

    await product.destroy();

    console.log('✅ [ADMIN] Đã xóa sản phẩm thành công:', id);
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'Danh sách ID sản phẩm không hợp lệ' });
    }

    const products = await Product.findAll({
      where: { id: productIds },
    });

    products.forEach((product) => {
      if (product.image_url) {
        deleteImageFile(product.image_url);
      }
      if (product.images && product.images.length > 0) {
        deleteImageFiles(product.images);
      }
    });

    const deletedCount = await Product.destroy({
      where: { id: productIds },
    });

    console.log(`✅ [ADMIN] Đã xóa hàng loạt ${deletedCount} sản phẩm`);
    res.json({
      message: `Xóa thành công ${deletedCount} sản phẩm`,
      deletedCount,
    });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi xóa hàng loạt sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    await product.update({ status });
    console.log(
      `✅ [ADMIN] Đã cập nhật trạng thái sản phẩm: ${id} -> ${status}`
    );
    res.json({ message: 'Cập nhật trạng thái sản phẩm thành công' });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi cập nhật trạng thái sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Quản lý Đơn hàng
exports.getAllOrders = async (req, res) => {
  console.log('[DEBUG] Đang gọi API lấy đơn hàng...');
  try {
    const orders = await Order.findAll({
      attributes: [
        'id',
        'user_id',
        'total_amount',
        'order_status',
        'payment_status',
        'shipping_address',
        'payment_method',
        'notes',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['name', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer_name: order.User?.name || 'Unknown',
      customer_email: order.User?.email || '',
      total_amount: order.total_amount,
      order_status: order.order_status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipping_address: order.shipping_address,
      payment_method: order.payment_method,
      notes: order.notes,
      items:
        order.OrderItems?.map((item) => ({
          product_name: item.Product?.name || 'Unknown',
          product_image: item.Product?.image_url,
          quantity: item.quantity,
          price: item.price,
        })) || [],
    }));

    console.log('[DEBUG] Total orders found:', orders.length);
    console.log('[DEBUG] First order raw created_at:', orders[0]?.created_at);
    console.log('[DEBUG] First order raw dataValues:', orders[0]?.dataValues);
    console.log(
      '[DEBUG] First formatted order created_at:',
      formattedOrders[0]?.created_at
    );

    res.json(formattedOrders);
  } catch (error) {
    console.error('❌ [ORDERS] Lỗi khi lấy đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    await order.update({ order_status: status });
    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Quản lý Người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      raw: true,
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'created_at',
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('❌ [USERS] Lỗi khi lấy người dùng:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    await user.update({ status });
    res.json({ message: 'Cập nhật trạng thái người dùng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Quyền không hợp lệ' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    await user.update({ role });
    res.json({ message: 'Cập nhật quyền người dùng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật quyền người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }

    await user.destroy();
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Test endpoint - không cần auth
exports.testGetCategories = async (req, res) => {
  try {
    console.log('🔍 [TEST] Getting categories for debugging...');

    const categories = await Category.findAll({
      attributes: [
        'id',
        'name',
        'slug',
        'description',
        'parent_id',
        'created_at',
      ],
      order: [['name', 'ASC']],
    });

    console.log('📊 [TEST] Found categories:', categories.length);

    const result = {
      total: categories.length,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent_id: cat.parent_id,
        created_at: cat.created_at,
      })),
    };

    console.log(
      '📋 [TEST] Sample data:',
      JSON.stringify(result.categories.slice(0, 3), null, 2)
    );

    res.json(result);
  } catch (error) {
    console.error('❌ [TEST] Lỗi khi lấy categories:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Quản lý Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: [
        'id',
        'name',
        'slug',
        'description',
        'parent_id',
        'created_at',
      ],
      order: [['name', 'ASC']],
    });

    // Tính toán level cho mỗi category ngay trong backend
    const calculateLevel = (category, allCategories) => {
      if (!category.parent_id) return 1;

      let level = 1;
      let currentId = category.parent_id;
      let maxIterations = 10;

      while (currentId && maxIterations > 0) {
        const parent = allCategories.find((c) => c.id === currentId);
        if (!parent) break;

        level++;
        currentId = parent.parent_id;
        maxIterations--;
      }

      return level;
    };

    // Thêm level và thông tin parent vào response
    const categoriesWithLevel = categories.map((category) => {
      const categoryData = category.toJSON();
      const level = calculateLevel(
        categoryData,
        categories.map((c) => c.toJSON())
      );

      // Tìm parent name
      const parentCategory = categoryData.parent_id
        ? categories.find((c) => c.id === categoryData.parent_id)
        : null;

      return {
        ...categoryData,
        level,
        parent_name: parentCategory ? parentCategory.name : null,
      };
    });

    console.log(
      '✅ [BACKEND] Categories with levels calculated:',
      categoriesWithLevel.length
    );
    console.log('📊 [BACKEND] Level distribution:', {
      level1: categoriesWithLevel.filter((c) => c.level === 1).length,
      level2: categoriesWithLevel.filter((c) => c.level === 2).length,
      level3: categoriesWithLevel.filter((c) => c.level === 3).length,
    });

    res.json(categoriesWithLevel);
  } catch (error) {
    console.error('❌ [CATEGORIES] Lỗi khi lấy categories:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Tên danh mục là bắt buộc',
      });
    }

    // Tạo slug cơ bản
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Nếu có parent, thêm prefix từ parent để tránh trùng slug
    let slug = baseSlug;
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (parentCategory) {
        slug = `${parentCategory.slug}-${baseSlug}`;
      }
    }

    // Kiểm tra slug đã tồn tại chưa, nếu có thì thêm số
    let finalSlug = slug;
    let counter = 1;
    while (await Category.findOne({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await Category.create({
      name,
      slug: finalSlug,
      description,
      parent_id: parent_id || null,
    });

    console.log('✅ [ADMIN] Đã tạo category thành công:', category.id);
    res.status(201).json({
      message: 'Tạo danh mục thành công',
      category,
    });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi tạo category:', error);
    res.status(500).json({
      message: 'Lỗi tạo danh mục',
      error: error.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Tên danh mục là bắt buộc',
      });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Check for circular reference
    if (parent_id && parent_id === id) {
      return res.status(400).json({
        message: 'Danh mục không thể là parent của chính nó',
      });
    }

    // Tạo slug cơ bản
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Nếu có parent, thêm prefix từ parent để tránh trùng slug
    let slug = baseSlug;
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (parentCategory) {
        slug = `${parentCategory.slug}-${baseSlug}`;
      }
    }

    // Kiểm tra slug đã tồn tại chưa (trừ category hiện tại), nếu có thì thêm số
    let finalSlug = slug;
    let counter = 1;
    while (
      await Category.findOne({
        where: {
          slug: finalSlug,
          id: { [Op.ne]: id }, // Không tính category hiện tại
        },
      })
    ) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    await category.update({
      name,
      slug: finalSlug,
      description,
      parent_id: parent_id || null,
    });

    console.log('✅ [ADMIN] Đã cập nhật category thành công:', category.id);
    res.json({
      message: 'Cập nhật danh mục thành công',
      category,
    });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi cập nhật category:', error);
    res.status(500).json({
      message: 'Lỗi cập nhật danh mục',
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Check if category has children
    const childCategories = await Category.count({
      where: { parent_id: id },
    });

    if (childCategories > 0) {
      return res.status(400).json({
        message:
          'Không thể xóa danh mục có danh mục con. Vui lòng xóa danh mục con trước.',
      });
    }

    // Check if category has products
    const productCount = await Product.count({
      where: { category_id: id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa danh mục có ${productCount} sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước.`,
      });
    }

    await category.destroy();

    console.log('✅ [ADMIN] Đã xóa category thành công:', id);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('❌ [ADMIN] Lỗi khi xóa category:', error);
    res.status(500).json({
      message: 'Lỗi xóa danh mục',
      error: error.message,
    });
  }
};
