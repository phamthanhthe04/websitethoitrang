// src/components/Header/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { HeaderIcons } from './HeaderStyles/HeaderStylesIcon.js';
import CartModal from '../Cart/CartModal';
import SearchModal from '../Search/SearchModal';
import logo from '../../assets/images/logo.jpg';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/dang-nhap');
  };

  const toggleCartModal = () => {
    setIsCartModalOpen(!isCartModalOpen);
  };

  const toggleSearchModal = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
  };

  const handleMouseEnter = (category) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setActiveDropdown(category);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200); // Delay để tránh flicker khi di chuyển chuột
    setHoverTimeout(timeout);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };

  // Category configurations
  const categoryConfigs = {
    NAM: {
      ÁO: [
        { name: 'Áo sơ mi', path: '/nam?category=ao-so-mi' },
        { name: 'Áo thun', path: '/nam?category=ao-thun' },
        { name: 'Áo polo', path: '/nam?category=ao-polo' },
      ],
      QUẦN: [
        { name: 'Quần dài', path: '/nam?category=quan-dai' },
        { name: 'Quần jeans', path: '/nam?category=quan-jeans' },
        { name: 'Quần short', path: '/nam?category=quan-short' },
      ],
    },
    NỮ: {
      ÁO: [
        { name: 'Áo sơ mi', path: '/nu?category=ao-so-mi' },
        { name: 'Áo thun', path: '/nu?category=ao-thun' },
        { name: 'Áo croptop', path: '/nu?category=ao-croptop' },
      ],
      ĐẦM: [
        { name: 'Đầm công sở', path: '/nu?category=dam-cong-so' },
        { name: 'Đầm dạo phố', path: '/nu?category=dam-dao-pho' },
      ],
      QUẦN: [
        { name: 'Quần dài', path: '/nu?category=quan-dai' },
        { name: 'Quần jeans', path: '/nu?category=quan-jeans' },
      ],
    },
    'TRẺ EM': {
      'BÉ TRAI': [
        { name: 'Áo thun bé trai', path: '/tre-em?category=ao-thun-be-trai' },
        { name: 'Quần bé trai', path: '/tre-em?category=quan-be-trai' },
      ],
      'BÉ GÁI': [
        { name: 'Đầm bé gái', path: '/tre-em?category=dam-be-gai' },
        { name: 'Áo thun bé gái', path: '/tre-em?category=ao-thun-be-gai' },
      ],
    },
  };

  // Dropdown Menu Component
  const DropdownMenu = ({ category, config, isOpen }) => {
    if (!isOpen) return null;

    return (
      <div className='absolute top-full left-0 w-80 bg-white border border-gray-200 shadow-lg z-50 rounded-lg'>
        <div className='grid grid-cols-2 gap-4 p-6'>
          {Object.entries(config).map(([mainCategory, items]) => (
            <div key={mainCategory} className='space-y-3'>
              <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2'>
                {mainCategory}
              </h3>
              <ul className='space-y-2'>
                {items.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.path}
                      onClick={handleDropdownClose}
                      className='block text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 py-1'
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className='border-t border-gray-200 bg-gray-50 p-3 rounded-b-lg'>
          <Link
            to={`/${category.toLowerCase()}`}
            onClick={handleDropdownClose}
            className='text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors'
          >
            Xem tất cả {category}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4'>
            {/* Logo Section */}
            <div className='flex items-center'>
              <Link
                to='/'
                className='flex items-center text-decoration-none hover:opacity-80 transition-opacity'
              >
                <img
                  className='h-10 w-10 rounded-lg object-cover'
                  src={logo}
                  alt='Fashion Logo'
                />
                <h1 className='ml-3 text-2xl font-bold text-primary-600'>
                  Fashion
                </h1>
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className='hidden md:flex'>
              <ul className='flex items-center space-x-8'>
                <li>
                  <Link
                    to='/'
                    className='text-gray-700 hover:text-primary-600 font-medium transition-colors'
                  >
                    Trang chủ
                  </Link>
                </li>

                {/* Nam Dropdown */}
                <li
                  className='relative dropdown-container'
                  onMouseEnter={() => handleMouseEnter('NAM')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to='/nam'
                    className='flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors'
                  >
                    Nam
                    <svg
                      className='ml-1 w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </Link>
                  <DropdownMenu
                    category='NAM'
                    config={categoryConfigs.NAM}
                    isOpen={activeDropdown === 'NAM'}
                  />
                </li>

                {/* Nữ Dropdown */}
                <li
                  className='relative dropdown-container'
                  onMouseEnter={() => handleMouseEnter('NỮ')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to='/nu'
                    className='flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors'
                  >
                    Nữ
                    <svg
                      className='ml-1 w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </Link>
                  <DropdownMenu
                    category='NỮ'
                    config={categoryConfigs.NỮ}
                    isOpen={activeDropdown === 'NỮ'}
                  />
                </li>

                {/* Trẻ em Dropdown */}
                <li
                  className='relative dropdown-container'
                  onMouseEnter={() => handleMouseEnter('TRẺ EM')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to='/tre-em'
                    className='flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors'
                  >
                    Trẻ em
                    <svg
                      className='ml-1 w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </Link>
                  <DropdownMenu
                    category='TRẺ EM'
                    config={categoryConfigs['TRẺ EM']}
                    isOpen={activeDropdown === 'TRẺ EM'}
                  />
                </li>

                <li>
                  <Link
                    to='/khuyen-mai'
                    className='text-gray-700 hover:text-primary-600 font-medium transition-colors'
                  >
                    Khuyến mại
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Right Side Icons & Auth */}
            <div className='flex items-center space-x-4'>
              {/* Search Button */}
              <button
                className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'
                onClick={toggleSearchModal}
                aria-label='Search'
              >
                <HeaderIcons.SearchIcon />
              </button>

              {/* Cart Button */}
              <button
                className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors relative'
                onClick={toggleCartModal}
                aria-label='Shopping Cart'
              >
                <HeaderIcons.CartIcon />
                {/* Cart Badge - you can add item count here */}
                {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span> */}
              </button>

              {/* Wishlist Button - Show for both authenticated and unauthenticated users */}
              <Link
                to='/wishlist'
                className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'
                aria-label='Wishlist'
              >
                <HeaderIcons.HeartIcon />
              </Link>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className='flex items-center space-x-3'>
                  {/* User Profile Link */}
                  <Link
                    to='/profile'
                    className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'
                    aria-label='Profile'
                  >
                    <HeaderIcons.UserIcon />
                  </Link>

                  {/* Wallet Link */}
                  <Link
                    to='/wallet'
                    className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'
                    aria-label='Wallet'
                    title='Ví tiền'
                  >
                    <i className='fas fa-wallet'></i>
                  </Link>

                  {/* User Greeting */}
                  <span className='hidden lg:block text-sm text-gray-600'>
                    Xin chào, {user?.name || user?.email}!
                  </span>

                  {/* Admin Panel Link */}
                  {user?.role === 'admin' && (
                    <Link
                      to='/admin'
                      className='flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium'
                    >
                      <i className='fas fa-cogs'></i>
                      <span className='hidden sm:block'>Admin Panel</span>
                    </Link>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className='px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium'
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <Link
                    to='/dang-nhap'
                    className='px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg transition-colors text-sm font-medium'
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to='/dang-ky'
                    className='px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium'
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button className='md:hidden p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Cart Modal */}
        <CartModal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
        />{' '}
        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      </header>
    </>
  );
};

export default Header;
