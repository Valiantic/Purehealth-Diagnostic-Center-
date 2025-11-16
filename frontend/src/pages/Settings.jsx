import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import TabNavigation from '../components/dashboard/TabNavigation'
import useAuth from '../hooks/auth/useAuth'
import usePasskeyManager from '../hooks/auth/usePasskeyManager'
import PasskeyModal from '../components/auth/PasskeyModal'
import { Pencil, Key, Users, Save, X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import tabsConfig from '../config/tabsConfig'
import { userAPI, settingsAPI } from '../services/api'
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

  // Discount categories state
  const [discountCategories, setDiscountCategories] = useState([])
  const [newDiscount, setNewDiscount] = useState({ categoryName: '', percentage: '' })
  const [editingDiscountId, setEditingDiscountId] = useState(null)
  const [editingDiscountData, setEditingDiscountData] = useState({})

  // Referral fee state
  const [referralFee, setReferralFee] = useState(12)
  const [isEditingReferralFee, setIsEditingReferralFee] = useState(false)
  const [tempReferralFee, setTempReferralFee] = useState(12)

  // Initialize passkey manager
  const passkeyManager = usePasskeyManager(user?.userId);

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
    
    // Fetch discount categories and referral fee
    fetchDiscountCategories();
    fetchReferralFee();
  }, [refreshUser]);

  const handleViewAccounts = () => {
    navigate('/view-accounts')
  }

  // Fetch discount categories
  const fetchDiscountCategories = async () => {
    try {
      const response = await settingsAPI.getAllDiscountCategories();
      if (response.data && response.data.success) {
        setDiscountCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching discount categories:', error);
    }
  }

  // Fetch referral fee
  const fetchReferralFee = async () => {
    try {
      const response = await settingsAPI.getSettingByKey('referral_fee_percentage');
      if (response.data && response.data.success) {
        const fee = parseFloat(response.data.setting.settingValue);
        setReferralFee(fee);
        setTempReferralFee(fee);
      }
    } catch (error) {
      // If setting doesn't exist, it will use default value
     console.error('Referral fee setting not found, using default');
    }
  }

  // Handle add discount category
  const handleAddDiscount = async () => {
    // If form is empty, just show the form
    if (!newDiscount.categoryName && !newDiscount.percentage) {
      setNewDiscount({ categoryName: '', percentage: '20' });
      return;
    }

    if (!newDiscount.categoryName || !newDiscount.percentage) {
      toast.error('Please fill in all fields', { position: "top-right", autoClose: 3000 });
      return;
    }

    const percentage = parseFloat(newDiscount.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Percentage must be between 0 and 100', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const response = await settingsAPI.createDiscountCategory(
        { categoryName: newDiscount.categoryName, percentage },
        user?.userId
      );
      
      if (response.data && response.data.success) {
        toast.success('Discount category added successfully', { position: "top-right", autoClose: 3000 });
        setNewDiscount({ categoryName: '', percentage: '' });
        fetchDiscountCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add discount category', { 
        position: "top-right", 
        autoClose: 3000 
      });
    }
  }

  // Handle update discount category
  const handleUpdateDiscount = async (id) => {
    const data = editingDiscountData[id];
    if (!data) return;

    const percentage = parseFloat(data.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Percentage must be between 0 and 100', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const response = await settingsAPI.updateDiscountCategory(
        id,
        { categoryName: data.categoryName, percentage },
        user?.userId
      );
      
      if (response.data && response.data.success) {
        toast.success('Discount category updated successfully', { position: "top-right", autoClose: 3000 });
        setEditingDiscountId(null);
        setEditingDiscountData({});
        fetchDiscountCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update discount category', { 
        position: "top-right", 
        autoClose: 3000 
      });
    }
  }

  // Handle delete discount category
  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount category?')) {
      return;
    }

    try {
      const response = await settingsAPI.deleteDiscountCategory(id, user?.userId);
      
      if (response.data && response.data.success) {
        toast.success('Discount category deleted successfully', { position: "top-right", autoClose: 3000 });
        fetchDiscountCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete discount category', { 
        position: "top-right", 
        autoClose: 3000 
      });
    }
  }

  // Handle update referral fee
  const handleUpdateReferralFee = async () => {
    const fee = parseFloat(tempReferralFee);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast.error('Referral fee must be between 0 and 100', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const response = await settingsAPI.updateSetting(
        'referral_fee_percentage',
        fee.toString(),
        user?.userId
      );
      
      if (response.data && response.data.success) {
        toast.success('Referral fee updated successfully', { position: "top-right", autoClose: 3000 });
        setReferralFee(fee);
        setIsEditingReferralFee(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update referral fee', { 
        position: "top-right", 
        autoClose: 3000 
      });
    }
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
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={filteredTabs} />
          
          {/* Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'Account' && (
              <div className="space-y-8">
                {/* User Account Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">User Account</h2>
                    {!isEditing ? (
                      <button 
                        onClick={handleEditToggle}
                        className="flex items-center justify-center py-2 px-4 bg-green-800 hover:bg-green-700 text-white rounded-md transition"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Account
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className="flex items-center justify-center py-2 px-4 bg-green-800 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          onClick={handleEditToggle}
                          className="flex items-center justify-center py-2 px-4 bg-gray-500 hover:bg-gray-400 text-white rounded-md transition"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 font-medium">Change First Name</p>
                          {isEditing ? (
                            <input 
                              type="text" 
                              name="firstName"
                              value={userData.firstName} 
                              onChange={handleInputChange}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          ) : (
                            <p className="text-base font-semibold text-gray-800">{userData.firstName}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Name Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 font-medium">Change Middle Name</p>
                          {isEditing ? (
                            <input 
                              type="text" 
                              name="middleName"
                              value={userData.middleName || ''} 
                              onChange={handleInputChange}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="Enter middle name (optional)"
                            />
                          ) : (
                            <p className="text-base font-semibold text-gray-800">{userData.middleName || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Last Name Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 font-medium">Change Last Name</p>
                          {isEditing ? (
                            <input 
                              type="text" 
                              name="lastName"
                              value={userData.lastName} 
                              onChange={handleInputChange}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          ) : (
                            <p className="text-base font-semibold text-gray-800">{userData.lastName}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 font-medium">Change Email Address</p>
                          {isEditing ? (
                            <input 
                              type="email" 
                              name="email"
                              value={userData.email} 
                              onChange={handleInputChange}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          ) : (
                            <p className="text-base font-semibold text-gray-800 truncate">{userData.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Change Passkey Card */}
                    <div 
                      onClick={!isEditing ? passkeyManager.openChangePasskeyModal : undefined}
                      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${!isEditing ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Key className="w-6 h-6 text-orange-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 font-medium">Manage Passkeys</p>
                          <p className="text-base font-semibold text-gray-800">Add or Remove</p>
                        </div>
                      </div>
                    </div>

                    {/* Manage Accounts Card */}
                    {user.role !== 'receptionist' && (
                      <div 
                        onClick={!isEditing ? handleViewAccounts : undefined}
                        className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${!isEditing ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 font-medium">Manage Accounts</p>
                            <p className="text-base font-semibold text-gray-800">View All Users</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                </div>

                {/* Discount Categories Section */}
                {user.role !== 'receptionist' && (
                  <div>
                    {/* Add Discount Button */}
                    <button 
                      onClick={handleAddDiscount}
                      className="mb-4 px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md transition flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add Discount</span>
                    </button>

                    {/* Discount Categories Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                      {/* Discount Cards - Left 2/3 */}
                      <div className="lg:col-span-2 space-y-3 min-h-0">
                        {discountCategories.filter(cat => cat.status === 'active').map((category) => (
                          <div key={category.discountCategoryId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            {editingDiscountId === category.discountCategoryId ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingDiscountData[category.discountCategoryId]?.categoryName || category.categoryName}
                                  onChange={(e) => setEditingDiscountData({
                                    ...editingDiscountData,
                                    [category.discountCategoryId]: {
                                      ...editingDiscountData[category.discountCategoryId],
                                      categoryName: e.target.value,
                                      percentage: editingDiscountData[category.discountCategoryId]?.percentage || category.percentage
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={editingDiscountData[category.discountCategoryId]?.percentage || category.percentage}
                                      onChange={(e) => setEditingDiscountData({
                                        ...editingDiscountData,
                                        [category.discountCategoryId]: {
                                          ...editingDiscountData[category.discountCategoryId],
                                          categoryName: editingDiscountData[category.discountCategoryId]?.categoryName || category.categoryName,
                                          percentage: e.target.value
                                        }
                                      })}
                                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                    />
                                    <span className="text-gray-600">%</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleUpdateDiscount(category.discountCategoryId)}
                                      className="px-3 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md transition"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingDiscountId(null);
                                        setEditingDiscountData({});
                                      }}
                                      className="px-3 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-md transition"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDiscount(category.discountCategoryId)}
                                      className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-500 font-medium">{category.categoryName}</p>
                                  <p className="text-xs text-gray-400">Set discount amount for {category.categoryName}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2 border border-gray-300 rounded px-3 py-1.5 min-w-[100px] justify-center">
                                    <span className="text-xl font-bold text-gray-800">{category.percentage}%</span>
                                    <div className="flex flex-col">
                                      <button
                                        onClick={() => {
                                          setEditingDiscountId(category.discountCategoryId);
                                          setEditingDiscountData({
                                            [category.discountCategoryId]: {
                                              categoryName: category.categoryName,
                                              percentage: parseFloat(category.percentage) + 1
                                            }
                                          });
                                          handleUpdateDiscount(category.discountCategoryId);
                                        }}
                                        className="text-gray-600 hover:text-green-800"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingDiscountId(category.discountCategoryId);
                                          setEditingDiscountData({
                                            [category.discountCategoryId]: {
                                              categoryName: category.categoryName,
                                              percentage: Math.max(0, parseFloat(category.percentage) - 1)
                                            }
                                          });
                                          handleUpdateDiscount(category.discountCategoryId);
                                        }}
                                        className="text-gray-600 hover:text-green-800"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingDiscountId(category.discountCategoryId);
                                      setEditingDiscountData({
                                        [category.discountCategoryId]: {
                                          categoryName: category.categoryName,
                                          percentage: category.percentage
                                        }
                                      });
                                    }}
                                    className="text-gray-600 hover:text-green-800"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add New Discount Card (shown when adding) */}
                        {(newDiscount.categoryName || newDiscount.percentage) && (
                          <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4">
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Discount Category Name (e.g., Student, PWD)"
                                value={newDiscount.categoryName}
                                onChange={(e) => setNewDiscount({ ...newDiscount, categoryName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={newDiscount.percentage}
                                    onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                  <span className="text-gray-600">%</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleAddDiscount}
                                    className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setNewDiscount({ categoryName: '', percentage: '' })}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-md transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Referral Fee Card - Right 1/3 */}
                      <div className="lg:col-span-1">
                        <div className="bg-green-800 text-white rounded-lg p-4 shadow-sm sticky top-0">
                          {isEditingReferralFee ? (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Referral Fee %</p>
                              <p className="text-xs opacity-90">Set rebates amount for referred clients</p>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={tempReferralFee}
                                  onChange={(e) => setTempReferralFee(e.target.value)}
                                  className="w-24 px-3 py-2 border border-white bg-green-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-white text-center text-xl font-bold"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                                <span className="text-2xl font-bold">%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handleUpdateReferralFee}
                                  className="px-3 py-1.5 bg-white text-green-800 rounded-md transition hover:bg-gray-100"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingReferralFee(false);
                                    setTempReferralFee(referralFee);
                                  }}
                                  className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium mb-1">Referral Fee %</p>
                              <p className="text-xs opacity-90 mb-3">Set rebates amount for referred clients</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded px-3 py-1.5">
                                  <span className="text-2xl font-bold">{referralFee}%</span>
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => {
                                        setTempReferralFee(parseFloat(referralFee) + 1);
                                        setIsEditingReferralFee(true);
                                      }}
                                      className="text-white hover:text-gray-200"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setTempReferralFee(Math.max(0, parseFloat(referralFee) - 1));
                                        setIsEditingReferralFee(true);
                                      }}
                                      className="text-white hover:text-gray-200"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Passkey Modal */}
      <PasskeyModal
        isOpen={passkeyManager.isModalOpen}
        onClose={passkeyManager.closeModal}
        modalType={passkeyManager.modalType}
        passkeys={passkeyManager.passkeys}
        selectedPasskey={passkeyManager.selectedPasskey}
        isRegistering={passkeyManager.isRegistering}
        onAddPasskey={passkeyManager.addPasskey}
        onDeletePasskey={passkeyManager.deletePasskey}
        onSetPrimaryPasskey={passkeyManager.setPrimaryPasskey}
      />
    </div>
  )
}

export default Settings
