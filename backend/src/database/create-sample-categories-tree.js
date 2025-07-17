const { Category } = require('../models');

const createSampleCategoriesTree = async () => {
  try {
    console.log('Xóa tất cả categories cũ...');
    await Category.destroy({ where: {} });

    console.log('Tạo categories cấp 1 (Giới tính)...');

    // Tạo categories cấp 1
    const nam = await Category.create({
      name: 'Nam',
      slug: 'nam',
      description: 'Sản phẩm dành cho nam giới',
      parent_id: null,
    });

    const nu = await Category.create({
      name: 'Nữ',
      slug: 'nu',
      description: 'Sản phẩm dành cho nữ giới',
      parent_id: null,
    });

    const treEm = await Category.create({
      name: 'Trẻ Em',
      slug: 'tre-em',
      description: 'Sản phẩm dành cho trẻ em',
      parent_id: null,
    });

    console.log('Tạo categories cấp 2 (Loại sản phẩm)...');

    // Categories cấp 2 cho Nam
    const aoNam = await Category.create({
      name: 'Áo Nam',
      slug: 'ao-nam',
      description: 'Các loại áo dành cho nam',
      parent_id: nam.id,
    });

    const quanNam = await Category.create({
      name: 'Quần Nam',
      slug: 'quan-nam',
      description: 'Các loại quần dành cho nam',
      parent_id: nam.id,
    });

    // Categories cấp 2 cho Nữ
    const aoNu = await Category.create({
      name: 'Áo Nữ',
      slug: 'ao-nu',
      description: 'Các loại áo dành cho nữ',
      parent_id: nu.id,
    });

    const quanNu = await Category.create({
      name: 'Quần Nữ',
      slug: 'quan-nu',
      description: 'Các loại quần dành cho nữ',
      parent_id: nu.id,
    });

    const damNu = await Category.create({
      name: 'Đầm Nữ',
      slug: 'dam-nu',
      description: 'Các loại đầm dành cho nữ',
      parent_id: nu.id,
    });

    // Categories cấp 2 cho Trẻ Em
    const aoTreEm = await Category.create({
      name: 'Áo Trẻ Em',
      slug: 'ao-tre-em',
      description: 'Các loại áo dành cho trẻ em',
      parent_id: treEm.id,
    });

    console.log('Tạo categories cấp 3 (Chi tiết)...');

    // Categories cấp 3 cho Áo Nam
    await Category.create({
      name: 'Áo Thun Nam',
      slug: 'ao-thun-nam',
      description: 'Áo thun dành cho nam',
      parent_id: aoNam.id,
    });

    await Category.create({
      name: 'Áo Polo Nam',
      slug: 'ao-polo-nam',
      description: 'Áo polo dành cho nam',
      parent_id: aoNam.id,
    });

    await Category.create({
      name: 'Áo Sơ Mi Nam',
      slug: 'ao-so-mi-nam',
      description: 'Áo sơ mi dành cho nam',
      parent_id: aoNam.id,
    });

    // Categories cấp 3 cho Quần Nam
    await Category.create({
      name: 'Quần Jean Nam',
      slug: 'quan-jean-nam',
      description: 'Quần jean dành cho nam',
      parent_id: quanNam.id,
    });

    await Category.create({
      name: 'Quần Âu Nam',
      slug: 'quan-au-nam',
      description: 'Quần âu dành cho nam',
      parent_id: quanNam.id,
    });

    // Categories cấp 3 cho Áo Nữ
    await Category.create({
      name: 'Áo Thun Nữ',
      slug: 'ao-thun-nu',
      description: 'Áo thun dành cho nữ',
      parent_id: aoNu.id,
    });

    await Category.create({
      name: 'Áo Kiểu Nữ',
      slug: 'ao-kieu-nu',
      description: 'Áo kiểu dành cho nữ',
      parent_id: aoNu.id,
    });

    console.log('✅ Đã tạo thành công cấu trúc cây categories!');

    // Hiển thị kết quả
    const allCategories = await Category.findAll({
      attributes: ['id', 'name', 'slug', 'parent_id'],
      order: [['name', 'ASC']],
    });

    console.log('\n📋 Danh sách categories đã tạo:');
    allCategories.forEach((c) => {
      const level = c.parent_id
        ? allCategories.find((p) => p.id === c.parent_id)?.parent_id
          ? 3
          : 2
        : 1;
      const indent = '  '.repeat(level - 1);
      console.log(
        `${indent}- ${c.name} (ID: ${c.id}) ${
          c.parent_id ? `[Parent: ${c.parent_id}]` : '[Root]'
        }`
      );
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi tạo categories:', err.message);
    process.exit(1);
  }
};

createSampleCategoriesTree();
