import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { userAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'
import tabsConfig from '../config/tabsConfig'

const ViewAccounts = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Check for success message in location state
  useEffect(() => {
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the location state after displaying message
      window.history.replaceState({}, document.title);
      
      // Auto-hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  // Fetch all accounts using TanStack Query
  const { data: accountsData, isLoading, isError, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await userAPI.getAllUsers()
      return response.data
    }
  })

  const handleAddAccount = () => {
    navigate('/add-account')
  }
  
  // Filter accounts based on search term
  const filteredAccounts = accountsData?.users?.filter(account => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      account.name.toLowerCase().includes(searchLower) ||
      account.email.toLowerCase().includes(searchLower) ||
      account.username.toLowerCase().includes(searchLower) ||
      (account.role && account.role.toLowerCase().includes(searchLower)) // Add role to search criteria
    )
  }) || []

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
          
          {/* Success message */}
          {successMessage && (
            <div className="m-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
                <XCircle size={18} />
              </button>
            </div>
          )}
          
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                </div>
              </div>

              {/* Monthly Income Table */}
              <div className="p-2">
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
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Role</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Status</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Created</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4">Loading...</td>
                          </tr>
                        ) : isError ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-red-500">
                              Error: {error?.message || 'Failed to load accounts'}
                            </td>
                          </tr>
                        ) : filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4">No accounts found</td>
                          </tr>
                        ) : (
                          filteredAccounts.map((account) => (
                            <tr key={account.userId} className="border-b border-green-200">
                              <td className="p-1 pl-5 border-r border-green-200">{account.name}</td>
                              <td className="p-1 border-r border-green-200 text-center">{account.username}</td>
                              <td className="p-1 border-r border-green-200 text-center">{account.email}</td>
                              <td className="p-1 border-r border-green-200 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  account.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {account.role 
                                    ? (account.role === 'admin' ? 'Admin' : 'Receptionist') 
                                    : 'Receptionist'}
                                </span>
                              </td>
                              <td className="p-1 border-r border-green-200 text-center"> 
                                <span className={`px-2 py-1 rounded text-xs ${account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {account.status}
                                </span>
                              </td>
                              <td className="p-1 border-r border-green-200 text-center">
                                {new Date(account.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-1 text-center">
                                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                              </td>
                            </tr>
                          ))
                        )}
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
