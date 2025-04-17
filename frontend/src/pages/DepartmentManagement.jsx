import React, { useState } from 'react'
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

  // Use React Query for fetching departments
  const { 
    data: departments = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments();
      return response.data;
    },
    staleTime: 60000, // 1 minute before refetching
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

  // filter deparments
  const filteredDepartments = departments.filter(dept => 
    dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(dept.testQuantity).includes(searchTerm) ||
    new Date(dept.createdAt).toLocaleDateString().includes(searchTerm)
  )

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
    
                <div className="p-2">
                  <div className="bg-green-800 p-2 rounded-t">
                    <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Departments</h1>
                  </div>
                  <div className="border border-green-800 rounded-b">
                    <div className="overflow-x-auto max-h-[60vh]">
                      <table className="w-full text-sm">
                        <thead className='sticky top-0 bg-green-100 z-10'>
                          <tr className="border-b border-green-800 bg-green-100">
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Department Name</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Test Quantity</th>
                            <th className="p-1 border-r border-green-800 text-sm font-medium">Created</th>
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
                            filteredDepartments.map((dept) => (
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
                  
                  {/* Move the Generate Report button outside the border container */}
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
