import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePermissions from '../../hooks/auth/usePermissions';

const TabNavigation = ({ tabsConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Filter tabs based on user permissions
  const filteredTabs = useMemo(() => {
    return tabsConfig.filter(tab => {
      // If no permission is defined, show the tab
      if (!tab.permission) return true;
      // Otherwise check if user has the required permission
      return hasPermission(tab.permission);
    });
  }, [tabsConfig, hasPermission]);

  const currentPath = location.pathname;
  // Sort by route length descending to match more specific routes first (e.g., /settings/roles before /settings)
  const sortedTabs = [...filteredTabs].sort((a, b) => b.route.length - a.route.length);
  const activeTabRoute = sortedTabs.find(tab =>
    currentPath === tab.route || currentPath.startsWith(tab.route + '/')
  )?.route || filteredTabs[0]?.route;

  const handleTabClick = (route) => {
    navigate(route);
  };

  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
      {filteredTabs.map((tab) => (
        <button
          key={tab.name}
          className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${activeTabRoute === tab.route
              ? 'text-green-800 border-b-2 border-green-800'
              : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
            }`}
          onClick={() => handleTabClick(tab.route)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
