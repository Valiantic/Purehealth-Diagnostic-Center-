import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { testAPI, departmentAPI, referrerAPI } from '../services/api'
import { ToastContainer, toast } from 'react-toastify'
import { X } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css'

const AddIncome = () => {
  const navigate = useNavigate();
  const { user, isAuthenticating } = useAuth()
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const deptFilterRef = useRef(null);
  const dropdownRef = useRef(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Add state to track currently selected test for modal
  const [selectedModalTest, setSelectedModalTest] = useState(null);
  const [basePrice, setBasePrice] = useState(0); 
  const [price, setPrice] = useState(0); 
  const [discount, setDiscount] = useState(20); 
  const [cashPaid, setCashPaid] = useState(0); 
  const [gCashPaid, setGCashPaid] = useState(0); 
  
  const [discountedPrice, setDiscountedPrice] = useState(0); 
  const [balance, setBalance] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',  // Keep as empty string initially
    id: 'Person with Disability',
    referrer: '',
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

  // Fetch referrers data with direct approach
  const {
    data: referrersData,
    isLoadingReferrers,
    isErrorReferrers,
    error: referrerError
  } = useQuery({
    queryKey: ['referrers'],
    queryFn: async () => {
      try {
        const response = await referrerAPI.getAllReferrers(true);
        return response;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  // Filter data to only show active items
  const tests = Array.isArray(testsData) ? testsData : 
                Array.isArray(testsData.data) ? testsData.data : [];
  
  const departments = Array.isArray(departmentsData) ? departmentsData : 
                     Array.isArray(departmentsData.data) ? departmentsData.data : [];
   
  // Get referrers and filter to only show active ones
  const allReferrers = referrersData?.data?.data || [];
  const referrers = allReferrers.filter(referrer => referrer.status === 'active');

  // Filter tests based on search terms and selected department
  const filteredTests = tests.filter(test => {
    const matchesSearch = test?.testName?.toLowerCase?.().includes(searchTest.toLowerCase()) || false;
    const matchesDepartment = selectedDepartment ? 
                            test?.departmentId === selectedDepartment : true;
    // Only include active tests
    const isActive = test.status === 'active';
    return matchesSearch && matchesDepartment && isActive;
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
      
      const testPrice = parseFloat(test.price) || 0;
      const roundedPrice = roundToTwoDecimals(testPrice);
      const newTest = {
        testId: test.testId,
        name: test.testName,
        disc: '0%',
        cash: roundedPrice.toFixed(2), 
        gCash: '0.00', 
        bal: '0.00' 
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

  // Handle department selection
  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId === selectedDepartment ? null : deptId);
    setShowDeptFilter(false);
  };

  // Toggle department filter
  const toggleDeptFilter = () => {
    setShowDeptFilter(!showDeptFilter);
  };

  // Modified toggle dropdown function to work with specific test ID
  const toggleDropdown = (testId, e) => {
    e.stopPropagation();
    setActiveDropdownId(prevId => prevId === testId ? null : testId);
  };

  // Fix precision issues with calculations
  const roundToTwoDecimals = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  // Update openModal to set up a simpler state with proper rounding
  const openModal = (test) => {
    setSelectedModalTest(test);
    const testPrice = parseFloat(test.price) || 0;
    const roundedPrice = roundToTwoDecimals(testPrice);
    
    setBasePrice(roundedPrice); 
    setPrice(roundedPrice); 
    
    // Reset all other values
    setDiscount(0);
    setDiscountedPrice(roundedPrice); 
    setBalance(roundedPrice);
    setCashPaid(0);
    setGCashPaid(0);
    
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedModalTest(null);
  };

  // Modified handlers to update the price dynamically with proper rounding
  const handleDiscountChange = (value) => {
    const discountValue = parseInt(value) || 0;
    setDiscount(discountValue);
    
    // Calculate new discounted price with proper rounding
    const discounted = roundToTwoDecimals(basePrice * (1 - discountValue/100));
    setDiscountedPrice(discounted);
    
    // Update displayed price and balance to reflect discount
    const newBalance = roundToTwoDecimals(Math.max(0, discounted - cashPaid - gCashPaid));
    setBalance(newBalance);
    setPrice(newBalance);
  };

  const handleCashPaidChange = (value) => {
    // Parse the entered value
    const cashValue = parseFloat(value) || 0;
    
    // Check if the total payment would exceed the discounted price
    if (cashValue + gCashPaid > discountedPrice) {
      // Limit cash payment to the remaining amount (with proper rounding)
      const maxAllowed = roundToTwoDecimals(Math.max(0, discountedPrice - gCashPaid));
      setCashPaid(maxAllowed);
      
      // Update the displayed price - should be 0 at this point
      setBalance(0);
      setPrice(0);
      
      // Optionally show a toast notification
      toast.info("Payment amount cannot exceed the price");
    } else {
      // If within limits, set the value normally
      setCashPaid(cashValue);
      
      // Update the displayed price with proper rounding
      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashValue - gCashPaid));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const handleGCashPaidChange = (value) => {
    // Parse the entered value
    const gCashValue = parseFloat(value) || 0;
    
    // Check if the total payment would exceed the discounted price
    if (cashPaid + gCashValue > discountedPrice) {
      // Limit GCash payment to the remaining amount (with proper rounding)
      const maxAllowed = roundToTwoDecimals(Math.max(0, discountedPrice - cashPaid));
      setGCashPaid(maxAllowed);
      
      // Update the displayed price - should be 0 at this point
      setBalance(0);
      setPrice(0);
      
      // Optionally show a toast notification
      toast.info("Payment amount cannot exceed the price");
    } else {
      // If within limits, set the value normally
      setGCashPaid(gCashValue);
      
      // Update the displayed price with proper rounding
      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashPaid - gCashValue));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  // Add confirmation handler with validation and handling for empty payment
  const handleConfirmPayment = () => {
    if (!selectedModalTest) return;
    
    // Check if payment exceeds the discounted price
    if (cashPaid + gCashPaid > discountedPrice) {
      toast.error("Total payment cannot exceed the price");
      return;
    }
    
    // Calculate final values with proper rounding
    const finalDiscount = discount;
    const finalDiscountedPrice = roundToTwoDecimals(discountedPrice);
    
    // Handle case where user only provided discount (no payment details)
    let finalCash = roundToTwoDecimals(cashPaid);
    let finalGCash = roundToTwoDecimals(gCashPaid);
    let finalBalance = roundToTwoDecimals(balance);
    
    // If user only set discount but didn't enter payments, put the full amount in cash
    if (finalCash === 0 && finalGCash === 0 && discount > 0) {
      finalCash = finalDiscountedPrice;
      finalBalance = 0;
    }
    
    // Check if test is already in the selected tests
    const testIndex = selectedTests.findIndex(t => t.testId === selectedModalTest.testId);
    
    // Create the updated test object with payment details
    const updatedTest = {
      testId: selectedModalTest.testId,
      name: selectedModalTest.testName,
      disc: `${finalDiscount}%`,
      cash: finalCash.toFixed(2),
      gCash: finalGCash.toFixed(2),
      bal: finalBalance.toFixed(2)
    };
    
    if (testIndex >= 0) {
      // Update existing test
      const newSelectedTests = [...selectedTests];
      const newTestsTable = [...testsTable];
      
      newSelectedTests[testIndex] = selectedModalTest;
      newTestsTable[testIndex] = updatedTest;
      
      setSelectedTests(newSelectedTests);
      setTestsTable(newTestsTable);
    } else {
      // Add as new test
      setSelectedTests([...selectedTests, selectedModalTest]);
      setTestsTable([...testsTable, updatedTest]);
    }
    
    toast.success(`${selectedModalTest.testName} added with payment details`);
    closeModal();
  };


  // Handle date input change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFormData({...formData, birthDate: newDate});
  };

  // Handle referrer selection
  const handleReferrerChange = (e) => {
    const value = e.target.value;
    if (value === 'add-referrer') {
      navigate('/referral-management');
      return;
    }
    setFormData({...formData, referrer: value});
  };

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
                  <div className="relative">
                    <select
                      value={formData.referrer}
                      onChange={handleReferrerChange}
                      className="w-full border-2 border-green-800 rounded p-2"
                    >
                      <option value="">Select a referrer</option>
                      {isLoadingReferrers ? (
                        <option value="">Loading referrers...</option>
                      ) : isErrorReferrers ? (
                        <option value="">Error: {referrerError?.message || 'Unknown error'}</option>
                      ) : referrers.length === 0 ? (
                        <option value="">No active referrers available</option>
                      ) : (
                        referrers.map(referrer => (
                          <option 
                            key={referrer.referrerId} 
                            value={referrer.referrerId}
                          >
                            Dr. {referrer.lastName || 'Unknown'}
                          </option>
                        ))
                      )}
                      <option value="add-referrer">+ Add Referrer</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-green-800 font-medium mb-1">Birth Date</label>
                  <div className="relative" onClick={() => document.getElementById('birth-date-input').showPicker()}>
                    <input
                      id="birth-date-input"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleDateChange}
                      className="w-full border-2 border-green-800 rounded p-2 cursor-pointer"
                    />
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
                              <div className="relative">
                                <button 
                                  className="text-green-800" 
                                  onClick={(e) => toggleDropdown(test.testId, e)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                
                                {/* Only show dropdown if this test's ID matches activeDropdownId */}
                                {activeDropdownId === test.testId && (
                                  <div 
                                    ref={dropdownRef}
                                    className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg z-10 border border-gray-200"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(test); // Pass the test to openModal
                                      }}
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-800" 
                                    >
                                      Payment Details
                                    </button>
                                  </div>
                                )}
                              </div>
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
                          <td className="px-2 py-1 text-left text-green-800"></td>                      
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

      {/* Modal - update fields to reflect new functionality */}
      {isModalOpen && selectedModalTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="bg-green-700 text-white p-3 flex justify-between items-center">
              <h2 className="font-medium">Payment Details - {selectedModalTest.testName}</h2>
              <button 
                onClick={closeModal}
                className="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Price</label>
                  <input
                    type="text"
                    value={basePrice.toFixed(2)}
                    readOnly
                    className="w-full p-2 bg-gray-100 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Discount</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${discount}`}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-full p-2 rounded border border-gray-300"
                    />
                    <span className="inline-flex items-center px-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Cash Paid</label>
                  <input
                    type="text"
                    value={cashPaid}
                    onChange={(e) => handleCashPaidChange(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">GCash Paid</label>
                  <input
                    type="text"
                    value={gCashPaid}
                    onChange={(e) => handleGCashPaidChange(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-center mt-4">
                <button 
                  className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 focus:outline-none"
                  onClick={handleConfirmPayment}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddIncome