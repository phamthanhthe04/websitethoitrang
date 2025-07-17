const { Order, OrderItem, Product } = require('../models');

// Create new order
const createOrder = async (req, res) => {
  try {
    const { shipping_address, payment_method, items, notes } = req.body;

    // Validate required fields
    if (!shipping_address || !shipping_address.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Địa chỉ giao hàng là bắt buộc',
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Phương thức thanh toán là bắt buộc',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Đơn hàng phải có ít nhất một sản phẩm',
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Thông tin sản phẩm không hợp lệ',
        });
      }

      const product = await Product.findByPk(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Sản phẩm với ID ${item.product_id} không tồn tại`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Sản phẩm "${product.name}" không đủ số lượng trong kho`,
        });
      }

      // Calculate actual selling price
      const actualPrice =
        product.sale_price && product.sale_price > 0
          ? product.price - product.sale_price
          : product.price;

      totalAmount += actualPrice * item.quantity;
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      total_amount: totalAmount,
      shipping_address,
      payment_method,
      notes,
    });

    // Create order items
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);

      // Calculate actual selling price
      const actualPrice =
        product.sale_price && product.sale_price > 0
          ? product.price - product.sale_price
          : product.price;

      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: actualPrice,
        size: item.size,
        color: item.color,
      });

      // Update product stock
      await product.update({
        stock: product.stock - item.quantity,
      });
    }

    // Get full order details
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: [
                'id',
                'name',
                'image_url',
                'images',
                'price',
                'sale_price',
              ],
            },
          ],
        },
      ],
      attributes: [
        'id',
        'user_id',
        'total_amount',
        'shipping_address',
        'payment_method',
        'payment_status',
        'order_status',
        'notes',
        'created_at',
        'updated_at',
      ],
    });

    console.log('📦 [ORDER] Created order with timestamps:', {
      id: fullOrder.id,
      created_at: fullOrder.created_at,
      updated_at: fullOrder.updated_at,
    });

    res.status(201).json({
      success: true,
      data: fullOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    console.log('📋 [ORDER] Getting user orders for user:', req.user.id);

    // First get orders with raw query to ensure timestamps work
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      attributes: [
        'id',
        'user_id',
        'total_amount',
        'shipping_address',
        'payment_method',
        'payment_status',
        'order_status',
        'notes',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: [
                'id',
                'name',
                'image_url',
                'images',
                'price',
                'sale_price',
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      raw: false, // Keep as model to get includes
    });

    console.log('📋 [ORDER] Found orders:', orders.length);

    if (orders.length > 0) {
      // Get raw timestamp data for comparison
      const rawOrder = await Order.findByPk(orders[0].id, {
        attributes: ['id', 'created_at', 'updated_at'],
        raw: true,
      });

      console.log('📋 [ORDER] Raw timestamp for first order:', rawOrder);
      console.log('📋 [ORDER] Model timestamp for first order:', {
        id: orders[0].id,
        created_at: orders[0].created_at,
        updated_at: orders[0].updated_at,
        dataValues: orders[0].dataValues,
      });
    }

    // Convert to plain objects and ensure timestamps are properly formatted
    const ordersData = orders.map((order) => {
      const plainOrder = order.toJSON();

      // If timestamps are undefined, fetch them from raw query
      if (!plainOrder.created_at || !plainOrder.updated_at) {
        console.log('⚠️ [ORDER] Missing timestamps in model, using dataValues');
        plainOrder.created_at = order.dataValues.created_at;
        plainOrder.updated_at = order.dataValues.updated_at;
      }

      return plainOrder;
    });

    console.log(
      '📋 [ORDER] Final processed orders data:',
      ordersData.length > 0
        ? {
            first_order_timestamps: {
              id: ordersData[0].id,
              created_at: ordersData[0].created_at,
              updated_at: ordersData[0].updated_at,
            },
          }
        : 'No orders'
    );

    res.json({
      success: true,
      data: ordersData,
    });
  } catch (error) {
    console.error('❌ [ORDER] Error getting user orders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id,
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['name', 'images'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['name', 'images'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { order_status, payment_status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
    }

    await order.update({
      order_status: order_status || order.order_status,
      payment_status: payment_status || order.payment_status,
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Test endpoint to check order timestamps
const testOrderTimestamps = async (req, res) => {
  try {
    console.log('🔍 [TEST] Checking order timestamps...');

    const orders = await Order.findAll({
      limit: 5,
      attributes: ['id', 'created_at', 'updated_at', 'total_amount'],
      order: [['created_at', 'DESC']],
      raw: true,
    });

    console.log('📊 [TEST] Raw orders from DB:', orders);

    // Also test with non-raw query
    const ordersWithModel = await Order.findAll({
      limit: 2,
      attributes: ['id', 'created_at', 'updated_at', 'total_amount'],
      order: [['created_at', 'DESC']],
    });

    console.log(
      '📊 [TEST] Model orders:',
      ordersWithModel.map((o) => o.toJSON())
    );

    res.json({
      success: true,
      message: 'Test endpoint for order timestamps',
      data: {
        totalOrders: orders.length,
        rawOrders: orders,
        modelOrders: ordersWithModel.map((o) => ({
          id: o.id,
          created_at: o.created_at,
          updated_at: o.updated_at,
          created_at_type: typeof o.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('❌ [TEST] Error checking timestamps:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  testOrderTimestamps,
};
