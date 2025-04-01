import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TabNavigation = ({ tabsConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPath = location.pathname;
  const activeTabRoute = tabsConfig.find(tab => 
    currentPath.startsWith(tab.route)
  )?.route || tabsConfig[0].route;

  const handleTabClick = (route) => {
    navigate(route);
  };

  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
      {tabsConfig.map((tab) => (
        <button
          key={tab.name}
          className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${
            activeTabRoute === tab.route
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
