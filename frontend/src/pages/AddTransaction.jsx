import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TransactionSummaryModal from '../components/transaction/TransactionSummaryModal';
import ReferrerModal from '../components/referral-management/ReferrerModal';
import useAuth from '../hooks/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testAPI, departmentAPI, referrerAPI, transactionAPI, settingsAPI } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, X, Filter } from 'lucide-react';
import useReferrerForm from '../hooks/referral-management/useReferrerForm';

const NewAddTransaction = () => {
  const { user, isAuthenticating } = useAuth();
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const queryClient = useQueryClient();

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
  const [generatedMcNo, setGeneratedMcNo] = useState('');
  const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false);
  const [showEpayInput, setShowEpayInput] = useState({});

  // Fetch tests
  const { data: testsData = { data: [] } } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await testAPI.getAllTests(true);
      return response || { data: [] };
    },
  });

  // Fetch departments
  const { data: departmentsData = { data: [] } } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(true);
      return response || { data: [] };
    },
  });

  // Fetch referrers
  const { data: referrersData, isLoading: isLoadingReferrers } = useQuery({
    queryKey: ['referrers'],
    queryFn: async () => await referrerAPI.getAllReferrers(true),
  });

  // Fetch discount categories
  const {
    data: discountCategoriesData
  } = useQuery({
    queryKey: ['discountCategories'],
    queryFn: async () => {
      const response = await settingsAPI.getAllDiscountCategories();
      return response;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch referral fee
  const {
    data: referralFeeData
  } = useQuery({
    queryKey: ['referralFeeSetting'],
    queryFn: async () => {
      const response = await settingsAPI.getSettingByKey('referral_fee_percentage');
      return response;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const tests = Array.isArray(testsData) ? testsData : Array.isArray(testsData.data) ? testsData.data : [];
  const allDepartments = Array.isArray(departmentsData) ? departmentsData : Array.isArray(departmentsData.data) ? departmentsData.data : [];
  const departments = allDepartments.filter(dept => dept.status === 'active');
  const allReferrers = referrersData?.data?.data || [];
  const referrers = allReferrers.filter(referrer => referrer.status === 'active');

  // Build dynamic idTypeOptions from discount categories
  const discountCategories = discountCategoriesData?.data?.categories?.filter(cat => cat.status === 'active') || [];
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    ...(discountCategories.map(cat => ({ value: cat.categoryName, label: cat.categoryName })))
  ];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test?.testName?.toLowerCase?.().includes(searchTest.toLowerCase()) || false;
    const matchesDepartment = selectedDepartment ? test?.departmentId === selectedDepartment : true;
    const isActive = test.status === 'active';
    return matchesSearch && matchesDepartment && isActive;
  });

  // Handle test checkbox toggle
  const handleTestToggle = (test) => {
    const isAlreadySelected = selectedTests.some(t => t.testId === test.testId);

    if (isAlreadySelected) {
      const testIndex = selectedTests.findIndex(t => t.testId === test.testId);
      setSelectedTests(prev => prev.filter((_, i) => i !== testIndex));
      setTestsTable(prev => prev.filter((_, i) => i !== testIndex));
      // Remove e-payment input visibility state for this test
      setShowEpayInput(prev => {
        const updated = { ...prev };
        delete updated[testIndex];
        return updated;
      });
    } else {
      const testPrice = parseFloat(test.price) || 0;
      const newTest = {
        testId: test.testId,
        name: test.testName,
        disc: '0%',
        cash: testPrice.toFixed(2),
        gCash: '0.00',
        bal: '0.00'
      };

      setSelectedTests([...selectedTests, test]);
      setTestsTable([...testsTable, newTest]);
    }
  };

  // Handle cash amount change
  const handleCashChange = (index, value) => {
    const updatedTestsTable = [...testsTable];
    const test = updatedTestsTable[index];
    const originalTest = selectedTests[index];
    const originalPrice = parseFloat(originalTest?.price || 0);
    const gCash = parseFloat(test.gCash) || 0;
    
    // Restrict cash amount to not exceed remaining balance after e-payment
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const maxAllowed = originalPrice - gCash;
    if (numericValue > maxAllowed) {
      return; // Silently prevent exceeding the remaining balance
    }
    
    // Keep the value as is to allow editing
    test.cash = value;
    
    const newCash = value === '' ? 0 : parseFloat(value) || 0;
    const totalPaid = newCash + gCash;
    const balance = Math.max(0, originalPrice - totalPaid);
    
    test.bal = balance.toFixed(2);
    setTestsTable(updatedTestsTable);
  };

  // Handle e-payment (GCash) change
  const handleGCashChange = (index, value) => {
    const updatedTestsTable = [...testsTable];
    const test = updatedTestsTable[index];
    const originalTest = selectedTests[index];
    const originalPrice = parseFloat(originalTest?.price || 0);
    const cash = parseFloat(test.cash) || 0;
    
    // Restrict e-payment amount to not exceed remaining balance
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const maxAllowed = originalPrice - cash;
    if (numericValue > maxAllowed) {
      return; // Silently prevent exceeding the remaining balance
    }
    
    // Keep the value as is to allow editing
    test.gCash = value;
    
    const newGCash = value === '' ? 0 : parseFloat(value) || 0;
    const totalPaid = cash + newGCash;
    const balance = Math.max(0, originalPrice - totalPaid);
    
    test.bal = balance.toFixed(2);
    setTestsTable(updatedTestsTable);
  };

  // Remove test from table
  const handleRemoveTest = (index) => {
    setSelectedTests(prev => prev.filter((_, i) => i !== index));
    setTestsTable(prev => prev.filter((_, i) => i !== index));
    // Remove e-payment input visibility state for this test
    setShowEpayInput(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalPrice = 0;
    let totalCash = 0;
    let totalGCash = 0;
    let totalBalance = 0;

    testsTable.forEach(test => {
      const originalTest = selectedTests.find(st => st.testName === test.name);
      if (originalTest) {
        totalPrice += parseFloat(originalTest.price || 0);
      }
      totalCash += parseFloat(test.cash || 0);
      totalGCash += parseFloat(test.gCash || 0);
      totalBalance += parseFloat(test.bal || 0);
    });

    return {
      totalPrice: totalPrice.toFixed(2),
      totalCash: totalCash.toFixed(2),
      totalGCash: totalGCash.toFixed(2),
      totalBalance: totalBalance.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Referrer form handling
  const {
    firstName: referrerFirstName,
    lastName: referrerLastName,
    birthday: referrerBirthday,
    sex: referrerSex,
    clinicName: referrerClinicName,
    clinicAddress: referrerClinicAddress,
    contactNo: referrerContactNo,
    setFirstName: setReferrerFirstName,
    setLastName: setReferrerLastName,
    setBirthday: setReferrerBirthday,
    setSex: setReferrerSex,
    setClinicName: setReferrerClinicName,
    setClinicAddress: setReferrerClinicAddress,
    setContactNo: setReferrerContactNo,
    resetForm: resetReferrerForm,
    validateForm: validateReferrerForm,
    getFormData: getReferrerFormData
  } = useReferrerForm();

  const addReferrerMutation = useMutation({
    mutationFn: (referrerData) => referrerAPI.createReferrer(referrerData, user?.userId || user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrers'] });
      toast.success('Referrer added successfully');
      setIsReferrerModalOpen(false);
      resetReferrerForm();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add referrer');
    }
  });

  const handleAddNewReferrer = () => {
    if (!validateReferrerForm()) return;
    const referrerData = getReferrerFormData();
    if (referrerData.birthday) {
      referrerData.birthday = referrerData.birthday || null;
    }
    addReferrerMutation.mutate(referrerData);
  };

  // Transaction handling
  const createTransactionMutation = useMutation({
    mutationFn: (transactionData) => transactionAPI.createTransaction(transactionData, user?.userId || user?.id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction saved successfully');
      setIsTransactionSummaryOpen(false);
      setSelectedTests([]);
      setTestsTable([]);
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        id: 'Regular',
        referrer: 'Out Patient',
        sex: 'Male',
        idNumber: ''
      });

      // Fetch the next mcNo from the database
      try {
        const response = await transactionAPI.getNextMcNo();

        if (response.success && response.mcNo) {
          setGeneratedMcNo(response.mcNo);
        } else {
          console.error('Invalid response from getNextMcNo after transaction:', response);
          toast.warning('Transaction saved but failed to fetch next OR#. Please refresh.');
        }
      } catch (error) {
        console.error('Error fetching next MC number after transaction:', error);
        toast.warning('Transaction saved but failed to fetch next OR#. Please refresh.');
      }
    },
    onError: (error) => {
      console.error('Transaction error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save transaction');
    }
  });

  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const today = new Date();
    const birthDate = new Date(birthdate);
    if (isNaN(birthDate.getTime())) return "Invalid Date";
    
    const birthYear = birthDate.getFullYear();
    const currentYear = today.getFullYear();
    if (birthYear < 1900 || birthYear > currentYear) return "Invalid Year";
    if (birthDate > today) return "Future Date";
    
    let age = currentYear - birthYear;
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 0 || age > 150) return "Invalid Age";
    return age;
  };

  const openTransactionSummary = () => {
    if (testsTable.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    const missingFields = [];
    if (!formData.firstName.trim()) missingFields.push("First Name");
    if (!formData.lastName.trim()) missingFields.push("Last Name");
    if (!formData.id) missingFields.push("Discount Type");
    if (!formData.birthDate) missingFields.push("Birth Date");
    if (!formData.sex) missingFields.push("Sex");
    
    // Require ID number for any discount category (not Regular)
    if (formData.id !== "Regular" && !formData.idNumber.trim()) {
      missingFields.push("ID Number");
    }

    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      if (age === "Invalid Year" || age === "Invalid Date" || age === "Future Date" || age === "Invalid Age") {
        toast.error("Please enter a valid birth date");
        return;
      }
    }

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setIsTransactionSummaryOpen(true);
  };

  const handleConfirmTransaction = () => {
    const userId = user?.userId || user?.id;
    if (!userId) {
      toast.error('Please log in again');
      return;
    }

    try {
      // Get transaction-level discount percentage from selected discount category
      const selectedDiscountCategory = discountCategories.find(cat => cat.categoryName === formData.id);
      const transactionDiscountPercentage = selectedDiscountCategory ? parseFloat(selectedDiscountCategory.percentage) : 0;

      const items = testsTable.map((test) => {
        const originalTest = selectedTests.find(st => st.testName === test.name);
        const discStr = test.disc.replace('%', '');
        const individualDiscountPercentage = parseInt(discStr) || 0;
        const originalPrice = parseFloat(originalTest.price);
        
        // Apply individual test discount first (if any)
        let priceAfterIndividualDiscount = originalPrice * (1 - individualDiscountPercentage / 100);
        
        // Then apply transaction-level discount from settings
        // Formula: discountedPrice = price × (1 - discount% / 100)
        // Example: If discount is 20%, customer saves 20%, pays 80% → price × 0.80
        const discountedPrice = transactionDiscountPercentage > 0
          ? priceAfterIndividualDiscount * (1 - transactionDiscountPercentage / 100)
          : priceAfterIndividualDiscount;

        return {
          testId: originalTest.testId,
          testName: test.name,
          departmentId: originalTest.departmentId,
          originalPrice: originalPrice,
          discountPercentage: individualDiscountPercentage,
          discountedPrice: discountedPrice,
          cashAmount: parseFloat(test.cash) || 0,
          gCashAmount: parseFloat(test.gCash) || 0,
          balanceAmount: parseFloat(test.bal) || 0,
        };
      });

      const referrerId = formData.referrer === "" || formData.referrer === "Out Patient" ? null : formData.referrer;

      // Calculate totalAmount (total paid = cash + gcash)
      const totalAmount = items.reduce((sum, item) => {
        return sum + item.cashAmount + item.gCashAmount;
      }, 0);

      // Calculate totalDiscountAmount (total amount due after discount applied)
      // This is: totalAmount × (1 - discount% / 100)
      const totalDiscountAmount = transactionDiscountPercentage > 0
        ? totalAmount * (1 - transactionDiscountPercentage / 100)
        : totalAmount;

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
        userId: userId,
        totalAmount: totalAmount,
        totalDiscountAmount: totalDiscountAmount
      };

      createTransactionMutation.mutate(transactionData);
    } catch (error) {
      toast.error(`Failed to prepare transaction: ${error.message}`);
    }
  };

  // Fetch the next MC number from database on component mount
  useEffect(() => {
    const fetchNextMcNo = async () => {
      try {
        const response = await transactionAPI.getNextMcNo();

        if (response.success && response.mcNo) {
          setGeneratedMcNo(response.mcNo);
        } else {
          console.error('Invalid response from getNextMcNo:', response);
          toast.error('Failed to fetch OR# from database. Please refresh the page.');
          setGeneratedMcNo('-----');
        }
      } catch (error) {
        console.error('Error fetching next MC number:', error);
        toast.error('Failed to fetch OR# from database. Please refresh the page.');
        setGeneratedMcNo('-----');
      }
    };

    fetchNextMcNo();
  }, []);

  if (isAuthenticating || !user) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <div className="md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex-1 p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="bg-green-800 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-2xl font-bold">New Transaction</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">OR#</span>
              <span className="bg-white text-green-800 px-4 py-1 rounded font-mono font-semibold">{generatedMcNo}</span>
            </div>
          </div>

          {/* Client Information */}
          <div className="p-6">
            <h3 className="text-green-800 font-semibold text-lg mb-4">Patient Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Birth Date</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    if (selectedDate <= today) {
                      setFormData({ ...formData, birthDate: e.target.value });
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Referrer</label>
                <select
                  value={formData.referrer}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'add-referrer') {
                      setIsReferrerModalOpen(true);
                    } else {
                      setFormData({ ...formData, referrer: value });
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                >
                  <option value="">Out Patient</option>
                  {isLoadingReferrers ? (
                    <option>Loading...</option>
                  ) : (
                    referrers.map(ref => (
                      <option key={ref.referrerId} value={ref.referrerId}>
                        Dr. {ref.lastName}
                      </option>
                    ))
                  )}
                  <option value="add-referrer">+ Add Referrer</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Discount Type</label>
                <select
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                >
                  {idTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">ID Number</label>
                <input
                  type="text"
                  value={formData.id === "Regular" ? "XXXX-XXXX" : formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  disabled={formData.id === "Regular"}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Discount</label>
                <select
                  disabled
                  value={(() => {
                    if (formData.id === 'Regular') return '0%';
                    const selectedCategory = discountCategories.find(cat => cat.categoryName === formData.id);
                    return selectedCategory ? `${selectedCategory.percentage}%` : '0%';
                  })()}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                >
                  <option>{(() => {
                    if (formData.id === 'Regular') return '0%';
                    const selectedCategory = discountCategories.find(cat => cat.categoryName === formData.id);
                    return selectedCategory ? `${selectedCategory.percentage}%` : '0%';
                  })()}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Tests */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-green-800 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Available Tests</h3>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Start typing to sort..."
                    value={searchTest}
                    onChange={(e) => setSearchTest(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
                  />
                </div>
                <button
                  onClick={() => setShowDeptFilter(!showDeptFilter)}
                  className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
                >
                  <Filter size={20} />
                </button>
              </div>

              {showDeptFilter && (
                <div className="mb-4 border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                  <div
                    className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${!selectedDepartment ? 'bg-green-100' : ''}`}
                    onClick={() => setSelectedDepartment(null)}
                  >
                    All Departments
                  </div>
                  {departments.map(dept => (
                    <div
                      key={dept.departmentId}
                      className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${selectedDepartment === dept.departmentId ? 'bg-green-100' : ''}`}
                      onClick={() => { setSelectedDepartment(dept.departmentId); setShowDeptFilter(false); }}
                    >
                      {dept.departmentName}
                    </div>
                  ))}
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredTests.map(test => (
                  <div
                    key={test.testId}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer ${
                      selectedTests.some(t => t.testId === test.testId) ? 'bg-green-600 text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTestToggle(test)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTests.some(t => t.testId === test.testId)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{test.testName}</span>
                    </div>
                    <span className="font-semibold">₱{parseFloat(test.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-green-800 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Payment Details</h3>
            </div>

            <div className="p-4">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-hide">
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                  .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                `}</style>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Test</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Cash Amount</th>
                      <th className="p-2 text-right">E-Pay Amount</th>
                      <th className="p-2 text-right">Balance</th>
                      <th className="p-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {testsTable.map((test, index) => {
                      const originalTest = selectedTests[index];
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2">{test.name}</td>
                          <td className="p-2 text-right">₱{parseFloat(originalTest?.price || 0).toFixed(2)}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={test.cash}
                              onChange={(e) => handleCashChange(index, e.target.value)}
                              className="w-full max-w-[100px] text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="p-2">
                            {!showEpayInput[index] ? (
                              <button
                                onClick={() => setShowEpayInput(prev => ({ ...prev, [index]: true }))}
                                disabled={parseFloat(test.cash) >= parseFloat(originalTest?.price || 0)}
                                className={`w-full rounded px-2 py-1 text-xs flex items-center justify-center gap-1 ${
                                  parseFloat(test.cash) >= parseFloat(originalTest?.price || 0)
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                <Plus size={14} /> Add E-Payment
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={test.gCash}
                                  onChange={(e) => handleGCashChange(index, e.target.value)}
                                  placeholder="0.00"
                                  className="w-full max-w-[100px] text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right">₱{parseFloat(test.bal).toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemoveTest(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Totals Row */}
                    {testsTable.length > 0 && (
                      <tr className="bg-gray-100 font-semibold">
                        <td className="p-2">TOTAL:</td>
                        <td className="p-2 text-right">₱{totals.totalPrice}</td>
                        <td className="p-2 text-right">₱{totals.totalCash}</td>
                        <td className="p-2 text-right">₱{totals.totalGCash}</td>
                        <td className="p-2 text-right">₱{totals.totalBalance}</td>
                        <td className="p-2"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {testsTable.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={openTransactionSummary}
                    className="bg-green-800 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
                  >
                    Confirm Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referrer Modal */}
      <ReferrerModal
        isOpen={isReferrerModalOpen}
        onClose={() => setIsReferrerModalOpen(false)}
        firstName={referrerFirstName}
        setFirstName={setReferrerFirstName}
        lastName={referrerLastName}
        setLastName={setReferrerLastName}
        birthday={referrerBirthday}
        setBirthday={setReferrerBirthday}
        sex={referrerSex}
        setSex={setReferrerSex}
        clinicName={referrerClinicName}
        setClinicName={setReferrerClinicName}
        clinicAddress={referrerClinicAddress}
        setClinicAddress={setReferrerClinicAddress}
        contactNo={referrerContactNo}
        setContactNo={setReferrerContactNo}
        validateForm={validateReferrerForm}
        onConfirm={handleAddNewReferrer}
        isLoading={addReferrerMutation.isPending}
        title="New Referrer"
        mode="add"
      />

      {/* Transaction Summary Modal */}
      {isTransactionSummaryOpen && (
        <TransactionSummaryModal
          isOpen={isTransactionSummaryOpen}
          onClose={() => setIsTransactionSummaryOpen(false)}
          transaction={{
            id: generatedMcNo,
            originalTransaction: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              birthDate: formData.birthDate,
              sex: formData.sex,
              idType: formData.id,
              idNumber: formData.id === "Regular" ? "XXXX-XXXX" : formData.idNumber || '',
              referrerId: formData.referrer === "" || formData.referrer === "Out Patient" ? null : formData.referrer,
              TestDetails: testsTable.map((test, index) => {
                const originalTest = selectedTests[index];
                const discStr = test.disc.replace('%', '');
                const individualDiscountPercentage = parseInt(discStr) || 0;
                const originalPrice = parseFloat(originalTest?.price || 0);
                
                // Get transaction-level discount percentage
                const selectedDiscountCategory = discountCategories.find(cat => cat.categoryName === formData.id);
                const transactionDiscountPercentage = selectedDiscountCategory ? parseFloat(selectedDiscountCategory.percentage) : 0;
                
                // Apply individual test discount first (if any)
                let priceAfterIndividualDiscount = originalPrice * (1 - individualDiscountPercentage / 100);
                
                // Then apply transaction-level discount from settings
                // Formula: discountedPrice = price × (1 - discount% / 100)
                // Example: If discount is 20%, customer saves 20%, pays 80% → price × 0.80
                const discountedPrice = transactionDiscountPercentage > 0
                  ? priceAfterIndividualDiscount * (1 - transactionDiscountPercentage / 100)
                  : priceAfterIndividualDiscount;
                
                return {
                  testName: test.name,
                  originalPrice: originalPrice,
                  discountPercentage: individualDiscountPercentage,
                  discountedPrice: discountedPrice,
                  cashAmount: parseFloat(test.cash) || 0,
                  gCashAmount: parseFloat(test.gCash) || 0,
                  balanceAmount: parseFloat(test.bal) || 0,
                  testId: originalTest?.testId,
                  departmentId: originalTest?.departmentId
                };
              })
            }
          }}
          isEditingSummary={false}
          editedTransaction={null}
          isLoading={createTransactionMutation.isPending}
          isRefundMode={false}
          selectedRefunds={[]}
          referrers={referrers}
          idTypeOptions={idTypeOptions}
          discountCategories={discountCategories}
          mcNoExists={false}
          isMcNoChecking={false}
          mutations={{}}
          handlers={{}}
          ConfirmButton={
            <button
              onClick={handleConfirmTransaction}
              disabled={createTransactionMutation.isPending}
              className="bg-green-800 text-white px-6 py-2 rounded hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {createTransactionMutation.isPending ? 'Saving...' : 'Confirm Transaction'}
            </button>
          }
        />
      )}
    </div>
  );
};

export default NewAddTransaction;