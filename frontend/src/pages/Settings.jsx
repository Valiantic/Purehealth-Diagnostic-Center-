import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/auth/useAuth'
import { Pencil, Key, Users, Save, X } from 'lucide-react'
import tabsConfig from '../config/tabsConfig'
import { userAPI } from '../services/api'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Settings = () => {
  const { user, isAuthenticating, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const currentUser = refreshUser();
    if (currentUser) {
      setUserData({
        firstName: currentUser.firstName || '',
        middleName: currentUser.middleName !== undefined && currentUser.middleName !== null 
          ? currentUser.middleName 
          : '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || ''
      });
      
      if (currentUser.userId) {
        const fetchLatestUserData = async () => {
          try {
            const response = await userAPI.getUserById(currentUser.userId);
            if (response.data && response.data.success) {
              const freshUserData = response.data.user;

              const updatedUser = {...currentUser, ...freshUserData};
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              refreshUser();
            
              setUserData({
                firstName: freshUserData.firstName || '',
                middleName: freshUserData.middleName !== undefined && freshUserData.middleName !== null 
                  ? freshUserData.middleName 
                  : '',
                lastName: freshUserData.lastName || '',
                email: freshUserData.email || ''
              });
            }
          } catch (error) {
            console.error('Error fetching latest user data:', error);
          }
        };
        
        fetchLatestUserData();
      }
    }
  }, [refreshUser]);

  const handleViewAccounts = () => {
    navigate('/view-accounts')
  }

  const handleEditToggle = () => {
    if (isEditing) {
      const currentUser = refreshUser();
      setUserData({
        firstName: currentUser.firstName || '',
        middleName: currentUser.middleName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || ''
      });
    }
    setIsEditing(!isEditing)
    setError(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!userData.firstName || !userData.lastName || !userData.email) {
        toast.error('First name, last name and email are required', {
          position: "top-right",
          autoClose: 3000
        });
        setError('First name, last name and email are required')
        setIsLoading(false)
        return
      }

      const currentUser = refreshUser();
      if (!currentUser || !currentUser.userId) {
        toast.error('User session not found. Please log in again.', {
          position: "top-right",
          autoClose: 3000
        });
        setError('User session not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await userAPI.updateUserDetails(currentUser.userId, userData);
      
      if (response.data && response.data.success) {
        const updatedUser = {...currentUser, ...response.data.user};
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        refreshUser();
        
        setIsEditing(false);
        setIsLoading(false);
        
        toast.success('Profile updated successfully', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message), {
        position: "top-right",
        autoClose: 5000
      });
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message))
      setIsLoading(false)
    }
  }

  const getAuthorizedTabs = (tabs, userRole) => {
    if (!userRole) return tabs;
    return tabs.filter(tab => tab.roles.includes(userRole));
  }

  if (isAuthenticating) {
    return null;
  }

  if(!user) {
    return null;
  }

  const currentPath = location.pathname;
  const filteredTabs = getAuthorizedTabs(tabsConfig, user.role);
  const activeTab = filteredTabs.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Account';

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-full bg-gray-100">
      <Sidebar />
      
      {/* Toast Container */}
      <ToastContainer />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={filteredTabs} />
          
          {/* Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'Account' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form fields - left side */}
                <div className="lg:col-span-7 space-y-4">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Email Address:</label>
                    <input 
                      type="email" 
                      name="email"
                      value={userData.email} 
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">First Name:</label>
                    <input 
                      type="text" 
                      name="firstName"
                      value={userData.firstName} 
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Middle Name:</label>
                    <input 
                      type="text" 
                      name="middleName"
                      value={userData.middleName || ''} 
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly={!isEditing}
                      placeholder={isEditing ? "Enter middle name (optional)" : "No middle name provided"}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0">
                    <label className="w-32 md:text-right text-left font-medium text-green-800 md:mr-4 shrink-0">Last Name:</label>
                    <input 
                      type="text" 
                      name="lastName"
                      value={userData.lastName} 
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      readOnly={!isEditing}
                    />
                  </div>
                  
                </div>
                
                {/* Buttons - right side */}
                <div className="lg:col-span-5 flex flex-col space-y-3 items-start">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        onClick={handleEditToggle}
                        className="w-48 flex items-center justify-center py-2 px-3 bg-gray-500 hover:bg-gray-400 text-white rounded-md transition"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleEditToggle}
                        className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Account
                      </button>
                      
                      <button className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                        <Key className="w-4 h-4 mr-2" />
                        Change Passkey
                      </button>
                      
                     {user.role !== 'receptionist' && (
                       <button onClick={handleViewAccounts} className="w-48 flex items-center justify-center py-2 px-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition">
                        <Users className="w-4 h-4 mr-2" />
                        View Accounts
                      </button>
                     )}
                    </>
                  )}
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
