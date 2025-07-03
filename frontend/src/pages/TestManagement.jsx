import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download, PlusCircle, X, Edit as EditIcon } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'
import { departmentAPI, testAPI } from '../services/api'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const Test = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false);
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDepartment, setTestDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [price, setPrice] = useState('');
  const [userSelectedDepartment, setUserSelectedDepartment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [isDepartmentArchived, setIsDepartmentArchived] = useState(false);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all');
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  const departmentFilterRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const dropdownRefs = useRef({});

  // React Query for departments
  const { 
    data: departmentsData = [],
    isLoading: isDepartmentsLoading,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(false);
      return response.data;
    },
    onSuccess: (departments) => {
      if (departments.length > 0 && !departmentId && !userSelectedDepartment) {
        setTestDepartment(departments[0].departmentName);
        setDepartmentId(departments[0].departmentId);
      }
    },
    onError: (error) => {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    },
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // React Query for tests
  const { 
    data: testsData = [],
    isLoading: isTestsLoading,
  } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await testAPI.getAllTests();
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    },
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Add test mutation
  const createTestMutation = useMutation({
    mutationFn: ({ testData, userId }) => testAPI.createTest(testData, userId),
    onSuccess: () => {
      toast.success('Test created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error creating test:', error);
      toast.error(error.response?.data?.message || 'Failed to create test');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ testId, newStatus, userId }) => 
      testAPI.updateTestStatus(testId, newStatus, userId),
    onSuccess: (_, variables) => {
      toast.success(`Test ${variables.newStatus === 'active' ? 'Unarchived' : 'Archived'} successfully`);
      setActiveDropdown(null);
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error updating test status:', error);
      toast.error(error.response?.data?.message || 'Failed to update test status');
    }
  });

  const updateTestMutation = useMutation({
    mutationFn: ({ testId, testData, userId }) => 
      testAPI.updateTest(testId, testData, userId),
    onSuccess: () => {
      toast.success('Test updated successfully');
      closeEditModal();
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error updating test:', error);
      toast.error(error.response?.data?.message || 'Failed to update test');
    }
  });

  // Derived state from query results
  const departments = Array.isArray(departmentsData) ? departmentsData : 
                     Array.isArray(departmentsData?.data) ? departmentsData.data : [];
  const tests = Array.isArray(testsData) ? testsData : 
                Array.isArray(testsData?.data) ? testsData.data : [];
  const isLoading = isTestsLoading;

  useEffect(() => {
    function handleClickOutside(event) {
      if (departmentFilterRef.current && !departmentFilterRef.current.contains(event.target)) {
        setShowDepartmentFilter(false);
      }
    }
    
    if (showDepartmentFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDepartmentFilter]);

  // ... existing window resize effect
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ... existing dropdown click outside effect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const openModal = () => {
    setTestName('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setUserSelectedDepartment(false); 
    if (departments.length > 0) {
      setTestDepartment(departments[0].departmentName);
      setDepartmentId(departments[0].departmentId);
    }
    setPrice('');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setUserSelectedDepartment(false);
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    if (value === 'add-department') {
      navigate('/department-management');
      return;
    }
    setTestDepartment(value);
    const selected = departments.find(dep => dep.departmentName === value);
    if (selected) {
      setDepartmentId(selected.departmentId);
      setUserSelectedDepartment(true); 
    }
  };

  const handleSubmit = async () => {
    try {
      if (!testName.trim()) {
        toast.error('Please enter a test name');
        return;
      }
      
      if (!departmentId) {
        toast.error('Please select a department');
        return;
      }
      
      if (!price || parseFloat(price) <= 0) {
        toast.error('Please enter a valid price');
        return;
      }
      
      const duplicateTest = tests.find(test => 
        test.testName.toLowerCase() === testName.toLowerCase() && 
        parseInt(test.departmentId) === parseInt(departmentId)
      );
      
      if (duplicateTest) {
        toast.error('A test with this name already exists in this department');
        return;
      }
      
      const userId = user.userId || user.id; 
            
      if (!userId) {
        console.error('User ID is missing from user object:', user);
        toast.error('Authentication error. Please log in again.');
        return;
      }
      
      const testData = {
        testName,
        departmentId,
        price: parseFloat(price),
        dateCreated: testDate,
        currentUserId: userId 
      };

      createTestMutation.mutate({ testData, userId });
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const openEditModal = (test) => {
    // Find the department to check its status
    const department = departments.find(d => d.departmentId === test.departmentId);
    const isArchived = department?.status === 'inactive';
    
    setEditingTest({
      testId: test.testId,
      testName: test.testName,
      departmentId: test.departmentId,
      price: test.price.toString(),
      status: test.status,
      dateCreated: test.dateCreated || new Date().toISOString().split('T')[0]
    });
    setTestName(test.testName);
    setTestDepartment(test.Department?.departmentName || '');
    setDepartmentId(test.departmentId);
    setPrice(parseFloat(test.price).toFixed(2));
    setTestDate(test.dateCreated ? new Date(test.dateCreated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setUserSelectedDepartment(true);
    setIsDepartmentArchived(isArchived);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingTest(null);
    setUserSelectedDepartment(false);
  };

  const handleEditSubmit = async () => {
    try {
      if (!testName.trim()) {
        toast.error('Please enter a test name');
        return;
      }

      if (!departmentId) {
        toast.error('Please select a department');
        return;
      }

      if (!price || parseFloat(price) <= 0) {
        toast.error('Please enter a valid price');
        return;
      }

      const duplicateTest = tests.find(test => 
        test.testName.toLowerCase() === testName.toLowerCase() && 
        parseInt(test.departmentId) === parseInt(departmentId) &&
        test.testId !== editingTest.testId
      );
      
      if (duplicateTest) {
        toast.error('A test with this name already exists in this department');
        return;
      }

      const userId = user.userId || user.id;
            
      if (!userId) {
        console.error('User ID is missing from user object:', user);
        toast.error('Authentication error. Please log in again.');
        return;
      }
      
      const testData = {
        testName,
        departmentId,
        price: parseFloat(price),
        status: editingTest.status,
        dateCreated: testDate,
        currentUserId: userId
      };

      updateTestMutation.mutate({ testId: editingTest.testId, testData, userId });
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const filteredTests = Array.isArray(tests) ? tests.filter(test => {
    if (!searchTerm.trim() && selectedDepartmentFilter === 'all') return true;
    
    const departmentMatch = selectedDepartmentFilter === 'all' || 
      (test.departmentId === parseInt(selectedDepartmentFilter));
    
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm.trim() || (
      test.testName?.toLowerCase?.().includes(searchTermLower) ||
      test.Department?.departmentName?.toLowerCase?.().includes(searchTermLower) ||
      test.price?.toString?.().includes(searchTerm) ||
      test.status?.toLowerCase?.().includes(searchTermLower)
    );
    
    return departmentMatch && searchMatch;
  }) : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartmentFilter]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleDropdown = (e, testId) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === testId ? null : testId);
  };

  if (isAuthenticating) {
    return null;
  }
  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab =>
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Test';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className='md:sticky md:top-0 md:h-screen z-10'>
        <Sidebar />
      </div>
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={tabsConfig} />
          {activeTab === 'Test' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
                <button onClick={openModal} className="bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                  <PlusCircle className="mr-1 sm:mr-2" size={18} />
                  Add New Test
                </button>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative" ref={departmentFilterRef}>
                    <button 
                      onClick={() => setShowDepartmentFilter(!showDepartmentFilter)}
                      className="border-2 border-green-800 bg-white text-green-800 rounded-lg px-4 py-1 md:py-2 text-sm md:text-base flex items-center w-full sm:w-auto justify-between"
                    >
                      <span>
                        {selectedDepartmentFilter === 'all' 
                          ? 'All Departments' 
                          : departments.find(d => d.departmentId === parseInt(selectedDepartmentFilter))?.departmentName || 'Select Department'}
                      </span>
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {showDepartmentFilter && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-48 max-h-60 overflow-y-auto">
                        <button 
                          onClick={() => {
                            setSelectedDepartmentFilter('all');
                            setShowDepartmentFilter(false);
                          }}
                          className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedDepartmentFilter === 'all' ? 'bg-gray-100' : ''}`}
                        >
                          All Departments
                        </button>
                        {Array.isArray(departments) ? departments.map(dept => (
                          <button 
                            key={dept.departmentId}
                            onClick={() => {
                              setSelectedDepartmentFilter(dept.departmentId.toString());
                              setShowDepartmentFilter(false);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedDepartmentFilter === dept.departmentId.toString() ? 'bg-gray-100' : ''}`}
                          >
                            {dept.departmentName}
                          </button>
                        )) : <div className="px-4 py-2 text-sm text-gray-500">No departments found</div>}
                      </div>
                    )}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search Test..."
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
              <div className="p-2">
                <div className="bg-green-800 p-2 rounded-t">
                  <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Tests</h1>
                </div>
                <div className="border border-green-800 rounded-b">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-800 bg-green-100">
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Test Name</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Department</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Price</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Date Created</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Status</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="6" className="text-center p-4">Loading...</td>
                          </tr>
                        ) : filteredTests.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center p-4">
                              {searchTerm ? 'No tests match your search' : 'No tests found'}
                            </td>
                          </tr>
                        ) : (
                          currentTests.map((test, index) => (
                            <tr key={`test-row-${test.testId}`} className="border-b border-green-200">
                              <td className="p-1 pl-5 border-r border-green-200 text-left">{test.testName}</td>
                              <td className="p-1 border-r border-green-200 text-center">{test.Department?.departmentName}</td>
                              <td className="p-1 border-r border-green-200 text-center">₱{parseFloat(test.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-1 border-r border-green-200 text-center">
                                {test.dateCreated ? new Date(test.dateCreated).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-1 border-r border-green-200 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${test.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {test.status === 'active' ? 'Unarchived' : 'Archived'}
                                </span>
                              </td>
                              <td className="p-1 border-r border-green-200 text-center">
                                <div className="flex justify-center relative">
                                  <button 
                                    onClick={(e) => toggleDropdown(e, test.testId)} 
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                  >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" strokeWidth="2" fill="none" 
                                         strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="1"></circle>
                                      <circle cx="12" cy="5" r="1"></circle>
                                      <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                  </button>
                                  
                                  {activeDropdown === test.testId && (
                                    <div 
                                      ref={(el) => (dropdownRefs.current[test.testId] = el)}
                                      className="absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200 top-0 right-1/2 mr-2.5"
                                    >
                                      <div className="py-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation(); // Stop event propagation
                                            setActiveDropdown(null);
                                            openEditModal(test);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                                        >
                                          <EditIcon size={16} className="mr-2" />
                                          Edit Test
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                        {!isLoading && currentTests.length > 0 && currentTests.length < itemsPerPage && (
                          [...Array(itemsPerPage - currentTests.length)].map((_, index) => (
                            <tr key={`empty-row-${index}`} className="border-b border-green-200">
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                              <td className="p-1 border-r border-green-200">&nbsp;</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {filteredTests.length > itemsPerPage && (
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
                          let startPage = Math.max(1, currentPage - 1);
                          let endPage = Math.min(totalPages, startPage + 2);
                          
                          if (endPage - startPage < 2 && startPage > 1) {
                            startPage = Math.max(1, endPage - 2);
                          }
                          
                          const pageNumbers = [];
                          for (let i = startPage; i <= endPage; i++) {
                            pageNumbers.push(i);
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
                          ));
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
                
                <div className="mt-2 flex flex-col md:flex-row justify-end p-2">
                  <div className="flex flex-wrap items-center mb-4 md:mb-0">
                    <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                      Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="fixed inset-0 flex items-start pt-20 justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-full max-w-md rounded shadow-lg">
                      <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center">
                        <h3 className="text-xl font-medium">New Test</h3>
                        <button onClick={closeModal} className="text-white hover:text-gray-200">
                          <X size={24} />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Test Name</label>
                            <input
                              type="text"
                              value={testName}
                              onChange={(e) => setTestName(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2"
                              placeholder="Enter test name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Date Created</label>
                            <div className="relative" onClick={() => document.getElementById('new-test-date').showPicker()}>
                              <input
                                id="new-test-date"
                                type="date"
                                value={testDate}
                                onChange={(e) => setTestDate(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                              />
                             
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Test Department</label>
                            <div className="relative">
                              <select
                                value={testDepartment}
                                onChange={handleDepartmentChange}
                                className="w-full border border-gray-300 rounded p-2 appearance-none"
                                required
                              >
                                {Array.isArray(departments) ? departments.map(dept => (
                                  <option key={dept.departmentId} value={dept.departmentName}>{dept.departmentName}</option>
                                )) : <option value="">No departments available</option>}
                                <option value="add-department">+ Add Department</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Price</label>
                            <input
                              type="text"
                              value={price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value) || value === '') {
                                  setPrice(value);
                                }
                              }}
                              className="w-full border border-gray-300 rounded p-2 text-right"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        <div className="border-t border-gray-300 my-4"></div>
                        <div className="flex justify-center">
                          <button
                            onClick={handleSubmit}
                            disabled={createTestMutation.isPending}
                            className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
                          >
                            {createTestMutation.isPending ? 'Creating...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editModalOpen && editingTest && (
                  <div className="fixed inset-0 flex items-start pt-20 justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-full max-w-md rounded shadow-lg">
                      <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center">
                        <h3 className="text-xl font-medium">Edit Test</h3>
                        <button onClick={closeEditModal} className="text-white hover:text-gray-200">
                          <X size={24} />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Test Name</label>
                            <input
                              type="text"
                              value={testName}
                              onChange={(e) => setTestName(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2"
                              placeholder="Enter test name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Date Created</label>
                            <div className="relative" onClick={() => document.getElementById('edit-test-date').showPicker()}>
                              <input
                                id="edit-test-date"
                                type="date"
                                value={testDate}
                                onChange={(e) => setTestDate(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                              />
                             
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Test Department</label>
                            <div className="relative">
                              <select
                                value={testDepartment}
                                onChange={handleDepartmentChange}
                                className="w-full border border-gray-300 rounded p-2 appearance-none"
                                required
                              >
                                {departments.map(dept => (
                                  <option key={dept.departmentId} value={dept.departmentName}>{dept.departmentName}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-800 font-medium mb-1">Price</label>
                            <input
                              type="text"
                              value={price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value) || value === '') {
                                  setPrice(value);
                                }
                              }}
                              className="w-full border border-gray-300 rounded p-2 text-right"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        <div>
                            <label className="block text-green-800 font-medium mb-1">Status</label>
                            <div className="relative">
                              <select
                                value={editingTest.status}
                                onChange={(e) => setEditingTest({...editingTest, status: e.target.value})}
                                className={`w-full border border-gray-300 rounded p-2 appearance-none ${isDepartmentArchived ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                disabled={isDepartmentArchived}
                              >
                                <option value="active">Unarchived</option>
                                <option value="inactive">Archived</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                              </div>
                            </div>
                            {isDepartmentArchived && (
                              <div className="mt-1 text-xs text-red-600">
                                Note: Status cannot be changed because this test's department is archived.
                              </div>
                            )}
                          </div>
                        <div className="border-t border-gray-300 my-4"></div>
                        <div className="flex justify-center">
                          <button
                            onClick={handleEditSubmit}
                            disabled={updateTestMutation.isPending}
                            className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
                          >
                            {updateTestMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Test;