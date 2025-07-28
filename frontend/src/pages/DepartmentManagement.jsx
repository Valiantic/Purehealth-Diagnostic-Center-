import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, X, Edit as EditIcon } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import useAuth from '../hooks/auth/useAuth'
import TabNavigation from '../components/dashboard/TabNavigation'
import tabsConfig from '../config/tabsConfig'
import { departmentAPI } from '../services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Department = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [newDepartment, setNewDepartment] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(7)
  const [filterOption, setFilterOption] = useState('default')
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const filterRef = useRef(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [departmentName, setDepartmentName] = useState('')
  const [departmentDate, setDepartmentDate] = useState('')
  const [departmentStatus, setDepartmentStatus] = useState('active')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const dropdownRefs = useRef({})

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterOptions(false)
      }
    }

    if (showFilterOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterOptions])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const {
    data: departmentsData = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(true);
      return response;
    },
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2
  });
  
  // First check if it's directly an array, if not extract from the nested structure
  const departments = Array.isArray(departmentsData) ? departmentsData : 
                    departmentsData?.data?.success ? departmentsData.data.data : 
                    departmentsData?.data ? departmentsData.data : [];
  

  const addDepartmentMutation = useMutation({
    mutationFn: (departmentName) => departmentAPI.createDepartment(departmentName, user.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department added successfully')
      setNewDepartment('')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add department')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => departmentAPI.updateDepartmentStatus(id, status, user.userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      const statusMessage = variables.status === 'active' ? 'unarchived' : 'archived'
      toast.success(`Department successfully ${statusMessage}`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update department status')
    }
  })

  const updateDepartmentMutation = useMutation({
    mutationFn: (departmentData) => departmentAPI.updateDepartment(
      departmentData.id,
      departmentData.name,
      departmentData.dateCreated,
      departmentData.status,
      user.userId
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department updated successfully')
      closeEditModal()
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update department')
    }
  })

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) {
      return
    }

    addDepartmentMutation.mutate(newDepartment.trim())
  }

  const filteredDepartments = departments.filter(dept =>
    dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(dept.testQuantity).includes(searchTerm) ||
    new Date(dept.createdAt).toLocaleDateString().includes(searchTerm)
  )

  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    switch (filterOption) {
      case 'highest':
        return b.testQuantity - a.testQuantity
      case 'lowest':
        return a.testQuantity - b.testQuantity
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDepartments = sortedDepartments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedDepartments.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterOption])

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const toggleDropdown = (e, departmentId) => {
    e.stopPropagation() // Stop event propagation
    setActiveDropdown(activeDropdown === departmentId ? null : departmentId)
  }

  const openEditModal = (department) => {
    setEditingDepartment(department)
    setDepartmentName(department.departmentName)
    setDepartmentDate(new Date(department.createdAt).toISOString().split('T')[0])
    setDepartmentStatus(department.status)
    setEditModalOpen(true)
    setActiveDropdown(null)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingDepartment(null)
  }

  const handleEditSubmit = () => {
    if (!departmentName.trim()) {
      toast.error('Department name is required')
      return
    }

    const duplicateDepartment = departments.find(
      dept => dept.departmentName.toLowerCase() === departmentName.toLowerCase() &&
              dept.departmentId !== editingDepartment.departmentId
    )

    if (duplicateDepartment) {
      toast.error('Department name already exists')
      return
    }

    updateDepartmentMutation.mutate({
      id: editingDepartment.departmentId,
      name: departmentName,
      dateCreated: departmentDate,
      status: departmentStatus,
    })
  }

  if (isAuthenticating) {
    return null
  }
  if (!user) {
    return null
  }

  const currentPath = location.pathname
  const activeTab = tabsConfig.find(tab =>
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Departments'

  return (
    <div className='flex flex-col md:flex-row h-screen'>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        
        <div className='md:sticky md:top-0 md:h-screen z-10'>
            <Sidebar />
        </div>

        <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
            <TabNavigation tabsConfig={tabsConfig} />
            
            {activeTab === 'Departments' && (
              <>
                {isError && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error?.message || 'An error occurred'}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Enter new department..."
                      className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base pr-16"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                    />
                    <button 
                      className="absolute right-0 top-0 bottom-0 bg-green-800 text-white px-4 rounded-r-lg text-sm md:text-base hover:bg-green-600 h-full"
                      onClick={handleAddDepartment}
                      disabled={addDepartmentMutation.isPending}
                    >
                      {addDepartmentMutation.isPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative" ref={filterRef}>
                      <button 
                        onClick={() => setShowFilterOptions(!showFilterOptions)}
                        className="border-2 border-green-800 bg-white text-green-800 rounded-lg px-4 py-1 md:py-2 text-sm md:text-base flex items-center w-full sm:w-auto justify-between"
                      >
                        <span>
                          {filterOption === 'highest' 
                            ? 'Highest Tests' 
                            : filterOption === 'lowest' 
                              ? 'Lowest Tests' 
                              : 'Filter By'}
                        </span>
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {showFilterOptions && (
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-48">
                          <button 
                            onClick={() => {
                              setFilterOption('default')
                              setShowFilterOptions(false)
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'default' ? 'bg-gray-100' : ''}`}
                          >
                            Default Order
                          </button>
                          <button 
                            onClick={() => {
                              setFilterOption('highest')
                              setShowFilterOptions(false)
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'highest' ? 'bg-gray-100' : ''}`}
                          >
                            Highest Test Quantity
                          </button>
                          <button 
                            onClick={() => {
                              setFilterOption('lowest')
                              setShowFilterOptions(false)
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'lowest' ? 'bg-gray-100' : ''}`}
                          >
                            Lowest Test Quantity
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search Department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                    </div>
                    
                  </div>
                </div>
    
                <div className="p-2 mt-2">
                  <div className="bg-green-800 p-2 rounded-t">
                    <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Test Departments</h1>
                  </div>
                  <div className="border border-green-800 rounded-b">
                    <div className="overflow-x-auto max-h-[calc(100vh-380px)]">
                      <table className="w-full text-sm">
                        <thead className='sticky top-0 bg-green-100 z-10'>
                          <tr className="border-b border-green-800 bg-green-100">
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Department Name</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Test Quantity</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Date Created</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Status</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan="5" className="text-center p-4">Loading departments...</td>
                            </tr>
                          ) : filteredDepartments.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center p-4">
                                {searchTerm ? 'No departments match your search' : 'No departments found'}
                              </td>
                            </tr>
                          ) : (
                            currentDepartments.map((dept) => (
                              <tr key={dept.departmentId} className="border-b border-green-200">
                                <td className="p-1 pl-5 border-r border-green-200 text-left">{dept.departmentName}</td>
                                <td className="p-1 border-r border-green-200 text-center">{dept.testQuantity}</td>
                                <td className="p-1 border-r border-green-200 text-center">{new Date(dept.createdAt).toLocaleDateString()}</td>
                                <td className="p-1 border-r border-green-200 text-center">
                                  <span className={`px-2 py-1 rounded text-xs ${dept.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {dept.status === 'active' ? 'Unarchived' : 'Archived'}
                                  </span>
                                </td>
                                <td className="p-1 border-r border-green-200 text-center">
                                  <div className="flex justify-center relative">
                                    <button 
                                      onClick={(e) => toggleDropdown(e, dept.departmentId)} 
                                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" strokeWidth="2" fill="none" 
                                           strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                      </svg>
                                    </button>
                                    
                                    {activeDropdown === dept.departmentId && (
                                      <div 
                                        ref={(el) => (dropdownRefs.current[dept.departmentId] = el)}
                                        className="absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200 top-0 right-1/2 mr-2.5"
                                      >
                                        <div className="py-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation() // Stop event propagation
                                              openEditModal(dept)
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                                          >
                                            <EditIcon size={16} className="mr-2" />
                                            Edit Department
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
                  
                  {filteredDepartments.length > itemsPerPage && (
                    <div className="flex justify-center mt-4">
                      <nav>
                        <ul className="flex list-none">
                          <li>
                            <button 
                              onClick={() => paginate(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className={`px-3 py-1 border border-gray-300 rounded-l ${
                                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-green-800 hover:bg-green-50'
                              }`}
                            >
                              Prev
                            </button>
                          </li>
                          {(() => {
                            let startPage = Math.max(1, currentPage - 1)
                            let endPage = Math.min(totalPages, startPage + 2)
                                    
                            if (endPage - startPage < 2 && startPage > 1) {
                              startPage = Math.max(1, endPage - 2)
                            }
                            
                            const pageNumbers = []
                            for (let i = startPage; i <= endPage; i++) {
                              pageNumbers.push(i)
                            }
                            
                            return pageNumbers.map(number => (
                              <li key={number}>
                                <button
                                  onClick={() => paginate(number)}
                                  className={`px-3 py-1 border-t border-b border-gray-300 ${
                                    currentPage === number 
                                      ? 'bg-green-800 text-white' 
                                      : 'bg-white text-green-800 hover:bg-green-50'
                                  }`}
                                >
                                  {number}
                                </button>
                              </li>
                            ))
                          })()}
                          <li>
                            <button 
                              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className={`px-3 py-1 border border-gray-300 rounded-r ${
                                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-green-800 hover:bg-green-50'
                              }`}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-col md:flex-row justify-end">
                    <div className="flex flex-wrap items-center mb-4 md:mb-0">
                      <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                        Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {editModalOpen && editingDepartment && (
                  <div className="fixed inset-0 flex items-start pt-20 justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-full max-w-md rounded shadow-lg">
                      <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center">
                        <h3 className="text-xl font-medium">Edit Department</h3>
                        <button onClick={closeEditModal} className="text-white hover:text-gray-200">
                          <X size={24} />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Department Name</label>
                            <input
                              type="text"
                              value={departmentName}
                              onChange={(e) => setDepartmentName(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2"
                              placeholder="Enter department name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Date Created</label>
                            <div className="relative" onClick={() => document.getElementById('edit-dept-date').showPicker()}>
                              <input
                                id="edit-dept-date"
                                type="date"
                                value={departmentDate}
                                onChange={(e) => setDepartmentDate(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Status</label>
                            <div className="relative">
                              <select
                                value={departmentStatus}
                                onChange={(e) => setDepartmentStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 appearance-none"
                              >
                                <option value="active">Unarchived</option>
                                <option value="inactive">Archived</option>
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
                            onClick={handleEditSubmit}
                            disabled={updateDepartmentMutation.isPending}
                            className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
                          >
                            {updateDepartmentMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </div>
  )
}

export default Department
