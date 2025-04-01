import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'

const ViewAccounts = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Define tab configuration with routes
  const tabsConfig = [
    { name: 'Account', route: '/settings' },
    { name: 'Activity', route: '/view-accounts/activity' },
    { name: 'Department', route: '/view-accounts/department' },
    { name: 'Test', route: '/view-accounts/test' },
    { name: 'Referrer', route: '/view-accounts/referrer' }
  ];

  const handleAddAccount = () => {
    navigate('/add-account')
  }
    
  const userData = {
    firstName: 'Juan Ponce',
    middleName: 'De Leon',
    lastName: 'Enrile',
    email: 'juanponce@gmail.com'
  };

  if(isAuthenticating) {
    return null;
  }

  if(!user) {
    return null;
  }

  // Determine which content to show based on current path
  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Account';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
     
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          {/* Use the TabNavigation component */}
          <TabNavigation tabsConfig={tabsConfig} />
          
          {/* Content based on active tab */}
          {activeTab === 'Account' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
                <button onClick={handleAddAccount} className="bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                  <PlusCircle className="mr-1 sm:mr-2" size={18} />
                  Add Account
                </button>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search User..."
                    className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                </div>
              </div>

              {/* Monthly Income Table */}
              <div className="p-2">
                {/* ...existing code... */}
                <div className="bg-green-800 p-2 rounded-t">
                  <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>User Accounts</h1>
                </div>
                <div className="border border-green-800 rounded-b">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                  <tr className="border-b border-green-800 bg-green-100">
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Name</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Username</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Email</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Status</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Created</th>
                    <th className="p-1">Opt.</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty rows for data input */}
                  {[...Array(10)].map((_, index) => (
                    <tr key={`income-row-${index}`} className="border-b border-green-200">
                      <td className="p-1 border-r border-green-200"></td>
                      <td className="p-1 border-r border-green-200"></td>
                      <td className="p-1 border-r border-green-200"></td>
                      <td className="p-1 border-r border-green-200"></td>
                      <td className="p-1 border-r border-green-200"></td>
                    </tr>
                  ))}
                  
                </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
          
         
        </div>
      </div>
    </div>
  )
}

export default ViewAccounts
