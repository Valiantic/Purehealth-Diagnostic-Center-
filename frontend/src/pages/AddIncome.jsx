import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testAPI, departmentAPI, referrerAPI, transactionAPI } from '../services/api'
import { ToastContainer, toast } from 'react-toastify'
import { X, Plus } from 'lucide-react';
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
  const [selectedModalTest, setSelectedModalTest] = useState(null);
  const [basePrice, setBasePrice] = useState(0);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(20);
  const [cashPaid, setCashPaid] = useState(0);
  const [gCashPaid, setGCashPaid] = useState(0);

  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [testName, setTestName] = useState('');

  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDepartment, setTestDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userSelectedDepartment, setUserSelectedDepartment] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    testName: '',
    department: '',
    price: '',
    dateCreated: formatDate(new Date())
  });
  const [queue, setQueue] = useState([]);

  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function handleAddToQueue() {
    if (!testForm.testName || !testDepartment || !price) {
      toast.error("Please fill all required test details");
      return;
    }

    const newItem = {
      testName: testForm.testName,
      department: testDepartment,
      price: typeof price === 'string' ? price : price.toFixed(2),
      created: formatDate(new Date(testDate))
    };

    setQueue([...queue, newItem]);

    setTestForm({
      testName: '',
      department: '',
      price: '',
      dateCreated: formatDate(new Date())
    });
    setPrice('');

    toast.success("Test added to queue successfully");
  }

  const queryClient = useQueryClient();

  const createBatchTestsMutation = useMutation({
    mutationFn: ({ testData, userId }) => testAPI.createTest(testData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error creating test:', error);
      toast.error(error.response?.data?.message || 'Failed to create test');
    }
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    id: 'Regular',
    referrer: '',
    sex: 'Male'
  });

  const [searchTest, setSearchTest] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [testsTable, setTestsTable] = useState([]);

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

  const tests = Array.isArray(testsData) ? testsData :
    Array.isArray(testsData.data) ? testsData.data : [];

  const departments = Array.isArray(departmentsData) ? departmentsData :
    Array.isArray(departmentsData.data) ? departmentsData.data : [];

  const allReferrers = referrersData?.data?.data || [];
  const referrers = allReferrers.filter(referrer => referrer.status === 'active');

  const filteredTests = tests.filter(test => {
    const matchesSearch = test?.testName?.toLowerCase?.().includes(searchTest.toLowerCase()) || false;
    const matchesDepartment = selectedDepartment ?
      test?.departmentId === selectedDepartment : true;
    const isActive = test.status === 'active';
    return matchesSearch && matchesDepartment && isActive;
  });

  const handleSelectTest = (test) => {
    const isAlreadySelected = selectedTests.some(t => t.testId === test.testId);

    if (isAlreadySelected) {
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

  const handleClearAll = () => {
    setSelectedTests([]);
    setTestsTable([]);
  };

  const handleRemoveTest = (index) => {
    const newSelectedTests = [...selectedTests];
    const newTestsTable = [...testsTable];
    newSelectedTests.splice(index, 1);
    newTestsTable.splice(index, 1);
    setSelectedTests(newSelectedTests);
    setTestsTable(newTestsTable);
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId === selectedDepartment ? null : deptId);
    setShowDeptFilter(false);
  };

  const toggleDeptFilter = () => {
    setShowDeptFilter(!showDeptFilter);
  };

  const toggleDropdown = (testId, e) => {
    e.stopPropagation();
    setActiveDropdownId(prevId => prevId === testId ? null : testId);
  };

  const roundToTwoDecimals = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  const openModal = (test) => {
    setSelectedModalTest(test);
    const testPrice = parseFloat(test.price) || 0;
    const roundedPrice = roundToTwoDecimals(testPrice);

    setBasePrice(roundedPrice);
    setPrice(roundedPrice);

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

  const handleDiscountChange = (value) => {
    const discountValue = parseInt(value) || 0;
    setDiscount(discountValue);

    const discounted = roundToTwoDecimals(basePrice * (1 - discountValue / 100));
    setDiscountedPrice(discounted);

    const newBalance = roundToTwoDecimals(Math.max(0, discounted - cashPaid - gCashPaid));
    setBalance(newBalance);
    setPrice(newBalance);
  };

  const handleCashPaidChange = (value) => {
    const cashValue = parseFloat(value) || 0;

    if (cashValue + gCashPaid > discountedPrice) {
      const maxAllowed = roundToTwoDecimals(Math.max(0, discountedPrice - gCashPaid));
      setCashPaid(maxAllowed);

      setBalance(0);
      setPrice(0);

      toast.info("Payment amount cannot exceed the price");
    } else {
      setCashPaid(cashValue);

      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashValue - gCashPaid));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const handleGCashPaidChange = (value) => {
    const gCashValue = parseFloat(value) || 0;

    if (cashPaid + gCashValue > discountedPrice) {
      const maxAllowed = roundToTwoDecimals(Math.max(0, discountedPrice - cashPaid));
      setGCashPaid(maxAllowed);

      setBalance(0);
      setPrice(0);

      toast.info("Payment amount cannot exceed the price");
    } else {
      setGCashPaid(gCashValue);

      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashPaid - gCashPaid));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedModalTest) return;

    if (cashPaid + gCashPaid > discountedPrice) {
      toast.error("Total payment cannot exceed the price");
      return;
    }

    const finalDiscount = discount;
    const finalDiscountedPrice = roundToTwoDecimals(discountedPrice);

    let finalCash = roundToTwoDecimals(cashPaid);
    let finalGCash = roundToTwoDecimals(gCashPaid);
    let finalBalance = roundToTwoDecimals(balance);

    if (finalCash === 0 && finalGCash === 0 && discount > 0) {
      finalCash = finalDiscountedPrice;
      finalBalance = 0;
    }

    const testIndex = selectedTests.findIndex(t => t.testId === selectedModalTest.testId);

    const updatedTest = {
      testId: selectedModalTest.testId,
      name: selectedModalTest.testName,
      disc: `${finalDiscount}%`,
      cash: finalCash.toFixed(2),
      gCash: finalGCash.toFixed(2),
      bal: finalBalance.toFixed(2)
    };

    if (testIndex >= 0) {
      const newSelectedTests = [...selectedTests];
      const newTestsTable = [...testsTable];

      newSelectedTests[testIndex] = selectedModalTest;
      newTestsTable[testIndex] = updatedTest;

      setSelectedTests(newSelectedTests);
      setTestsTable(newTestsTable);
    } else {
      setSelectedTests([...selectedTests, selectedModalTest]);
      setTestsTable([...testsTable, updatedTest]);
    }

    toast.success(`${selectedModalTest.testName} added with payment details`);
    closeModal();
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFormData({ ...formData, birthDate: newDate });
  };

  const handleReferrerChange = (e) => {
    const value = e.target.value;
    if (value === 'add-referrer') {
      setIsReferrerModalOpen(true);
      return;
    }
    setFormData({ ...formData, referrer: value });
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

  function handleConfirm() {
    if (queue.length === 0) {
      toast.error("No tests in queue to save");
      return;
    }

    const userId = user?.userId || user?.id;
    if (!userId) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    Promise.all(
      queue.map(async (item) => {
        try {
          const department = departments.find(
            d => d.departmentName.toLowerCase() === item.department.toLowerCase()
          );

          if (!department) {
            throw new Error(`Department not found for: ${item.department}`);
          }

          const testData = {
            testName: item.testName,
            departmentId: department.departmentId,
            price: parseFloat(item.price),
            dateCreated: new Date().toISOString(),
            currentUserId: userId
          };

          await testAPI.createTest(testData, userId);
          successCount++;

        } catch (error) {
          console.error(`Error saving test "${item.testName}":`, error);
          errorCount++;
          return error;
        }
      })
    )
      .then(() => {
        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} tests to the database`);
        }

        if (errorCount > 0) {
          toast.error(`Failed to add ${errorCount} tests`);
        }

        setQueue([]);

        setIsOpen(false);

        queryClient.invalidateQueries({ queryKey: ['tests'] });
      })
      .catch(error => {
        console.error('Error in batch processing:', error);
        toast.error('An error occurred while saving tests');
      });
  }

  const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
  const [newReferrerData, setNewReferrerData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    sex: 'Male',
    clinicName: '',
    clinicAddress: '',
    contactNo: ''
  });

  const addReferrerMutation = useMutation({
    mutationFn: (referrerData) =>
      referrerAPI.createReferrer(referrerData, user?.userId || user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrers'] });
      toast.success('Referrer added successfully');
      closeReferrerModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add referrer');
    }
  });

  const closeReferrerModal = () => {
    setIsReferrerModalOpen(false);
    setNewReferrerData({
      firstName: '',
      lastName: '',
      birthday: '',
      sex: 'Male',
      clinicName: '',
      clinicAddress: '',
      contactNo: ''
    });
  };

  const handleReferrerInputChange = (e) => {
    const { name, value } = e.target;
    setNewReferrerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNewReferrer = () => {
    if (!newReferrerData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!newReferrerData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    addReferrerMutation.mutate(newReferrerData);
  };

  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false);

  const openTransactionSummary = () => {
    if (testsTable.length === 0) {
      toast.error("Please select at least one test before processing the transaction");
      return;
    }

    const missingFields = [];

    if (!formData.firstName.trim()) missingFields.push("First Name");
    if (!formData.lastName.trim()) missingFields.push("Last Name");
    if (!formData.id) missingFields.push("ID Type");
    if (!formData.referrer) missingFields.push("Referrer");
    if (!formData.birthDate) missingFields.push("Birth Date");
    if (!formData.sex) missingFields.push("Sex");

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsModalOpen(false);
    setIsOpen(false);
    setIsReferrerModalOpen(false);

    setIsTransactionSummaryOpen(true);
  };

  const closeTransactionSummary = () => {
    setIsTransactionSummaryOpen(false);
  };

  const createTransactionMutation = useMutation({
    mutationFn: (transactionData) =>
      transactionAPI.createTransaction(transactionData, user?.userId || user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction saved successfully');
      closeTransactionSummary();
      handleClearAll();
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        id: 'Regular',
        referrer: '',
        sex: 'Male'
      });
    },
    onError: (error) => {
      console.error('Transaction error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save transaction');
    }
  });

  const handleConfirmTransaction = () => {
    if (testsTable.length === 0) {
      toast.error("No tests selected for this transaction");
      return;
    }

    const userId = user?.userId || user?.id;
    if (!userId) {
      toast.error('User ID is missing. Please log in again.');
      return;
    }

    try {
      const items = testsTable.map((test, index) => {
        const originalTest = selectedTests[index];

        if (!originalTest?.testId) {
          throw new Error(`Test ID is missing for ${test.name}`);
        }
        if (!originalTest?.departmentId) {
          throw new Error(`Department ID is missing for ${test.name}`);
        }

        const discStr = test.disc.replace('%', '');
        const discountPercentage = parseInt(discStr) || 0;

        const originalPrice = parseFloat(originalTest.price);
        const cashAmount = parseFloat(test.cash) || 0;
        const gCashAmount = parseFloat(test.gCash) || 0;
        const balAmount = parseFloat(test.bal) || 0;

        const discountedPrice = cashAmount + gCashAmount + balAmount;

        return {
          testId: originalTest.testId,
          testName: test.name,
          departmentId: originalTest.departmentId,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage,
          discountedPrice: discountedPrice,
          cashAmount: cashAmount,
          gCashAmount: gCashAmount,
          balanceAmount: balAmount,
        };
      });

      const transactionData = {
        mcNo: Math.floor(10000 + Math.random() * 90000).toString(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        idType: formData.id,
        referrerId: formData.referrer || null,
        birthDate: formData.birthDate || null,
        sex: formData.sex,
        items: items,
        userId: userId
      };

      console.log('Sending transaction data:', JSON.stringify(transactionData, null, 2));

      createTransactionMutation.mutate(transactionData);
    } catch (error) {
      console.error('Error preparing transaction data:', error);
      toast.error(`Failed to prepare transaction data: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen p-4">
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="hidden lg:block w-64">
        </div>

        <div className="flex-1">
          <div className="bg-cream-50 border-2 border-green-800 rounded-lg overflow-hidden mb-4">
            <div className="bg-green-800 text-white p-3">
              <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Add Transaction</h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-800 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">ID</label>
                  <select
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  >
                    <option>Regular</option>
                    <option>Senior Citizen</option>
                    <option>Person with Disability</option>
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
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white p-3">
                <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">
                  Select Test {selectedDepartment ?
                    `- ${departments.find(d => d.departmentId === selectedDepartment)?.departmentName || ''}` :
                    '(All Departments)'}
                </h2>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search for test..."
                    value={searchTest}
                    onChange={(e) => setSearchTest(e.target.value)}
                    className="w-full border rounded p-2 pl-3 pr-10"
                  />

                  <span className="absolute right-14 top-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>

                  <span
                    className="absolute right-8 top-2.5 cursor-pointer"
                    onClick={() => setIsOpen(true)}
                  >
                    <Plus size={20} className="text-gray-500 hover:text-green-800" />
                  </span>

                  <span
                    className="absolute right-2 top-2.5 cursor-pointer"
                    onClick={toggleDeptFilter}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </span>

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

                                {activeDropdownId === test.testId && (
                                  <div
                                    ref={dropdownRef}
                                    className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg z-10 border border-gray-200"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(test);
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

            <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white p-3">
                <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Test Conducted</h2>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto h-72 overflow-y-auto">
                  <table className="w-full min-w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="bg-green-100 text-left border-b py-2 px-4 text-green-800">
                        <th className="px-2 py-1 text-sm">Test Name</th>
                        <th className="px-2 py-1 text-sm">Discount</th>
                        <th className="px-2 py-1 text-sm">Cash</th>
                        <th className="px-2 py-1 text-sm">GCash</th>
                        <th className="px-2 py-1 text-sm">Balance</th>
                        <th className="px-2 py-1 text-sm">Option</th>
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
                            <td className="px-2 py-1">{parseFloat(test.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1">{test.gCash}</td>
                            <td className="px-2 py-1">{test.bal}</td>
                            <td className="px-2 py-1 text-center">
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
                            {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.cash) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-1 text-left text-green-800">
                            {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.gCash) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-1 text-left text-green-800">
                            {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.bal) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
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
                    onClick={(e) => {
                      e.preventDefault();
                      openTransactionSummary();
                    }}
                  >
                    Process Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md w-full max-w-md relative">
            <div className="bg-green-800 text-white p-3 rounded-t-md flex justify-between items-center">
              <h2 className="text-xl font-bold">New Test</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-green-800 font-medium mb-1">Test Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => {
                      setTestName(e.target.value);
                      setTestForm({ ...testForm, testName: e.target.value });
                    }}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="Electrocardiogram"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-1">Date Created</label>
                  <div className="relative">
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
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-1">Test Department</label>
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

              <div className="flex justify-end mb-4">
                <button
                  onClick={handleAddToQueue}
                  className="bg-green-700 text-white py-2 px-4 rounded"
                >
                  Add to Queue
                </button>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-green-800">Test Name</th>
                      <th className="text-left py-2 px-2 text-green-800">Department</th>
                      <th className="text-left py-2 px-2 text-green-800">Price</th>
                      <th className="text-left py-2 px-2 text-green-800">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item, index) => (
                      <tr key={index} className="border-b bg-gray-50">
                        <td className="py-2 px-2">{item.testName}</td>
                        <td className="py-2 px-2">{item.department}</td>
                        <td className="py-2 px-2">{item.price}</td>
                        <td className="py-2 px-2">{item.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleConfirm}
                  disabled={createBatchTestsMutation.isPending}
                  className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
                >
                  {createBatchTestsMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReferrerModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white w-full max-w-md rounded shadow-lg">
            <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-medium">New Referrer</h3>
              <button onClick={closeReferrerModal} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-800 font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newReferrerData.firstName}
                    onChange={handleReferrerInputChange}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Birthday</label>
                  <div className="relative" onClick={() => document.getElementById('add-new-referrer-date').showPicker()}>
                    <input
                      id="add-new-referrer-date"
                      type="date"
                      name="birthday"
                      value={newReferrerData.birthday}
                      onChange={handleReferrerInputChange}
                      className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newReferrerData.lastName}
                    onChange={handleReferrerInputChange}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Sex</label>
                  <div className="relative">
                    <select
                      name="sex"
                      value={newReferrerData.sex}
                      onChange={handleReferrerInputChange}
                      className="w-full border border-gray-300 rounded p-2 appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                        <path d="M7 10l5 5 5-5H7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Clinic Name</label>
                  <input
                    type="text"
                    name="clinicName"
                    value={newReferrerData.clinicName}
                    onChange={handleReferrerInputChange}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-medium mb-1">Contact No.</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={newReferrerData.contactNo}
                    onChange={handleReferrerInputChange}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-green-800 font-medium mb-1">Clinic Address</label>
                  <input
                    type="text"
                    name="clinicAddress"
                    value={newReferrerData.clinicAddress}
                    onChange={handleReferrerInputChange}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              <div className="flex justify-center">
                <button
                  onClick={handleAddNewReferrer}
                  disabled={addReferrerMutation.isPending}
                  className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 uppercase font-medium"
                >
                  {addReferrerMutation.isPending ? 'SAVING...' : 'CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTransactionSummaryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="bg-green-800 text-white p-4 flex justify-between items-center rounded-t-md sticky top-0 z-10">
              <h2 className="text-xl font-bold">Transaction Summary</h2>
              <button
                onClick={closeTransactionSummary}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
              <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
                <div className="p-3 md:border-r border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="font-bold text-green-800">First Name:</div>
                    <div className="col-span-2 text-green-700">{formData.firstName || 'N/A'}</div>

                    <div className="font-bold text-green-800">Last Name:</div>
                    <div className="col-span-2 text-green-700">{formData.lastName || 'N/A'}</div>

                    <div className="font-bold text-green-800">Referrer:</div>
                    <div className="col-span-2 text-green-700">
                      {(() => {
                        const selectedReferrerId = formData.referrer;

                        if (!selectedReferrerId) return 'N/A';

                        const selectedReferrer = referrers.find(r => String(r.referrerId) === String(selectedReferrerId));

                        if (selectedReferrer) {
                          return `Dr. ${selectedReferrer.lastName || ''} ${selectedReferrer.firstName || ''}`.trim();
                        } else {
                          console.log('Referrer not found:', selectedReferrerId, 'Available referrers:', referrers);
                          return 'N/A';
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="font-bold text-green-800">Birth Date:</div>
                    <div className="col-span-2 text-green-700">
                      {formData.birthDate ? new Date(formData.birthDate).toLocaleDateString() : 'N/A'}
                    </div>

                    <div className="font-bold text-green-800">Sex:</div>
                    <div className="col-span-2 text-green-700">{formData.sex}</div>

                    <div className="font-bold text-green-800">ID:</div>
                    <div className="col-span-2 text-green-700">{formData.id}</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left border-b border-gray-200 font-bold text-green-800">Test Name</th>
                      <th className="p-2 text-left border-b border-gray-200 font-bold text-green-800">Disc.</th>
                      <th className="p-2 text-left border-b border-gray-200 font-bold text-green-800">Cash</th>
                      <th className="p-2 text-left border-b border-gray-200 font-bold text-green-800">GCash</th>
                      <th className="p-2 text-left border-b border-gray-200 font-bold text-green-800">Bal.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testsTable.map((test, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-2 border-b border-gray-200">{test.name}</td>
                        <td className="p-2 border-b border-gray-200">{test.disc}</td>
                        <td className="p-2 border-b border-gray-200">{parseFloat(test.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-2 border-b border-gray-200">{test.gCash}</td>
                        <td className="p-2 border-b border-gray-200">{test.bal}</td>
                      </tr>
                    ))}

                    {testsTable.length > 0 && (
                      <tr className="bg-green-100 font-bold">
                        <td className="p-2 border-b border-gray-200 text-green-800">TOTAL</td>
                        <td className="p-2 border-b border-gray-200"></td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.cash) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.gCash) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.bal) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
              >
                Export
              </button>
              <button
                className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
                onClick={handleConfirmTransaction}
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddIncome