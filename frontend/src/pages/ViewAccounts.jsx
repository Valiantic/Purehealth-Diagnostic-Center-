import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, XCircle, MoreVertical, X, Edit, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'
import tabsConfig from '../config/tabsConfig'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ViewAccounts = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRefs = useRef({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    status: 'active'
  })
  const [originalUserData, setOriginalUserData] = useState(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    if (location.state?.success && location.state?.message) {
      toast.success(location.state.message)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { data: accountsData, isLoading, isError, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await userAPI.getAllUsers()
      return response.data
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }) => userAPI.updateUserDetails(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('User details updated successfully')
      setShowEditModal(false)
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.response?.data?.message || error.message}`)
    }
  })

  const handleAddAccount = () => {
    navigate('/add-account')
  }

  const toggleDropdown = (e, userId) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === userId ? null : userId)
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await userAPI.getUserById(userId)
      const userData = response.data.user
      const userDataForEdit = {
        firstName: userData.firstName,
        middleName: userData.middleName || '',
        lastName: userData.lastName,
        email: userData.email,
        status: userData.status || 'active'
      }
      
      setEditUserData(userDataForEdit)
      // Create a true deep copy of the data to preserve original values
      setOriginalUserData(JSON.parse(JSON.stringify(userDataForEdit)))
    } catch (error) {
      toast.error('Failed to fetch user details')
      console.error('Error fetching user details:', error)
    }
  }

  const openEditModal = (e, userId) => {
    e.stopPropagation()
    setSelectedUser(userId)
    fetchUserDetails(userId)
    setShowEditModal(true)
    setActiveDropdown(null)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setEditUserData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      status: 'active'
    })
    setOriginalUserData(null)
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditUserData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!selectedUser) return

    // Force string comparison to ensure differences are detected
    const statusChanged = String(originalUserData.status) !== String(editUserData.status);
    const detailsChanged = 
      String(originalUserData.firstName) !== String(editUserData.firstName) ||
      String(originalUserData.middleName) !== String(editUserData.middleName) ||
      String(originalUserData.lastName) !== String(editUserData.lastName) ||
      String(originalUserData.email) !== String(editUserData.email);

    // Always send these as explicit boolean values
    updateUserMutation.mutate({
      userId: selectedUser,
      userData: {
        ...editUserData,
        statusChanged: statusChanged === true,
        detailsChanged: detailsChanged === true,
        currentUserId: user.userId
      }
    });
  }

  const filteredAccounts = accountsData?.users?.filter((account) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      account.name.toLowerCase().includes(searchLower) ||
      account.email.toLowerCase().includes(searchLower) ||
      (account.role && account.role.toLowerCase().includes(searchLower))
    )
  }) || []

  if (isAuthenticating) {
    return null
  }

  if (!user) {
    return null
  }

  const currentPath = location.pathname
  const activeTab =
    tabsConfig.find(
      (tab) => currentPath === tab.route || currentPath.startsWith(tab.route)
    )?.name || 'Account'

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className='md:sticky md:top-0 md:h-screen z-10'>
        <Sidebar />
      </div>

      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm h-full'>
          <TabNavigation tabsConfig={tabsConfig} />

          {errorMessage && (
            <div className='m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center'>
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                className='text-red-700 hover:text-red-900'
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          {activeTab === 'Account' && (
            <>
              <div className='flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4'>
                <button
                  onClick={handleAddAccount}
                  className='bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start'
                >
                  <PlusCircle className='mr-1 sm:mr-2' size={18} />
                  Add Account
                </button>

                <div className='relative w-full sm:w-64'>
                  <input
                    type='text'
                    placeholder='Search User...'
                    className='border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      className='md:w-4 md:h-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='11' cy='11' r='8'></circle>
                      <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
                    </svg>
                  </div>
                </div>
              </div>

              <div className='p-2'>
                <div className='bg-green-800 p-2 rounded-t'>
                  <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>
                    User Accounts
                  </h1>
                </div>
                <div className='border border-green-800 rounded-b'>
                  <div className='overflow-x-auto max-h-[60vh]'>
                    <table className='w-full text-sm '>
                      <thead className='sticky top-0 bg-green-100 z-10'>
                        <tr className='border-b border-green-800 bg-green-100'>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Email
                          </th>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Fullname
                          </th>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Role
                          </th>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Status
                          </th>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Date Created
                          </th>
                          <th className='p-1 border-r border-green-800 text-sm font-medium'>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan='7' className='text-center py-4'>
                              Loading...
                            </td>
                          </tr>
                        ) : isError ? (
                          <tr>
                            <td
                              colSpan='7'
                              className='text-center py-4 text-red-500'
                            >
                              Error:{' '}
                              {error?.message || 'Failed to load accounts'}
                            </td>
                          </tr>
                        ) : filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan='7' className='text-center py-4'>
                              No accounts found
                            </td>
                          </tr>
                        ) : (
                          filteredAccounts.map((account) => (
                            <tr
                              key={account.userId}
                              className='border-b border-green-200'
                            >
                              <td className='p-1 pl-5 border-r border-green-200'>
                                {account.email}
                              </td>
                              <td className='p-1 pl-5 border-r border-green-200'>
                                {account.name}
                              </td>
                              <td className='p-1 border-r border-green-200 text-center'>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    account.role === 'admin'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {account.role
                                    ? account.role === 'admin'
                                      ? 'Admin'
                                      : 'Receptionist'
                                    : 'Receptionist'}
                                </span>
                              </td>
                              <td className='p-1 border-r border-green-200 text-center'>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    account.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {account.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className='p-1 border-r border-green-200 text-center'>
                                {new Date(account.createdAt).toLocaleDateString()}
                              </td>
                              <td className='p-1 text-center relative'>
                                <div
                                  ref={(el) =>
                                    (dropdownRefs.current[account.userId] = el)
                                  }
                                  className='inline-block'
                                >
                                  <button
                                    className='text-gray-600 hover:text-gray-800 p-1'
                                    onClick={(e) =>
                                      toggleDropdown(e, account.userId)
                                    }
                                  >
                                    <MoreVertical size={18} />
                                  </button>

                                  {activeDropdown === account.userId && (
                                    <div
                                      className='absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200'
                                      style={{
                                        right: windowWidth < 640 ? '220px' : '50px',
                                        ...(filteredAccounts.indexOf(account) < 2
                                          ? { 
                                              top: '100%',
                                              marginTop: '-30px'
                                            } 
                                          : { 
                                              bottom: '100%',
                                              marginBottom: '20px'
                                            }
                                        )
                                      }}
                                    >
                                      <div className='py-1'>
                                        <button 
                                          className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                                          onClick={(e) => openEditModal(e, account.userId)}
                                        >
                                          <Edit size={16} className="mr-2" />
                                          Edit User
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full relative">
            <div className="bg-green-800 rounded-t-lg text-white p-4 text-center relative">
              <h3 className="text-xl font-bold text-white text-left">Edit User</h3>
              <button
                onClick={closeEditModal}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editUserData.firstName}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={editUserData.middleName}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editUserData.lastName}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editUserData.email}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="relative">
                    <select
                      name="status"
                      value={editUserData.status}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 appearance-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 my-4"></div>
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-green-800 hover:bg-green-700 text-white py-3 px-8 rounded flex items-center justify-center"
                >
                  <Save className="mr-2" size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewAccounts
