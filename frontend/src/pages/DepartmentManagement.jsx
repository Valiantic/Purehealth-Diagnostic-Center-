import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
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

  // Add click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterOptions(false);
      }
    }
    
    // Add event listener when dropdown is open
    if (showFilterOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterOptions]);

  // Use React Query for fetching departments
  const { 
    data: departments = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      // Add timestamp to prevent caching
      const response = await departmentAPI.getAllDepartments(true);
      return response.data;
    },
    staleTime: 10000, // 10 seconds before considering data stale
    refetchInterval: 15000, // Automatically refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2
  })

  // Mutation for adding departments
  const addDepartmentMutation = useMutation({
    mutationFn: (departmentName) => departmentAPI.createDepartment(departmentName, user.userId),
    onSuccess: () => {
      // Invalidate the departments query to refetch
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department added successfully')
      setNewDepartment('')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add department')
    }
  })

  // Mutation for updating department status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => departmentAPI.updateDepartmentStatus(id, status, user.userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      const statusMessage = variables.status === 'active' ? 'activated' : 'deactivated'
      toast.success(`Department successfully ${statusMessage}`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update department status')
    }
  })

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) {
      return;
    }
    
    addDepartmentMutation.mutate(newDepartment.trim());
  }

  // filter departments
  const filteredDepartments = departments.filter(dept => 
    dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(dept.testQuantity).includes(searchTerm) ||
    new Date(dept.createdAt).toLocaleDateString().includes(searchTerm)
  )

  // Apply sorting based on filter option
  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    switch (filterOption) {
      case 'highest':
        return b.testQuantity - a.testQuantity;
      case 'lowest':
        return a.testQuantity - b.testQuantity;
      default:
        // Default sorting by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Apply pagination to sorted departments
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDepartments = sortedDepartments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedDepartments.length / itemsPerPage)

  // Reset to first page when search term or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterOption])

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (isAuthenticating) {
    return null;
  }
  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Departments';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        
        <div className='md:sticky md:top-0 md:h-screen z-10'>
            <Sidebar />
        </div>

        <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
            {/* Use the TabNavigation component */}
            <TabNavigation tabsConfig={tabsConfig} />
            
            {/* Content based on active tab */}
            {activeTab === 'Departments' && (
              <>
                {/* Error Messages */}
                {isError && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error?.message || 'An error occurred'}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
                  {/* New Department Input and Button */}
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

                  {/* Search and Filter Section */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

                      {/* Filter Dropdown */}
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
                              setFilterOption('default');
                              setShowFilterOptions(false);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'default' ? 'bg-gray-100' : ''}`}
                          >
                            Default Order
                          </button>
                          <button 
                            onClick={() => {
                              setFilterOption('highest');
                              setShowFilterOptions(false);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'highest' ? 'bg-gray-100' : ''}`}
                          >
                            Highest Test Quantity
                          </button>
                          <button 
                            onClick={() => {
                              setFilterOption('lowest');
                              setShowFilterOptions(false);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterOption === 'lowest' ? 'bg-gray-100' : ''}`}
                          >
                            Lowest Test Quantity
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Search Input */}
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
                    <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Departments</h1>
                  </div>
                  <div className="border border-green-800 rounded-b">
                    {/* Table container - without pagination */}
                    <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
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
                                    {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                                  </span>
                                </td>
                                <td className="p-1 border-r border-green-200 text-center">
                                  <button 
                                    className={`px-2 py-1 rounded text-xs ${dept.status === 'active' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                                    onClick={() => updateStatusMutation.mutate({
                                      id: dept.departmentId,
                                      status: dept.status === 'active' ? 'inactive' : 'active'
                                    })}
                                    disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === dept.departmentId}
                                  >
                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.id === dept.departmentId
                                      ? 'Updating...'
                                      : dept.status === 'active' ? 'Deactivate' : 'Activate'
                                    }
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Pagination - moved outside table border but inside white container */}
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
                          {[...Array(totalPages)].map((_, index) => (
                            <li key={index}>
                              <button
                                onClick={() => paginate(index + 1)}
                                className={`px-3 py-1 border-t border-b border-gray-300 ${
                                  currentPage === index + 1 
                                    ? 'bg-green-800 text-white' 
                                    : 'bg-white text-green-800 hover:bg-green-50'
                                }`}
                              >
                                {index + 1}
                              </button>
                            </li>
                          ))}
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
                  
                  {/* Generate Report button */}
                  <div className="mt-4 flex flex-col md:flex-row justify-end">
                    <div className="flex flex-wrap items-center mb-4 md:mb-0">
                      <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                        Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                      </button>
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

export default Department
