import React, { useState, useRef, useMemo, useEffect } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import useAuth from '../hooks/auth/useAuth'
import { ArrowUp, ArrowDown, PlusCircle } from 'lucide-react'
import { referrerAPI, transactionAPI, departmentAPI, settingsAPI } from '../services/api'
import { useQuery } from '@tanstack/react-query'
import DateSelector from '../components/transaction/DateSelector'
import ReferrerModal from '../components/referral-management/ReferrerModal'
import useReferrerForm from '../hooks/referral-management/useReferrerForm'
import { ToastContainer, toast } from 'react-toastify'
import { exportReferralsToExcel } from '../utils/referralsExporter'

const Referrals = () => {
  const { user, isAuthenticating } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sortDirection, setSortDirection] = useState('asc'); 
  const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
  const incomeDateInputRef = useRef(null);
  const {
      firstName, lastName, birthday, sex, clinicName, clinicAddress, contactNo,
      setFirstName, setLastName, setBirthday, setSex, setClinicName, setClinicAddress, setContactNo,
      resetForm, validateForm, getFormData
    } = useReferrerForm();

  // Fetch referral fee percentage from settings
  const { data: referralFeeData } = useQuery({
    queryKey: ['referralFeeSetting'],
    queryFn: async () => {
      const response = await settingsAPI.getSettingByKey('referral_fee_percentage');
      return response;
    },
    staleTime: 60000, // Cache for 1 minute
    enabled: !!user
  });

  // Get referral fee percentage (default to 12 if not found)
  const referralFeePercentage = useMemo(() => {
    if (referralFeeData?.data?.success && referralFeeData?.data?.setting) {
      return parseFloat(referralFeeData.data.setting.settingValue);
    }
    return 12; // Default to 12%
  }, [referralFeeData]);

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(true)
      return response.data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  })
  
  const departments = useMemo(() => {
    if (!departmentsData) return [];
    const depts = Array.isArray(departmentsData.data) ? departmentsData.data : 
                 (Array.isArray(departmentsData) ? departmentsData : []);
    
    return depts;
  }, [departmentsData]);
  
  const activeDepartments = useMemo(() => {
    const filtered = departments.filter(dept => dept.status?.toLowerCase() === 'active');
    return filtered;
  }, [departments])

  const { data: referrersData, isLoading: isReferrersLoading, error: referrersError, refetch: refetchReferrers } = useQuery({
    queryKey: ['referrers'],
    queryFn: async () => {
      const response = await referrerAPI.getAllReferrers(true)
      return response
    },
    enabled: !!user, 
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false 
  })
  
  const referrers = referrersData?.data?.data || []
  
  const formattedDate = useMemo(() => {
    return selectedDate.toISOString().split('T')[0]
  }, [selectedDate])
  
  
  // Get transactions for all active referrers
  const { 
    data: allReferrerTransactions = {}, 
    isLoading: isTransactionsLoading, 
    isFetching: isTransactionsFetching,
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ['referrerTransactions', formattedDate],
    queryFn: async () => {
      if (!referrers || referrers.length === 0) return {}
      
      const activeReferrers = referrers.filter(r => r.status?.toLowerCase() === 'active')
      const transactionsMap = {}
      
      await Promise.all(
        activeReferrers.map(async (referrer) => {
          try {
            const result = await transactionAPI.getTransactionsByReferrerId(
              referrer.referrerId, 
              formattedDate
            )
            
            if (result.success && result.data?.length > 0) {
              transactionsMap[referrer.referrerId] = result.data
            }
          } catch (err) {
            console.error(`Error fetching transactions for referrer ${referrer.referrerId}:`, err)
          }
        })
      )
      
      return transactionsMap
    },
    enabled: !!user && referrers.length > 0,
    staleTime: 10 * 1000, // Reduced to 10 seconds to keep data fresher
    refetchOnWindowFocus: true, 
    refetchOnMount: true,     
    refetchInterval: 60 * 1000, 
    refetchIntervalInBackground: false 
  })
  

  // Helper functions
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  }
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }
  
  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const handleReferrerSubmit = async () => {
    try {  
      const formData = getFormData();
      const response = await referrerAPI.createReferrer(formData, user.userId);
      toast.success('Referrer added successfully');

      if (response?.data?.success || response?.success) {
        await refetchReferrers();
        await refetchTransactions();
        
        setIsReferrerModalOpen(false);
        resetForm();
      } else {
        console.error('Failed to create referrer:', response);
        toast.error('Failed to create referrer. Please try again.');
      }
    } catch (error) {
      console.error('Error creating referrer:', error);
      toast.error(`Error creating referrer: ${error.message}`);
    }
  };

  const handleGenerateReferralsReport = async () => {
    try {
      await exportReferralsToExcel(
        filteredReferrers,
        allReferrerTransactions,
        renderableDepartments,
        selectedDate,
        calculateReferrerTotals,
        getTestsForDepartment,
        referralFeePercentage
      );
      toast.success('Rebate Report exported successfully!');
    } catch (error) {
      console.error('Error exporting rebate report:', error);
      toast.error('Failed to export rebate report. Please try again.');
    }
  };
  
  // Filter referrers based on search term
  const filteredReferrers = useMemo(() => {
    if (!referrers || !Array.isArray(referrers)) return []
    
    return referrers
      .filter(ref => ref.status?.toLowerCase() === 'active')
      .filter(ref => {
        const fullName = `${ref.firstName} ${ref.lastName}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase())
      })
      .sort((a, b) => {
        const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase()
        const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
  }, [referrers, searchTerm])
  
  const sortTransactions = (a, b) => {
    const aTotal = a.DepartmentRevenues?.reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0) || 0
    const bTotal = b.DepartmentRevenues?.reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0) || 0
    
    return sortDirection === 'asc' ? aTotal - bTotal : bTotal - aTotal
  }
  
  const getTestsForDepartment = (transaction, departmentId) => {
    if (!transaction?.TestDetails || !Array.isArray(transaction.TestDetails)) {
      return []
    }
    
    const targetDeptId = String(departmentId)
    return transaction.TestDetails.filter(test => {
      const testDeptId = String(test.departmentId)
      return testDeptId === targetDeptId || parseInt(testDeptId) === parseInt(targetDeptId)
    })
  }
  
  // Calculate total revenue for a referrer
  const calculateReferrerTotals = (transactions) => {
    if (!transactions || !transactions.length) return { 
      departmentTotals: {}, 
      testDetailTotals: {},
      grandTotal: 0 
    }
    
    const departmentTotals = {}
    const testDetailTotals = {}
    let grandTotal = 0
    
    transactions.forEach(transaction => {
      // Calculate test details totals by department
      if (transaction.TestDetails && Array.isArray(transaction.TestDetails)) {
        transaction.TestDetails.forEach(test => {

          const deptId = String(test.departmentId)
          const amount = parseFloat(test.discountedPrice || 0)
          
          if (!testDetailTotals[deptId]) {
            testDetailTotals[deptId] = 0
          }
          
          testDetailTotals[deptId] += amount
        })
      }
      
      if (transaction.DepartmentRevenues && Array.isArray(transaction.DepartmentRevenues)) {
        transaction.DepartmentRevenues.forEach(revenue => {
          const deptId = String(revenue.departmentId)
          const amount = parseFloat(revenue.amount || 0)
          
          if (!departmentTotals[deptId]) {
            departmentTotals[deptId] = 0
          }
          
          departmentTotals[deptId] += amount
          grandTotal += amount
        })
      } else {
        console.warn('Transaction without DepartmentRevenues:', transaction.transactionId)
      }
    })
    
    return { 
      departmentTotals, 
      testDetailTotals,
      grandTotal, 
      testDetailsByDepartment: getTestDetailsByDepartment(transactions) 
    }
  }
  
  // Group test details by department for summary display
  const getTestDetailsByDepartment = (transactions) => {
    const testDetailsByDept = {}
    
    if (!transactions || !transactions.length) return testDetailsByDept
    
    transactions.forEach(transaction => {
      if (transaction.TestDetails && Array.isArray(transaction.TestDetails)) {
        transaction.TestDetails.forEach(test => {
          const deptId = String(test.departmentId)
          
          if (!testDetailsByDept[deptId]) {
            testDetailsByDept[deptId] = []
          }
          
          testDetailsByDept[deptId].push({
            testDetailId: test.testDetailId,
            testName: test.testName,
            price: parseFloat(test.discountedPrice || 0),
            transactionId: transaction.transactionId
          })
        })
      }
    })
    
    return testDetailsByDept
  }

  // Fallback for empty departments
  useEffect(() => {
    if (!isDepartmentsLoading && activeDepartments.length === 0) {
      
      const allDepartmentIds = new Set();
      
      Object.values(allReferrerTransactions || {}).forEach(transactions => {
        if (!Array.isArray(transactions)) return;
        
        transactions.forEach(transaction => {
          if (transaction.DepartmentRevenues && Array.isArray(transaction.DepartmentRevenues)) {
            transaction.DepartmentRevenues.forEach(rev => {
              if (rev.departmentId) allDepartmentIds.add(String(rev.departmentId));
            });
          }
          
          if (transaction.TestDetails && Array.isArray(transaction.TestDetails)) {
            transaction.TestDetails.forEach(test => {
              if (test.departmentId) allDepartmentIds.add(String(test.departmentId));
            });
          }
        });
      });
      
    }
  }, [isDepartmentsLoading, activeDepartments, allReferrerTransactions]);


  const renderableDepartments = useMemo(() => {
    if (activeDepartments.length > 0) {
      return activeDepartments; 
    }
    
    const departmentMap = new Map();
    
    Object.values(allReferrerTransactions || {}).forEach(transactions => {
      if (!Array.isArray(transactions)) return;
      
      transactions.forEach(transaction => {
        if (transaction.DepartmentRevenues && Array.isArray(transaction.DepartmentRevenues)) {
          transaction.DepartmentRevenues.forEach(rev => {
            if (rev.departmentId) {
              const deptId = String(rev.departmentId);
              if (!departmentMap.has(deptId)) {
                departmentMap.set(deptId, {
                  departmentId: rev.departmentId,
                  departmentName: `Dept ${deptId}`, 
                  status: 'active'
                });
              }
            }
          });
        }
        
        // Add departments from TestDetails
        if (transaction.TestDetails && Array.isArray(transaction.TestDetails)) {
          transaction.TestDetails.forEach(test => {
            if (test.departmentId) {
              const deptId = String(test.departmentId);
              if (!departmentMap.has(deptId)) {
                departmentMap.set(deptId, {
                  departmentId: test.departmentId,
                  departmentName: `Dept ${deptId}`, // Fallback name
                  status: 'active'
                });
              }
            }
          });
        }
      });
    });
    
    const syntheticDepartments = Array.from(departmentMap.values());
    return syntheticDepartments;
  }, [activeDepartments, allReferrerTransactions]);

  if (isAuthenticating) {
    return null;
  }

  if(!user) {
    return null;
  }

  // Calculate total rebates and total referred transactions across all referrers
  const { totalRebates, totalReferredTransactions } = useMemo(() => {
    let rebatesSum = 0;
    let transactionsCount = 0;

    filteredReferrers.forEach(referrer => {
      const transactions = allReferrerTransactions[referrer.referrerId] || [];
      transactionsCount += transactions.length;

      if (transactions.length > 0) {
        const { testDetailTotals } = calculateReferrerTotals(transactions);
        const grandTotal = Object.values(testDetailTotals).reduce(
          (sum, amount) => sum + parseFloat(amount || 0), 0
        );
        rebatesSum += grandTotal * (referralFeePercentage / 100);
      }
    });

    return {
      totalRebates: rebatesSum,
      totalReferredTransactions: transactionsCount
    };
  }, [filteredReferrers, allReferrerTransactions, referralFeePercentage]);

  return (
    <div className='flex flex-col md:flex-row h-screen bg-gray-50'>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
      
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Referral</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Rebates Card */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
            <div className="bg-green-800 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Rebates</p>
              <p className="text-2xl font-bold text-gray-800">₱ {totalRebates.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Referred Transactions Card */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Referred Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{totalReferredTransactions}</p>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* Left side - Search */}
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Search..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSortDirection}
                className="bg-green-800 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
                title={`Sort by amount: ${sortDirection === 'asc' ? 'Low to High' : 'High to Low'}`}
              >
                {sortDirection === 'asc' ? (
                  <>
                    <ArrowUp size={20} className="mr-2" />
                    Sort: Low to High
                  </>
                ) : (
                  <>
                    <ArrowDown size={20} className="mr-2" />
                    Sort: High to Low
                  </>
                )}
              </button>

              {filteredReferrers.length > 0 && (
                <button 
                  onClick={handleGenerateReferralsReport}
                  className="bg-green-800 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </button>
              )}

              <button
                onClick={() => setIsReferrerModalOpen(true)}
                className="bg-green-800 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
                title="Add New Referrer"
              >
                <PlusCircle size={20} className="mr-2"/>
                Add Referrer
              </button>
            </div>
          </div>
        </div>
      

        {isReferrersLoading || isTransactionsLoading || isDepartmentsLoading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
            <p className="text-green-800 font-medium">Loading data...</p>
          </div>
        ) : referrersError ? (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{referrersError.message || 'Failed to load referrers data. Please try again.'}</p>
          </div>
        ) : filteredReferrers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No referrers found matching your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReferrers.map((referrer) => (
              <div key={referrer.referrerId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-green-800 px-4 py-3">
                  <h2 className='font-bold text-white text-lg'>
                    Dr. {referrer.firstName} {referrer.lastName}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">OR#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client Name</th>
                        {renderableDepartments.length > 0 ? renderableDepartments.map(department => (
                          <th 
                            key={`header-${department.departmentId}`} 
                            className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]"
                            title={`Department ID: ${department.departmentId}`}
                          >
                            {department.departmentName || 'Department'}
                          </th>
                        )) : (
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            No Departments Found
                          </th>
                        )}
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {allReferrerTransactions[referrer.referrerId]?.length ? (
                          [...allReferrerTransactions[referrer.referrerId]]
                            .sort(sortTransactions)
                            .map(transaction => {
                              const transactionDate = new Date(transaction.transactionDate);
                              const formattedTransactionDate = `${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(transactionDate.getDate()).padStart(2, '0')}`;
                              
                              return (
                                <tr key={transaction.transactionId} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-700">{transaction.mcNo}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{formattedTransactionDate}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {transaction.firstName} {transaction.lastName}
                                  </td>
                                  {renderableDepartments.map(department => {
                                    const deptId = String(department.departmentId);
                                    const testsForDepartment = getTestsForDepartment(transaction, deptId);
                                    
                                    const testTotalAmount = testsForDepartment.reduce(
                                      (sum, test) => sum + parseFloat(test.discountedPrice || 0), 
                                      0
                                    );
                                    
                                    return (
                                      <td 
                                        key={`${transaction.transactionId}-${deptId}`}
                                        className="px-4 py-3 text-sm text-center text-gray-700"
                                      >
                                        {testsForDepartment.length > 0 ? (
                                          <span className="font-medium">
                                            {testTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                                    {(() => {
                                      const testsForTransaction = transaction.TestDetails || [];
                                      const totalAmount = testsForTransaction.reduce(
                                        (sum, test) => sum + parseFloat(test.discountedPrice || 0),
                                        0
                                      );
                                      return totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4 + renderableDepartments.length} className="px-4 py-8 text-center text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        )}
                        
                        {/* Total Row */}
                        <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                          <td colSpan="3" className="px-4 py-3 text-sm text-green-800">
                            Referred Transactions Total:
                          </td>
                          
                          {(() => {
                            const { testDetailTotals } = allReferrerTransactions[referrer.referrerId]?.length 
                              ? calculateReferrerTotals(allReferrerTransactions[referrer.referrerId])
                              : { testDetailTotals: {} };
                            
                            return (
                              <>
                                {renderableDepartments.map(department => {
                                  const deptId = String(department.departmentId);
                                  const deptTotal = testDetailTotals[deptId] || 0;
                                  
                                  return (
                                    <td 
                                      key={`total-${deptId}`}
                                      className="px-4 py-3 text-sm text-center text-green-800"
                                    >
                                      {deptTotal > 0 ? deptTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-sm text-center text-green-800">
                                  {Object.values(testDetailTotals).reduce((sum, amt) => sum + parseFloat(amt || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </>
                            );
                          })()}
                        </tr>

                        {/* Rebates Row */}
                        <tr className="bg-yellow-100 font-semibold">
                          <td colSpan="3" className="px-4 py-3 text-sm text-green-800">
                            Rebates Total:
                          </td>
                          
                          {(() => {
                            const { testDetailTotals } = allReferrerTransactions[referrer.referrerId]?.length 
                              ? calculateReferrerTotals(allReferrerTransactions[referrer.referrerId])
                              : { testDetailTotals: {} };
                            
                            return (
                              <>
                                {renderableDepartments.map(department => {
                                  const deptId = String(department.departmentId);
                                  const deptTotal = testDetailTotals[deptId] || 0;
                                  const deptRebate = deptTotal * (referralFeePercentage / 100);
                                  
                                  return (
                                    <td 
                                      key={`rebate-${deptId}`}
                                      className="px-4 py-3 text-sm text-center text-green-800"
                                    >
                                      {deptRebate > 0 ? deptRebate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-sm text-center text-green-800 font-bold">
                                  {(() => {
                                    const grandTotal = Object.values(testDetailTotals).reduce((sum, amt) => sum + parseFloat(amt || 0), 0);
                                    const totalRebate = grandTotal * (referralFeePercentage / 100);
                                    return totalRebate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  })()}
                                </td>
                              </>
                            );
                          })()}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isReferrerModalOpen && (
          <ReferrerModal
          isOpen={isReferrerModalOpen}
          onClose={() => {
            setIsReferrerModalOpen(false);
            resetForm();
          }}
          onConfirm={handleReferrerSubmit}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          birthday={birthday}
          setBirthday={setBirthday}
          sex={sex}
          setSex={setSex}
          clinicName={clinicName}
          setClinicName={setClinicName}
          clinicAddress={clinicAddress}
          setClinicAddress={setClinicAddress}
          contactNo={contactNo}
          setContactNo={setContactNo}
          validateForm={validateForm}
          />
         
        )}
    </div>
  )
}

export default Referrals
