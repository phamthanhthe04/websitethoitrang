const { User, Product, Category, Order, OrderItem } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    // Xóa dữ liệu cũ
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Tạo categories
    const categories = await Category.bulkCreate([
      { name: 'Áo', slug: 'ao', description: 'Các loại áo' },
      { name: 'Quần', slug: 'quan', description: 'Các loại quần' },
      { name: 'Giày', slug: 'giay', description: 'Các loại giày' },
    ]);

    // Tạo users
    const users = await User.bulkCreate([
      {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'user',
      },
      {
        name: 'Trần Thị B',
        email: 'tranthib@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'user',
      },
      {
        name: 'Admin',
        email: 'admin@gmail.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
      },
    ]);

    // Tạo products
    const products = await Product.bulkCreate([
      {
        name: 'Áo thun nam',
        slug: 'ao-thun-nam',
        description: 'Áo thun nam chất lượng cao',
        price: 200000,
        category_id: categories[0].id,
        stock_quantity: 100,
        image_url: '/images/products/ao-thun-nam.jpg',
        status: 'active',
      },
      {
        name: 'Quần jean nam',
        slug: 'quan-jean-nam',
        description: 'Quần jean nam phong cách',
        price: 500000,
        category_id: categories[1].id,
        stock_quantity: 50,
        image_url: '/images/products/quan-jean-nam.jpg',
        status: 'active',
      },
      {
        name: 'Giày thể thao',
        slug: 'giay-the-thao',
        description: 'Giày thể thao chất lượng',
        price: 800000,
        category_id: categories[2].id,
        stock_quantity: 30,
        image_url: '/images/products/giay-the-thao.jpg',
        status: 'active',
      },
    ]);

    // Tạo orders
    const orders = await Order.bulkCreate([
      {
        user_id: users[0].id,
        total_amount: 700000,
        shipping_address: 'Số 123, Đường ABC, Quận 1, TP.HCM',
        payment_method: 'COD',
        payment_status: 'pending',
        order_status: 'confirmed',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
      },
      {
        user_id: users[1].id,
        total_amount: 1000000,
        shipping_address: 'Số 456, Đường DEF, Quận 2, TP.HCM',
        payment_method: 'bank-transfer',
        payment_status: 'paid',
        order_status: 'delivered',
        created_at: new Date('2024-01-20'),
        updated_at: new Date('2024-01-22'),
      },
      {
        user_id: users[0].id,
        total_amount: 500000,
        shipping_address: 'Số 789, Đường GHI, Quận 3, TP.HCM',
        payment_method: 'e-wallet',
        payment_status: 'paid',
        order_status: 'shipped',
        created_at: new Date('2024-01-25'),
        updated_at: new Date('2024-01-26'),
      },
    ]);

    // Tạo order items
    await OrderItem.bulkCreate([
      {
        order_id: orders[0].id,
        product_id: products[0].id,
        quantity: 2,
        price: 200000,
      },
      {
        order_id: orders[0].id,
        product_id: products[1].id,
        quantity: 1,
        price: 500000,
      },
      {
        order_id: orders[1].id,
        product_id: products[2].id,
        quantity: 1,
        price: 800000,
      },
      {
        order_id: orders[1].id,
        product_id: products[0].id,
        quantity: 1,
        price: 200000,
      },
      {
        order_id: orders[2].id,
        product_id: products[1].id,
        quantity: 1,
        price: 500000,
      },
    ]);

    console.log('✅ Seed data created successfully!');
    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${users.length} users`);
    console.log(`Created ${products.length} products`);
    console.log(`Created ${orders.length} orders`);
    console.log('User accounts:');
    console.log('- nguyenvana@gmail.com / 123456');
    console.log('- tranthib@gmail.com / 123456');
    console.log('- admin@gmail.com / admin123');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData().then(() => {
    process.exit(0);
  });
}
