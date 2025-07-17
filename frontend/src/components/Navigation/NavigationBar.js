import React, { useState } from 'react';
import CategoryDropdown from './CategoryDropdown';

const NavigationBar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleDropdownToggle = (category) => {
    setActiveDropdown(activeDropdown === category ? null : category);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
  };

  // Cấu hình danh mục theo ảnh IVY moda
  const categoryConfig = {
    NỮ: {
      ÁO: [
        { name: 'Áo sơ mi', path: '/nu/ao-so-mi' },
        { name: 'Áo thun', path: '/nu/ao-thun' },
        { name: 'Áo croptop', path: '/nu/ao-croptop' },
      ],
      'ÁO KHOÁC': [
        { name: 'Áo vest/ blazer', path: '/nu/ao-vest-blazer' },
        { name: 'Áo khoác', path: '/nu/ao-khoac' },
      ],
      'SET BỘ': [
        { name: 'Set bộ công sở', path: '/nu/set-bo-cong-so' },
        { name: 'Set bộ co-ords', path: '/nu/set-bo-co-ords' },
        { name: 'Set bộ thun/ len', path: '/nu/set-bo-thun-len' },
      ],
      'QUẦN & JUMPSUIT': [
        { name: 'Quần dài', path: '/nu/quan-dai' },
        { name: 'Quần jeans', path: '/nu/quan-jeans' },
        { name: 'Quần lửng/ short', path: '/nu/quan-lung-short' },
        { name: 'Jumpsuit', path: '/nu/jumpsuit' },
      ],
      'CHÂN VÁY': [
        { name: 'Chân váy bút chì', path: '/nu/chan-vay-but-chi' },
        { name: 'Chân váy chữ A', path: '/nu/chan-vay-chu-a' },
        { name: 'Chân váy xếp ly', path: '/nu/chan-vay-xep-ly' },
        { name: 'Chân váy jeans', path: '/nu/chan-vay-jeans' },
      ],
      ĐẦM: [
        { name: 'Đầm công sở', path: '/nu/dam-cong-so' },
        { name: 'Đầm voan hoa/ maxi', path: '/nu/dam-voan-hoa-maxi' },
        { name: 'Đầm thun', path: '/nu/dam-thun' },
      ],
    },
    NAM: {
      ÁO: [
        { name: 'Áo sơ mi', path: '/nam/ao-so-mi' },
        { name: 'Áo thun', path: '/nam/ao-thun' },
        { name: 'Áo polo', path: '/nam/ao-polo' },
      ],
      'ÁO KHOÁC': [
        { name: 'Áo vest/ blazer', path: '/nam/ao-vest-blazer' },
        { name: 'Áo khoác', path: '/nam/ao-khoac' },
        { name: 'Áo hoodie', path: '/nam/ao-hoodie' },
      ],
      QUẦN: [
        { name: 'Quần dài', path: '/nam/quan-dai' },
        { name: 'Quần jeans', path: '/nam/quan-jeans' },
        { name: 'Quần short', path: '/nam/quan-short' },
        { name: 'Quần kaki', path: '/nam/quan-kaki' },
      ],
      'PHỤ KIỆN': [
        { name: 'Thắt lưng', path: '/nam/that-lung' },
        { name: 'Cà vạt', path: '/nam/ca-vat' },
        { name: 'Túi xách', path: '/nam/tui-xach' },
      ],
    },
    'TRẺ EM': {
      'BÉ TRAI': [
        { name: 'Áo thun bé trai', path: '/tre-em/be-trai/ao-thun' },
        { name: 'Quần bé trai', path: '/tre-em/be-trai/quan' },
        { name: 'Set bộ bé trai', path: '/tre-em/be-trai/set-bo' },
      ],
      'BÉ GÁI': [
        { name: 'Áo thun bé gái', path: '/tre-em/be-gai/ao-thun' },
        { name: 'Đầm bé gái', path: '/tre-em/be-gai/dam' },
        { name: 'Chân váy bé gái', path: '/tre-em/be-gai/chan-vay' },
        { name: 'Set bộ bé gái', path: '/tre-em/be-gai/set-bo' },
      ],
      'THEO ĐỘ TUỔI': [
        { name: '0-2 tuổi', path: '/tre-em/0-2-tuoi' },
        { name: '3-5 tuổi', path: '/tre-em/3-5-tuoi' },
        { name: '6-10 tuổi', path: '/tre-em/6-10-tuoi' },
        { name: '11-14 tuổi', path: '/tre-em/11-14-tuoi' },
      ],
    },
  };

  return (
    <nav className='bg-white border-b border-gray-200 sticky top-16 z-40'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-center space-x-8 py-3'>
          {/* Special Links */}
          <a
            href='/sieu-deal-thang-7'
            className='text-sm font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wide'
          >
            SIÊU DEAL THÁNG 7 - SALE ĐẪM SAU
          </a>

          <a
            href='/bo-suu-tap'
            className='text-sm font-medium text-gray-700 hover:text-red-600 transition-colors uppercase tracking-wide'
          >
            BỘ SƯU TẬP
          </a>

          <a
            href='/ve-chung-toi'
            className='text-sm font-medium text-gray-700 hover:text-red-600 transition-colors uppercase tracking-wide'
          >
            VỀ CHÚNG TÔI
          </a>

          {/* Category Dropdowns */}
          {Object.keys(categoryConfig).map((category) => (
            <CategoryDropdown
              key={category}
              category={category}
              subcategories={categoryConfig[category]}
              isOpen={activeDropdown === category}
              onToggle={() => handleDropdownToggle(category)}
              onClose={handleDropdownClose}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
