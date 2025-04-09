import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Settings, 
  LogOut 
} from 'lucide-react';
import dashboardIcon from '../assets/icons/dashboard.png';
import transactionIcon from '../assets/icons/transaction.png';
import annualIcon from '../assets/icons/annual.png';
import referralIcon from '../assets/icons/network.png';
import PDCHI from '../assets/icons/purehealth_logo.jpg'; 

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const isLogged = localStorage.getItem('user');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  }

  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard', icon: dashboardIcon },
    { title: 'Transaction', path: '/transaction', icon: transactionIcon },
    { title: 'Monthly', path: '/monthly-income', icon: annualIcon },
    { title: 'Referrals', path: '/referrals', icon: referralIcon },
    { title: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  // ADD ROUTES HERE IF NEW PAGE IS CREATED FOR HOVER ACTIVE
  const isRouteActive = (itemPath) => {
   
    if (location.pathname === itemPath) return true;
    
    if (itemPath === '/transaction') {
      return ['/add-income', '/add-expenses', '/transaction'].includes(location.pathname) || 
             location.pathname.startsWith('/transaction/');
    }
    else if (itemPath === '/monthly-income') {
      return ['/monthly-expenses', '/monthly-income'].includes(location.pathname) ||
             location.pathname.startsWith('/monthly-income/');
    }
    else if (itemPath === '/settings') {
      return ['/view-accounts','/add-account', '/activity-log', '/department-management', '/test-management', '/referral-management', '/settings'].includes(location.pathname) ||
      location.pathname.startsWith('/settings/');
    }
    
    return false;
  };

  return (
    <>
     
      <button 
        className="lg:hidden fixed z-20 top-4 left-4 p-2 rounded-md bg-white shadow-md transition-colors duration-300 hover:bg-green-100 focus:outline-none"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar content */}
      <div className={`fixed left-0 top-0 h-full bg-[#02542D] shadow-xl z-20 transform transition-transform duration-300 ease-in-out w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 flex flex-col items-center text-center">
          <img 
            src={PDCHI} 
            alt="Purehealth Logo" 
            className="h-16 mb-1 hidden lg:block rounded-md" 
          />
          <div>
            <h2 className="text-xl font-bold text-white">Purehealth</h2>
            <h3 className="text-md font-semibold text-white">Diagnostic Center</h3>
          </div>
        </div>

        <hr className='my-4 border-2 border-white'/>
        
        <nav className="mt-4">
          <ul className="space-y-2 px-4">
            {menuItems.map((item, index) => {
              const isActive = isRouteActive(item.path);
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center p-4 rounded-lg transition-all duration-300 ${isActive ? 'bg-green-600' : 'bg-transparent hover:bg-green-600'}`}
                  >
                    <span className="mr-4 text-white relative z-10">
                      {typeof item.icon === 'string' ? (
                        <img src={item.icon} alt={`${item.title} icon`} className="w-7 h-7" />
                      ) : React.isValidElement(item.icon) ? (
                        item.icon
                      ) : (
                        <img src={item.icon} alt={`${item.title} icon`} className="w-7 h-7" />
                      )}
                    </span>
                    <span className="text-white relative z-10">{item.title}</span>
                  </Link>
                </li>
              );
            })}
            
            {/* Logout item with onClick handler */}
            <li>
              <div
                onClick={handleLogout}
                className="flex items-center p-4 rounded-lg transition-all duration-300 bg-transparent hover:bg-green-600 cursor-pointer"
              >
                <span className="mr-4 text-white relative z-10">
                  <LogOut size={20} />
                </span>
                <span className="text-white relative z-10">Logout</span>
              </div>
            </li>

          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
