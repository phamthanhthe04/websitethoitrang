const { User } = require('../models');
const bcrypt = require('bcrypt');

const createAdminUser = async () => {
  try {
    console.log('🔐 Creating admin user...');

    // Check if admin exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   ID:', adminUser.id);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
    process.exit(1);
  }
};

createAdminUser();
