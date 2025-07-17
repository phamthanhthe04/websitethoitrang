import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const CategoryFilterSelect = ({
  value,
  onChange,
  placeholder = 'Tất cả danh mục',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [categoryTree, setCategoryTree] = useState([
    { id: 'all', name: 'Tất cả danh mục', isSpecial: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch category data from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await adminService.getCategories();
        if (response && response.data) {
          // Convert flat list to tree structure
          const categoriesWithLevel = response.data.map((cat) => ({
            ...cat,
            level: cat.level || 0,
          }));

          const tree = buildCategoryTree(categoriesWithLevel);
          // Add the "All categories" option
          setCategoryTree([
            { id: 'all', name: 'Tất cả danh mục', isSpecial: true },
            ...tree,
          ]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Build category tree from flat list
  const buildCategoryTree = (categories) => {
    const map = {};
    const roots = [];

    // First create a map of id to node
    categories.forEach((category) => {
      map[category.id] = {
        ...category,
        children: [],
      };
    });

    // Then connect children to parents
    categories.forEach((category) => {
      const parentId = category.parentId || category.parent_id;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[category.id]);
      } else {
        roots.push(map[category.id]);
      }
    });

    return roots;
  };

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelect = (category) => {
    onChange(category.id);
    setIsOpen(false);
  };

  const findCategoryByValue = (categories, searchValue) => {
    for (const category of categories) {
      if (category.id === searchValue) {
        return category;
      }
      if (category.children) {
        const found = findCategoryByValue(category.children, searchValue);
        if (found) return found;
      }
    }
    return null;
  };

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = value === category.id || value === category.name;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-blue-50 transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          } ${category.isSpecial ? 'border-b border-gray-200' : ''}`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => {
            if (hasChildren && !category.isSpecial) {
              toggleExpanded(category.id);
            } else {
              handleSelect(category);
            }
          }}
        >
          {hasChildren && !category.isSpecial && (
            <i
              className={`fas fa-chevron-right mr-2 text-xs transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
          {(!hasChildren || category.isSpecial) && <div className='w-4 mr-2' />}

          <div className='flex items-center'>
            {category.isSpecial ? (
              <i className='fas fa-list text-gray-500 mr-2' />
            ) : hasChildren ? (
              <i className='fas fa-folder text-blue-500 mr-2' />
            ) : (
              <i className='fas fa-tag text-green-500 mr-2' />
            )}
            <span
              className={`text-sm ${category.isSpecial ? 'font-medium' : ''}`}
            >
              {category.name}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && !category.isSpecial && (
          <div>
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedCategory = findCategoryByValue(categoryTree, value);
  const displayName = selectedCategory ? selectedCategory.name : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-filter-select')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative category-filter-select'>
      <div
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
        onClick={() => (loading ? null : setIsOpen(!isOpen))}
      >
        <div className='flex items-center'>
          {loading ? (
            <>
              <i className='fas fa-circle-notch fa-spin mr-2 text-blue-500'></i>{' '}
              <span className='text-gray-500'>Đang tải...</span>
            </>
          ) : error ? (
            <>
              <i className='fas fa-exclamation-triangle mr-2 text-red-500'></i>{' '}
              <span className='text-red-500'>Lỗi tải danh mục</span>
            </>
          ) : (
            <>
              <i className='fas fa-filter text-gray-400 mr-2' />
              <span
                className={value === 'all' ? 'text-gray-500' : 'text-gray-900'}
              >
                {displayName}
              </span>
            </>
          )}
        </div>
        <i
          className={`fas fa-chevron-down text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto'>
          <div className='py-1'>
            {loading ? (
              <div className='flex items-center justify-center p-4'>
                <i className='fas fa-circle-notch fa-spin mr-2 text-blue-500'></i>
                <span className='text-gray-600'>Đang tải danh mục...</span>
              </div>
            ) : error ? (
              <div className='flex items-center justify-center p-4 text-red-500'>
                <i className='fas fa-exclamation-triangle mr-2'></i>
                <span>{error}</span>
              </div>
            ) : categoryTree.length <= 1 ? (
              <div className='text-center p-4 text-gray-500'>
                <i className='fas fa-folder-open mb-2 text-2xl'></i>
                <p>Không có danh mục nào</p>
              </div>
            ) : (
              categoryTree.map((category) => renderCategory(category))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilterSelect;
