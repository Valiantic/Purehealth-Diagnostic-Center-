import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage dropdown menu toggle state
 * @returns {Object} Menu toggle state and functions
 */
const useMenuToggle = () => {
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Toggle menu open/close
  const toggleMenu = useCallback((id) => {
    setOpenMenuId(prevId => prevId === id ? null : id);
    console.log('Menu toggled:', id);
  }, []);
  
  // Close menu when clicking outside
  const closeMenus = useCallback(() => {
    setOpenMenuId(null);
  }, []);
  
  // Prevent event propagation for dropdown items
  const handleDropdownClick = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
  }, []);
  
  // Close menus when clicking outside
  useEffect(() => {
    document.addEventListener('click', closeMenus);
    return () => {
      document.removeEventListener('click', closeMenus);
    };
  }, [closeMenus]);
  
  return {
    openMenuId,
    toggleMenu,
    handleDropdownClick,
  };
};

export default useMenuToggle;
