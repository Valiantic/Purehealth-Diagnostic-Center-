import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { testAPI, departmentAPI } from '../services/api'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AddIncome = () => {
  const { user, isAuthenticating } = useAuth()
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const deptFilterRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: 'Juan Ponce',
    lastName: 'Enrile',
    birthDate: '24-Mar-2024',
    id: 'Person with Disability',
    referrer: 'Dr. Kepweng',
    sex: 'Male'
  });

  const [searchTest, setSearchTest] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [testsTable, setTestsTable] = useState([]);

  // Fetch tests data
  const {
    data: testsData = { data: [] },
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await testAPI.getAllTests(true)
      return response || { data: [] }
    },
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2
  });

  const tests = Array.isArray(testsData) ? testsData : 
                Array.isArray(testsData.data) ? testsData.data : [];

  // Fetch departments data
  const {
    data: departmentsData = { data: [] },
    isLoadingDepts,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(true)
      return response || { data: [] }
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const departments = Array.isArray(departmentsData) ? departmentsData : 
                     Array.isArray(departmentsData.data) ? departmentsData.data : [];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test?.testName?.toLowerCase?.().includes(searchTest.toLowerCase()) || false;
    const matchesDepartment = selectedDepartment ? 
                            test?.departmentId === selectedDepartment : true;
    return matchesSearch && matchesDepartment;
  });

  const handleSelectTest = (test) => {
    // Check if this test is already selected
    const isAlreadySelected = selectedTests.some(t => t.testId === test.testId);
    
    if (isAlreadySelected) {
      // Remove the test if it's already selected
      const testIndex = selectedTests.findIndex(t => t.testId === test.testId);
      
      const newSelectedTests = [...selectedTests];
      newSelectedTests.splice(testIndex, 1);
      setSelectedTests(newSelectedTests);
      
      const newTestsTable = [...testsTable];
      newTestsTable.splice(testIndex, 1);
      setTestsTable(newTestsTable);
    } else {
      // Add the test if it's not selected
      const newTest = {
        testId: test.testId,
        name: test.testName,
        disc: '20%',
        cash: test.price || '250.0',
        gCash: test.price || '250.0',
        bal: test.price || '250.0'
      };
      
      setSelectedTests([...selectedTests, test]);
      setTestsTable([...testsTable, newTest]);
    }
  };

  // Clear all tests
  const handleClearAll = () => {
    setSelectedTests([]);
    setTestsTable([]);
  };
  
  // Remove a specific test by index
  const handleRemoveTest = (index) => {
    
    const newSelectedTests = [...selectedTests];
    const newTestsTable = [...testsTable];
    newSelectedTests.splice(index, 1);
    newTestsTable.splice(index, 1);
    setSelectedTests(newSelectedTests);
    setTestsTable(newTestsTable);
  };
 
  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
  if (!user) {
    return null;
  }

  // Handle department selection
  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId === selectedDepartment ? null : deptId);
    setShowDeptFilter(false);
  };

  // Toggle department filter
  const toggleDeptFilter = () => {
    setShowDeptFilter(!showDeptFilter);
  };

  // Close department filter when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (deptFilterRef.current && !deptFilterRef.current.contains(event.target)) {
        setShowDeptFilter(false);
      }
    }

    if (showDeptFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDeptFilter]);

  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen p-4">
    <Sidebar/>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    
    {/* Main content */}
    <div className="flex flex-col lg:flex-row gap-4">
      
      {/* Left side - already built sidebar placeholder */}
      <div className="hidden lg:block w-64">
        {/* Sidebar is already built according to requirements */}
      </div>
      
      {/* Right side - transaction form */}
      <div className="flex-1">
        {/* Patient Information Card */}
        <div className="bg-cream-50 border-2 border-green-800 rounded-lg overflow-hidden mb-4">
          <div className="bg-green-800 text-white p-3">
            <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Add Transaction</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-green-800 font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                />
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                />
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">ID</label>
                <select
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Person with Disability</option>
                  <option>Senior Citizen</option>
                  <option>Regular</option>
                </select>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Referrer</label>
                <select
                  value={formData.referrer}
                  onChange={(e) => setFormData({...formData, referrer: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Dr. Kepweng</option>
                  <option>Dr. Santos</option>
                  <option>Dr. Reyes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Birth Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full border-2 border-green-800 rounded p-2"
                    />
                  <span className="absolute right-2 top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Two column layout for Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Add Test Column */}
          <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
            <div className="bg-green-800 text-white p-3">
              <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">
                Select Test {selectedDepartment ? 
                  `- ${departments.find(d => d.departmentId === selectedDepartment)?.departmentName || ''}` : 
                  '(All Departments)'}
              </h2>
            </div>
            
            <div className="p-4">
              {/* Inside the search box section */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search for test..."
                  value={searchTest}
                  onChange={(e) => setSearchTest(e.target.value)}
                  className="w-full border rounded p-2 pl-3 pr-10"
                />

                <span className="absolute right-10 top-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <span 
                  className="absolute right-3 top-2.5 cursor-pointer" 
                  onClick={toggleDeptFilter}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </span>

                {/* Department Filter Dropdown */}
                {showDeptFilter && (
                  <div 
                    ref={deptFilterRef}
                    className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto"
                  >
                    <div className="p-2 bg-green-800 text-white sticky top-0">
                      <h3 className="font-medium">Filter by Department</h3>
                    </div>
                    <div className="p-2 hover:bg-green-100 cursor-pointer" onClick={() => handleDepartmentSelect(null)}>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full border-2 border-green-800 mr-2 ${!selectedDepartment ? 'bg-green-800' : ''}`}>
                          {!selectedDepartment && <span className="text-white text-xs">✓</span>}
                        </span>
                        <span>All Departments</span>
                      </div>
                    </div>
                    {isLoadingDepts ? (
                      <div className="p-3 text-center text-gray-500">Loading departments...</div>
                    ) : (
                      departments.map(dept => (
                        <div 
                          key={dept.departmentId} 
                          className="p-2 hover:bg-green-100 cursor-pointer"
                          onClick={() => handleDepartmentSelect(dept.departmentId)}
                        >
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full border-2 border-green-800 mr-2 ${selectedDepartment === dept.departmentId ? 'bg-green-800' : ''}`}>
                              {selectedDepartment === dept.departmentId && <span className="text-white text-xs">✓</span>}
                            </span>
                            <span>{dept.departmentName}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="text-center py-4">Loading tests...</div>
              ) : isError ? (
                <div className="text-center py-4 text-red-500">
                  Error loading tests: {error?.message || 'Unknown error'}
                </div>
              ) : (
                <div className="h-72 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 content-start">
                    {filteredTests.length === 0 ? (
                      <p className="text-gray-500 col-span-2 text-center py-2">No tests match your search</p>
                    ) : (
                      filteredTests.map((test) => {
                        // Check if this test is already selected
                        const isSelected = selectedTests.some(t => t.testId === test.testId);
                        return (
                          <div 
                            key={test.testId} 
                            className={`flex items-center ${isSelected ? 'bg-green-200' : 'bg-green-100'} border border-green-300 rounded-lg p-2 cursor-pointer h-auto`}
                            onClick={() => handleSelectTest(test)}
                          >
                            {isSelected ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-800 text-white text-xs mr-1">✓</span>
                            ) : (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-green-800 text-green-800 text-xs mr-1"></span>
                            )}
                            <span className="flex-1 text-green-800">{test.testName}</span>
                            <button className="text-green-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tests Conducted Column */}
          <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
            <div className="bg-green-800 text-white p-3">
              <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Test Registration Summary</h2>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto h-72 overflow-y-auto">
                <table className="w-full min-w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-green-100 text-left border-b py-2 px-4 text-green-800">
                      <th className="px-2 py-1 text-sm">Name</th>
                      <th className="px-2 py-1 text-sm">Disc.</th>
                      <th className="px-2 py-1 text-sm">Cash</th>
                      <th className="px-2 py-1 text-sm">GCash</th>
                      <th className="px-2 py-1 text-sm">Bal.</th>
                      <th className="px-2 py-1 text-sm">Opt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testsTable.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-4">No tests selected</td>
                      </tr>
                    ) : (
                      testsTable.map((test, index) => (
                        <tr key={index} className="border-b text-sm">
                          <td className="px-2 py-1">{test.name}</td>
                          <td className="px-2 py-1">{test.disc}</td>
                          <td className="px-2 py-1">{test.cash}</td>
                          <td className="px-2 py-1">{test.gCash}</td>
                          <td className="px-2 py-1">{test.bal}</td>
                          <td className="px-2 py-1">
                            <button 
                              className="text-green-800"
                              onClick={() => handleRemoveTest(index)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {testsTable.length > 0 && (
                      <tr className="bg-green-100 font-bold">
                        <td className="px-2 py-1 text-left text-green-800">TOTAL:</td>
                        <td className="px-2 py-1 text-left text-green-800">20%</td>                      
                        <td className="px-2 py-1 text-left text-green-800">
                          {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.cash) || 0), 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-2 py-1 text-left text-green-800">
                          {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.gCash) || 0), 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-2 py-1 text-left text-green-800">--</td>
                        <td className="px-2 py-1 text-left text-green-800"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
                  onClick={handleClearAll}
                  disabled={testsTable.length === 0}
                >
                  Clear
                </button>
                <button 
                  className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded"
                  disabled={testsTable.length === 0}
                >
                  Process Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default AddIncome
