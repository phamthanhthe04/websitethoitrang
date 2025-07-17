import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CategoryDropdown = ({
  category,
  subcategories,
  isOpen,
  onToggle,
  onClose,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Main Category Button */}
      <button
        onClick={onToggle}
        className={`
          px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors duration-200
          ${
            isOpen
              ? 'text-red-600 bg-gray-50'
              : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
          }
        `}
      >
        {category}
        <svg
          className={`ml-1 w-4 h-4 inline-block transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute top-full left-0 w-80 bg-white border border-gray-200 shadow-lg z-50'>
          <div className='grid grid-cols-2 gap-6 p-6'>
            {Object.entries(subcategories).map(([mainCategory, items]) => (
              <div key={mainCategory} className='space-y-3'>
                <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2'>
                  {mainCategory}
                </h3>
                <ul className='space-y-2'>
                  {items.map((item, index) => (
                    <li key={index}>
                      <Link
                        to={item.path}
                        onClick={onClose}
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

          {/* Special Sections */}
          <div className='border-t border-gray-200 bg-gray-50 p-4'>
            <div className='flex flex-wrap gap-4'>
              <Link
                to='/new-arrival'
                onClick={onClose}
                className='text-sm font-medium text-red-600 hover:text-red-700 transition-colors'
              >
                NEW ARRIVAL
              </Link>
              <Link
                to='/online-exclusive'
                onClick={onClose}
                className='text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors'
              >
                Online Exclusive
              </Link>
              <Link
                to='/sale'
                onClick={onClose}
                className='text-sm font-medium text-red-600 hover:text-red-700 transition-colors'
              >
                Đồ lót 50k - 150k
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
