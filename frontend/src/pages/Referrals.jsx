import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { referrerAPI, transactionAPI, departmentAPI } from '../services/api'
import { useQuery } from '@tanstack/react-query'
import DateSelector from '../components/transaction/DateSelector'

const Referrals = () => {
  const { user, isAuthenticating } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sortDirection, setSortDirection] = useState('asc'); 
  const incomeDateInputRef = useRef(null);
  
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

  const { data: referrersData, isLoading: isReferrersLoading, error: referrersError } = useQuery({
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
  const { data: allReferrerTransactions = {}, isLoading: isTransactionsLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
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

  return (
    <div className='flex flex-col md:flex-row h-screen'>
     <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
      
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>

        {/* Search Bar - Now outside the table */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-4 gap-2 pr-2">

           <button className="ml-2 bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600">
            Generate Report
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          
          <div className="relative w-full sm:w-auto">
            <button 
            onClick={toggleSortDirection}
            className="border-2 border-green-800 bg-white text-green-800 rounded-lg px-4 py-1 md:py-2 text-sm md:text-base flex items-center w-full sm:w-auto justify-between hover:bg-green-50"
          >
            <span>Amount </span>
            {sortDirection === 'asc' ? (
           <ArrowUp size={16} className="ml-2" />
            ) : (
           <ArrowDown size={16} className="ml-2" />
           )}
          </button>
         </div>

         <div className='relative w-full sm:w-auto'>
            <DateSelector 
            date={selectedDate}
            onDateChange={handleDateChange}
            inputRef={incomeDateInputRef}
            className='border-2 border-green-800 bg-white text-green-800 rounded-lg px-4 py-1  text-sm md:text-base w-full sm:w-auto'
            />
         </div>

          <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Doctor..."
            className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          </div>

          </div>
        </div>
      

        {isReferrersLoading || isTransactionsLoading || isDepartmentsLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-green-800 font-medium">Loading data...</p>
          </div>
        ) : referrersError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{referrersError.message || 'Failed to load referrers data. Please try again.'}</p>
          </div>
        ) : filteredReferrers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No referrers found matching your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredReferrers.map((referrer) => (
              <div key={referrer.referrerId} className="p-2">
                <div className="bg-green-800 p-2 rounded-t">
                  <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>
                    Dr. {referrer.firstName} {referrer.lastName}
                  </h1>
                </div>
                <div className="border border-green-800 rounded-b">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-800 bg-green-100">
                          <th className="p-1 border-r border-green-800 text-sm font-medium">OR#</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Patient Name</th>
                          {renderableDepartments.length > 0 ? renderableDepartments.map(department => (
                            <th 
                              key={`header-${department.departmentId}`} 
                              className="p-1 border-r border-green-800 text-sm font-medium text-center min-w-[100px]"
                              title={`Department ID: ${department.departmentId} (${typeof department.departmentId})`}
                            >
                              {department.departmentName || 'Department'}
                            </th>
                          )) : (
                            <th className="p-1 border-r border-green-800 text-sm font-medium text-center">
                              No Departments Found
                            </th>
                          )}
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Gross</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReferrerTransactions[referrer.referrerId]?.length ? (
                          // Sort transactions based on amount if needed
                          [...allReferrerTransactions[referrer.referrerId]]
                            .sort(sortTransactions)
                            .map(transaction => {
                              // Calculate transaction total from test details instead of department revenues
                              const transactionTotal = transaction.TestDetails?.reduce(
                                (sum, test) => sum + parseFloat(test.discountedPrice || 0), 0
                              ) || 0;
                              
                              return (
                                <tr key={transaction.transactionId} className="border-b border-green-200">
                                  <td className="p-1 text-center border-r border-green-200 bg-white">{transaction.mcNo}</td>
                                  <td className="p-1 text-center border-r border-green-200 bg-white">
                                    {transaction.firstName} {transaction.lastName}
                                  </td>
                                  {renderableDepartments.map(department => {
                                    const deptId = String(department.departmentId);
                                    const testsForDepartment = getTestsForDepartment(transaction, deptId);
                                    
                                    // Calculate total test amount for this department in this transaction
                                    const testTotalAmount = testsForDepartment.reduce(
                                      (sum, test) => sum + parseFloat(test.discountedPrice || 0), 
                                      0
                                    );
                                    
                                    return (
                                      <td 
                                        key={`${transaction.transactionId}-${deptId}`}
                                        className="p-1 border-r border-green-200 bg-white"
                                      >
                                        {/* Department cell with department name in a tooltip */}
                                        <div title={`Department: ${department.departmentName}`} className="text-center">
                                          {testsForDepartment.length > 0 ? (
                                            <div className="text-center font-medium">
                                              {/* Display only the amount without peso sign */}
                                              {testTotalAmount.toFixed(2)}
                                            </div>
                                          ) : (
                                            /* Use a non-breaking space to prevent cell collapse without showing a box */
                                            <>&nbsp;</>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="p-1 bg-white text-center font-medium">
                                    {transactionTotal.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr className="border-b border-green-200">
                            <>
                              <td colSpan={2} className="p-2 text-center bg-white text-gray-500">
                                No transactions found
                              </td>
                              {/* Empty cells for each department column to maintain table structure */}
                              {renderableDepartments.length > 0 ? renderableDepartments.map(dept => (
                                <td key={`empty-${dept.departmentId}`} className="p-1 border-r border-green-200 bg-whitetext-center" style={{ minWidth: '100px' }}>
                                  {/* Use non-breaking space to maintain cell structure without showing boxes */}
                                  <span title={`Department: ${dept.departmentName} (${dept.departmentId})`}>&nbsp;</span>
                                </td>
                              )) : (
                                <td className="p-1 border-r border-green-200 bg-white text-center text-gray-500">No departments found</td>
                              )}
                              <td className="p-1 border-r border-green-200 bg-white"></td>
                            </>
                          </tr>
                        )}
                        
                        {/* Total rebates row as part of the same table */}
                        <tr className="bg-green-100 border-t border-green-800">
                          <td colSpan="2" className="p-1 border-r border-green-800 font-bold text-green-800">
                            TOTAL REBATES:
                          </td>
                          
                          {(() => {
                            // Get the data whether there are transactions or not
                            const { testDetailTotals, testDetailsByDepartment } = allReferrerTransactions[referrer.referrerId]?.length 
                              ? calculateReferrerTotals(allReferrerTransactions[referrer.referrerId])
                              : { testDetailTotals: {}, testDetailsByDepartment: {} };
                            
                            // Calculate grand total from test details
                            const grandTotal = Object.values(testDetailTotals).reduce(
                              (sum, amount) => sum + parseFloat(amount || 0), 0
                            );
                            
                            // Always render consistent columns regardless of data availability
                            return (
                              <>
                                {/* Department total columns */}
                                {renderableDepartments.map(department => {
                                  const deptId = String(department.departmentId);
                                  const deptTotal = testDetailTotals[deptId] || 0;
                                  
                                  return (
                                    <td 
                                      key={`total-${deptId}`}
                                      className="p-1 border-r border-green-800 text-center font-bold text-green-800"
                                      style={{ minWidth: '100px' }}
                                    >
                                      {/* Display department total if greater than 0, otherwise render &nbsp; to prevent cell collapse */}
                                      {deptTotal > 0 ? deptTotal.toFixed(2) : <>&nbsp;</>}
                                    </td>
                                  );
                                })}
                                
                                {/* Grand total column */}
                                <td className="p-1 text-center font-bold text-green-800">
                                  {allReferrerTransactions[referrer.referrerId]?.length ? grandTotal.toFixed(2) : "0.00"}
                                </td>
                              </>
                            );
                          })()}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      
      </div>
    </div>
  )
}

export default Referrals
