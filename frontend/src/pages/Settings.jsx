import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { Pencil, Key, Users } from 'lucide-react'

const Settings = () => {
  const { user, isAuthenticating } = useAuth()

  const [activeTab, setActiveTab] = useState('Account');
  const tabs = ['Account', 'Activity', 'Department', 'Test', 'Referrer'];
  
  const userData = {
    username: 'Juan4Ever',
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

  return (
   <div className="flex flex-col md:flex-row min-h-screen h-full bg-gray-100">
      {/* Sidebar placeholder - will be provided by parent component */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-green-800 border-b-2 border-green-800'
                    : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
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
                  
                  <button className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                    <Users className="w-4 h-4 mr-2" />
                    View Accounts
                  </button>
                </div>
              </div>
            )}
            
            {activeTab !== 'Account' && (
              <div className="py-8 text-center text-gray-500">
                {activeTab} content would appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
