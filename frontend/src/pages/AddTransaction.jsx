import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testAPI, departmentAPI, referrerAPI, transactionAPI } from '../services/api'
import { handleDecimalKeyPress } from '../utils/decimalUtils'
import { X, Plus } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify'
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
  const [discountFieldFocused, setDiscountFieldFocused] = useState(false);

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

  const [generatedMcNo, setGeneratedMcNo] = useState('');

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
    referrer: 'Out Patient',
    sex: 'Male',
    idNumber: '' 
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
    setCashPaid('0');  
    setGCashPaid('0'); 

    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedModalTest(null);
  };

  const handleDiscountChange = (value) => {
    const discountValue = parseInt(value) || 0;
    
    if (discountValue < 0) {
      toast.error("Discount cannot be negative");
      return;
    }
    
    if (discountValue > 100) {
      toast.error("Discount cannot exceed 100%");
      return;
    }

    setDiscount(discountValue);

    const discounted = roundToTwoDecimals(basePrice * (1 - discountValue / 100));
    setDiscountedPrice(discounted);
    
    const cashValue = parseFloat(cashPaid) || 0;
    const gCashValue = parseFloat(gCashPaid) || 0;
    const totalPayment = cashValue + gCashValue;
    
    if (discounted < totalPayment) {
      toast.info("Discount would make the price less than the payment amount. Adjusting payment.");
      
      if (totalPayment > 0) {
        const cashRatio = cashValue / totalPayment;
        const gCashRatio = gCashValue / totalPayment;
        
        const newCash = roundToTwoDecimals(discounted * cashRatio);
        const newGCash = roundToTwoDecimals(discounted * gCashRatio);
        
        setCashPaid(newCash === 0 ? '0' : newCash.toString());
        setGCashPaid(newGCash === 0 ? '0' : newGCash.toString());
        setBalance(0);
        setPrice(0);
      } else {
        setBalance(discounted);
        setPrice(discounted);
      }
    } else {
      const newBalance = roundToTwoDecimals(Math.max(0, discounted - cashValue - gCashValue));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const [cashFieldFocused, setCashFieldFocused] = useState(false);
  const [gCashFieldFocused, setGCashFieldFocused] = useState(false);

  const handleCashPaidChange = (value) => {
    const parsedValue = parseFloat(value) || 0;
    if (parsedValue > discountedPrice) {
      setCashPaid(discountedPrice.toString());
      setGCashPaid('0');
      setBalance(0);
      setPrice(0);
      toast.info("Cash payment cannot exceed the price");
      return;
    }

    setCashPaid(value);
    
    if (value !== '') {
      const cashValue = parseFloat(value) || 0;
      const gCashValue = parseFloat(gCashPaid) || 0;
      
      if (cashValue + gCashValue > discountedPrice) {
        const newGCash = Math.max(0, discountedPrice - cashValue);
        setGCashPaid(newGCash === 0 ? '0' : newGCash.toString());
        setBalance(0);
        setPrice(0);
        toast.info("Total payment adjusted to match the price");
      } else {
        const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashValue - gCashValue));
        setBalance(newBalance);
        setPrice(newBalance);
      }
    } else {
      const gCashValue = parseFloat(gCashPaid) || 0;
      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - gCashValue));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const handleGCashPaidChange = (value) => {
    const parsedValue = parseFloat(value) || 0;
    if (parsedValue > discountedPrice) {
      setGCashPaid(discountedPrice.toString());
      setCashPaid('0');
      setBalance(0);
      setPrice(0);
      toast.info("GCash payment cannot exceed the price");
      return;
    }

    setGCashPaid(value);
    
    if (value !== '') {
      const gCashValue = parseFloat(value) || 0;
      const cashValue = parseFloat(cashPaid) || 0;
      
      if (cashValue + gCashValue > discountedPrice) {
        const newCash = Math.max(0, discountedPrice - gCashValue);
        setCashPaid(newCash === 0 ? '0' : newCash.toString());
        setBalance(0);
        setPrice(0);
        toast.info("Total payment adjusted to match the price");
      } else {
        const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashValue - gCashValue));
        setBalance(newBalance);
        setPrice(newBalance);
      }
    } else {
      const cashValue = parseFloat(cashPaid) || 0;
      const newBalance = roundToTwoDecimals(Math.max(0, discountedPrice - cashValue));
      setBalance(newBalance);
      setPrice(newBalance);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedModalTest) return;

    const numCashPaid = parseFloat(cashPaid) || 0;
    const numGCashPaid = parseFloat(gCashPaid) || 0;
    
    if (numCashPaid + numGCashPaid > discountedPrice + 0.01) {
      toast.error("Total payment cannot exceed the price. Please adjust your payment amounts.");
      return;
    }

    const finalDiscount = discount;
    const finalDiscountedPrice = roundToTwoDecimals(discountedPrice);

    let finalCash = roundToTwoDecimals(numCashPaid);
    let finalGCash = roundToTwoDecimals(numGCashPaid);
    
    if (finalCash + finalGCash > finalDiscountedPrice) {
      finalCash = roundToTwoDecimals(finalDiscountedPrice - finalGCash);
    }
    
    let finalBalance = roundToTwoDecimals(Math.max(0, finalDiscountedPrice - finalCash - finalGCash));

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
    // Fix: Set empty string for "Out Patient" to ensure it's properly handled
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
    
    if ((formData.id === "Senior Citizen" || formData.id === "Person with Disability") && 
        !formData.idNumber.trim()) {
      missingFields.push("ID Number");
    }

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
      const currentCounter = parseInt(localStorage.getItem('mcNumberCounter') || '0');
      // Increment counter without modulo, allowing it to grow beyond 9
      localStorage.setItem('mcNumberCounter', (currentCounter + 1).toString());
      
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
        sex: 'Male',
        idNumber: ''
      });
      
      // Generate new MC number for next transaction
      const nextMcNumber = getNextMcNumber();
      setGeneratedMcNo(nextMcNumber);
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

      const referrerId = formData.referrer === "" || formData.referrer === "Out Patient" 
                       ? null 
                       : formData.referrer;

      const transactionData = {
        mcNo: generatedMcNo, 
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        idType: formData.id,
        idNumber: formData.id === "Regular" ? "XXXX-XXXX" : formData.idNumber || '',  
        referrerId: referrerId,  
        birthDate: formData.birthDate || null,
        sex: formData.sex,
        items: items,
        userId: userId
      };

      createTransactionMutation.mutate(transactionData);
    } catch (error) {
      console.error('Error preparing transaction data:', error);
      toast.error(`Failed to prepare transaction data: ${error.message}`);
    }
  };

  // Helper function to calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age <= 0) {
      return "N/A";
    }
    
    return age >= 0 ? age : null;
  };

 
  const getNextMcNumber = () => {
    const currentCounter = parseInt(localStorage.getItem('mcNumberCounter') || '0');
    const nextCounter = currentCounter + 1;
    
    if (nextCounter >= 10) {
      return `041${nextCounter}`;
    } else {
      return `0410${nextCounter}`;
    }
  };

  useEffect(() => {
    const existingCounter = localStorage.getItem('mcNumberCounter');
    
    if (existingCounter === null) {
      localStorage.setItem('mcNumberCounter', '0');
    }
    
    const mcNumber = getNextMcNumber();
    setGeneratedMcNo(mcNumber);
  }, []);

  const [isOptionsDropdownOpen, setIsOptionsDropdownOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showDiscountCheckboxes, setShowDiscountCheckboxes] = useState(false);
  const [testsToDiscount, setTestsToDiscount] = useState({});
  const optionsButtonRef = useRef(null);
  
  const handleApplyDiscount = () => {
    if (globalDiscount <= 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }
    setShowDiscountCheckboxes(true);
    setIsDiscountModalOpen(false);
        const initialSelection = {};
    testsTable.forEach((_, index) => {
      initialSelection[index] = false;
    });
    setTestsToDiscount(initialSelection);
  };

  const handleDiscountCheckboxToggle = (index) => {
    setTestsToDiscount(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    
    if (!testsToDiscount[index]) {
      const updatedTestsTable = [...testsTable];
      const test = updatedTestsTable[index];
      const originalTest = selectedTests[index];
      const originalPrice = parseFloat(originalTest.price) || 0;
      
      const discountMultiplier = (100 - globalDiscount) / 100;
      const newDiscountedPrice = roundToTwoDecimals(originalPrice * discountMultiplier);
      
      // Get current payment values
      const currentCash = parseFloat(test.cash) || 0;
      const currentGCash = parseFloat(test.gCash) || 0;
      const currentBalance = parseFloat(test.bal) || 0;
      const totalPayment = currentCash + currentGCash + currentBalance;
      
      // Calculate proportion of each payment method
      const cashProportion = totalPayment > 0 ? currentCash / totalPayment : 0;
      const gCashProportion = totalPayment > 0 ? currentGCash / totalPayment : 0;
      const balProportion = totalPayment > 0 ? currentBalance / totalPayment : 1; // Default to balance if no payments
      
      // Apply discount proportionally to each payment method
      let newCash, newGCash, newBalance;
      
      if (currentCash > 0 && currentGCash === 0 && currentBalance === 0) {
        // If only cash payment exists
        newCash = newDiscountedPrice;
        newGCash = 0;
        newBalance = 0;
      } else if (currentCash === 0 && currentGCash > 0 && currentBalance === 0) {
        // If only GCash payment exists
        newCash = 0;
        newGCash = newDiscountedPrice;
        newBalance = 0;
      } else if (currentCash === 0 && currentGCash === 0 && currentBalance > 0) {
        // If only balance exists
        newCash = 0;
        newGCash = 0;
        newBalance = newDiscountedPrice;
      } else {
        // If multiple payment methods exist, maintain proportions
        newCash = roundToTwoDecimals(newDiscountedPrice * cashProportion);
        newGCash = roundToTwoDecimals(newDiscountedPrice * gCashProportion);
        newBalance = roundToTwoDecimals(newDiscountedPrice * balProportion);
      }
      
      updatedTestsTable[index] = {
        ...test,
        disc: `${globalDiscount}%`,
        cash: newCash.toFixed(2),
        gCash: newGCash.toFixed(2),
        bal: newBalance.toFixed(2)
      };
      
      setTestsTable(updatedTestsTable);
    } else {
      const updatedTestsTable = [...testsTable];
      const test = updatedTestsTable[index];
      const originalTest = selectedTests[index];
      const originalPrice = parseFloat(originalTest.price) || 0;
      
      // Get payment method that was used originally (before any discount)
      const originalCash = parseFloat(test.cash) || 0;
      const originalGCash = parseFloat(test.gCash) || 0;
      const originalBalance = parseFloat(test.bal) || 0;
      
      // Determine which payment method was primarily used
      const hasCash = originalCash > 0;
      const hasGCash = originalGCash > 0;
      const hasBalance = originalBalance > 0;
      
      let restoredCash = '0.00';
      let restoredGCash = '0.00';
      let restoredBalance = '0.00';
      
      if (hasCash && !hasGCash && !hasBalance) {
        // Only cash was used
        restoredCash = originalPrice.toFixed(2);
      } else if (!hasCash && hasGCash && !hasBalance) {
        // Only GCash was used
        restoredGCash = originalPrice.toFixed(2);
      } else if (!hasCash && !hasGCash && hasBalance) {
        restoredBalance = originalPrice.toFixed(2);
      } else {
        const totalPayment = originalCash + originalGCash + originalBalance;
        const cashProportion = totalPayment > 0 ? originalCash / totalPayment : 0;
        const gCashProportion = totalPayment > 0 ? originalGCash / totalPayment : 0;
        const balProportion = totalPayment > 0 ? originalBalance / totalPayment : 1;
        
        restoredCash = (originalPrice * cashProportion).toFixed(2);
        restoredGCash = (originalPrice * gCashProportion).toFixed(2);
        restoredBalance = (originalPrice * balProportion).toFixed(2);
      }
      
      updatedTestsTable[index] = {
        ...test,
        disc: '0%',
        cash: restoredCash,
        gCash: restoredGCash,
        bal: restoredBalance
      };
      
      setTestsTable(updatedTestsTable);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsButtonRef.current && !optionsButtonRef.current.contains(e.target)) {
        setIsOptionsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [optionsButtonRef]);

  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
  if (!user) {
    return null;
  }

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

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">OR#</label>
                  <input
                    type="text"
                    value={generatedMcNo}
                    className="w-full border-2 border-green-800 rounded p-2 bg-green-800 text-white"
                    disabled
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">Birth Date</label>
                  <div className="relative" onClick={() => document.getElementById('birth-date-input').showPicker()}>
                    <input
                      id="birth-date-input"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleDateChange}
                      className="w-full border-2 border-green-800 rounded p-2 cursor-pointer"
                    />
                    {formData.birthDate && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-700 text-sm">
                        Age: {calculateAge(formData.birthDate)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
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

                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">Referrer</label>
                  <div className="relative">
                    <select
                      value={formData.referrer}
                      onChange={handleReferrerChange}
                      className="w-full border-2 border-green-800 rounded p-2"
                    >
                      {/* Fix: Use empty string value for Out Patient option */}
                      <option value="">Out Patient</option>
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
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
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

                <div className="flex-1">
                  <label className="block text-green-800 font-medium mb-1">ID Number</label>
                  <input
                    type="text"
                    value={formData.id === "Regular" ? "XXXX-XXXX" : formData.idNumber || ''}
                    maxLength={25}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full border-2 border-green-800 rounded p-2"
                    disabled={formData.id === "Regular"}
                    placeholder={formData.id === "Regular" ? "XXXX-XXXX" : "Enter ID number"}
                  />
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
                        departments
                          .filter(dept => dept.status === 'active') 
                          .map(dept => (
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
                        <th className="px-2 py-1 text-sm">Actions</th>
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
                            <td className="px-2 py-1 text-center flex items-center justify-center space-x-1">
                              {showDiscountCheckboxes && (
                                <input 
                                  type="checkbox"
                                  checked={testsToDiscount[index] || false}
                                  onChange={() => handleDiscountCheckboxToggle(index)}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                              )}
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
                          <td className="px-2 py-1 text-center relative">
                            <div ref={optionsButtonRef} className="relative">
                              <button 
                                className="bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center"
                                onClick={() => setIsOptionsDropdownOpen(!isOptionsDropdownOpen)}
                              >
                                Options <span className="ml-1">▼</span>
                              </button>
                              
                              {isOptionsDropdownOpen && (
                                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[120px]">
                                  <button 
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-green-800"
                                    onClick={() => {
                                      setIsOptionsDropdownOpen(false);
                                      setIsDiscountModalOpen(true);
                                    }}
                                  >
                                   % Apply Discount
                                  </button>
                                  {showDiscountCheckboxes && (
                                    <button 
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                      onClick={() => {
                                        setShowDiscountCheckboxes(false);
                                        setIsOptionsDropdownOpen(false);
                                      }}
                                    >
                                      Cancel Discount
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
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
                    inputMode="decimal"
                    value={cashFieldFocused ? cashPaid === '0' ? '' : cashPaid : cashPaid}
                    onChange={(e) => handleCashPaidChange(e.target.value)}
                    onFocus={() => setCashFieldFocused(true)}
                    onBlur={() => setCashFieldFocused(false)}
                    onKeyPress={handleDecimalKeyPress}
                    className="w-full p-2 rounded border border-gray-300"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">GCash Paid</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={gCashFieldFocused ? gCashPaid === '0' ? '' : gCashPaid : gCashPaid}
                    onChange={(e) => handleGCashPaidChange(e.target.value)}
                    onFocus={() => setGCashFieldFocused(true)}
                    onBlur={() => setGCashFieldFocused(false)}
                    onKeyPress={handleDecimalKeyPress}
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
                  <select
                    value={testDepartment}
                    onChange={handleDepartmentChange}
                    className="w-full border border-gray-300 rounded p-2 appearance-none"
                    required
                  >
                    {Array.isArray(departments) ? departments
                      .filter(dept => dept.status === 'active')
                      .map(dept => (
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

                        if (!selectedReferrerId) return 'Out Patient';

                        const selectedReferrer = referrers.find(r => String(r.referrerId) === String(selectedReferrerId));

                        if (selectedReferrer) {
                          return `Dr. ${selectedReferrer.lastName || ''} ${selectedReferrer.firstName || ''}`.trim();
                        } else {
                          return 'Out Patient';
                        }
                      })()}
                    </div>
                    <div className='font-bold text-green-800'>MC #:</div>
                    <div className="col-span-2 text-green-700">{generatedMcNo || 'N/A'}</div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="font-bold text-green-800">Birth Date:</div>
                    <div className="col-span-2 text-green-700">
                      {formData.birthDate ? (
                        <>
                          {new Date(formData.birthDate).toLocaleDateString()}
                          <span className="ml-1 text-gray-700">
                            (Age: {calculateAge(formData.birthDate)})
                          </span>
                        </>
                      ) : 'N/A'}
                    </div>

                    <div className="font-bold text-green-800">Sex:</div>
                    <div className="col-span-2 text-green-700">{formData.sex}</div>

                    <div className="font-bold text-green-800">ID:</div>
                    <div className="col-span-2 text-green-700">{formData.id}</div>
                    <div className="font-bold text-green-800">ID #:</div>
                    <div className="col-span-2 text-green-700">{formData.idNumber || 'N/A'}</div>
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

      {/* Add Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="bg-green-700 text-white p-3 flex justify-between items-center">
              <h2 className="font-medium">Apply Global Discount</h2>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className='font-bold text-green-800'>Total Price</label>
                  <div>
                    <input
                      value={parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.cash) || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      className='w-full p-2 rounded border border-gray-300 bg-green-700 text-white border border-green-700'
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className='font-bold text-green-800'>Total Discounted</label>
                  <div>
                    <input
                      value={parseFloat(testsTable.reduce((sum, test) => sum + (parseFloat(test.cash) || 0), 0) * (globalDiscount / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      className='w-full p-2 rounded border border-gray-300 bg-green-700 text-white border border-green-700'
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-green-700 mb-2">Discount (%)</label>
                <div className="flex">
                  <input
                    type="number"
                    value={discountFieldFocused ? globalDiscount || '' : globalDiscount}
                    onChange={(e) => setGlobalDiscount(parseInt(e.target.value) || 0)}
                    onFocus={() => setDiscountFieldFocused(true)}
                    onBlur={() => setDiscountFieldFocused(false)}
                    className="w-full p-2 rounded border border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Enter discount percentage"
                  />
                  <span className="inline-flex items-center px-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r">%</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  After setting the discount, you will be able to select which tests to apply it to.
                </p>
              </div>
                            
              <div className="flex justify-center gap-3 mt-4">
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none"
                  onClick={() => setIsDiscountModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 focus:outline-none"
                  onClick={handleApplyDiscount}
                >
                  Apply
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