import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'
import { Pencil, Key, Users } from 'lucide-react'
import tabsConfig from '../config/tabsConfig'

const Settings = () => {
  const { user, isAuthenticating } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleViewAccounts = () => {
    navigate('/view-accounts')
  }
  
  const userData = {
    firstName: 'Juan Ponce',
    middleName: 'De Leon',
    lastName: 'Enrile',
    email: 'juanponce@gmail.com'
  };

  if (isAuthenticating) {
    return null;
  }

  if(!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Account';

  return (
   <div className="flex flex-col md:flex-row min-h-screen h-full bg-gray-100">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={tabsConfig} />
          
          {/* Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'Account' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form fields - left side */}
                <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Email Address:</label>
                    <input 
                      type="email" 
                      value={userData.email} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">First Name:</label>
                    <input 
                      type="text" 
                      value={userData.firstName} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Middle Name:</label>
                    <input 
                      type="text" 
                      value={userData.middleName} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Last Name:</label>
                    <input 
                      type="text" 
                      value={userData.lastName} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                </div>
                
                {/* Buttons - right side */}
                <div className="lg:col-span-5 flex flex-col space-y-3 items-start">
                  <button className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Account
                  </button>
                  
                  <button className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                    <Key className="w-4 h-4 mr-2" />
                    Change Passkey
                  </button>
                  
                  <button onClick={handleViewAccounts} className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                    <Users className="w-4 h-4 mr-2" />
                    View Accounts
                  </button>
                </div>
              </div>
            )}
            
        
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
