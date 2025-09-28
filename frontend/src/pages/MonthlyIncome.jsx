import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CirclePlus, MoreVertical } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import useAuth from '../hooks/auth/useAuth'
import useProtectedAction from '../hooks/auth/useProtectedAction'
import WebAuthnModal from '../components/auth/WebAuthnModal'
import CollectibleIncomeModal from '../components/monthly-income/CollectiblesIncomeModals'
import { collectibleIncomeAPI, monthlyIncomeAPI } from '../services/api'
import { toast, ToastContainer } from 'react-toastify';
import { exportMonthlyIncomeToExcel } from '../utils/monthlyIncomeExporter';
import 'react-toastify/dist/ReactToastify.css';

const Monthly = () => {
  const { user, isAuthenticating } = useAuth()
  const navigate = useNavigate()
  const {
    goToAddTransaction,
    isModalOpen,
    isAuthenticating: isWebAuthnAuthenticating,
    error: webAuthnError,
    pendingAction,
    executeAuthentication,
    cancelAuthentication,
    clearError
  } = useProtectedAction()
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [selectedCollectible, setSelectedCollectible] = useState(null);
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  
  // Monthly income state
  const [monthlyData, setMonthlyData] = useState({
    departments: [],
    dailyIncome: []
  });
  const [monthlySummary, setMonthlySummary] = useState({
    totalGross: 0,
    totalGCash: 0,
    totalCash: 0,
    departmentTotals: {},
    departments: []
  });
  const [dataLoading, setDataLoading] = useState(false);
  
  // Current month/year state
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1, // 1-12
      year: now.getFullYear()
    };
  });
  
  // Format current month for display
  const [currentMonth, setCurrentMonth] = useState('');
  
  useEffect(() => {
    // Format the current month for display
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    setCurrentMonth(`${monthNames[currentDate.month - 1]}-${currentDate.year}`);
    
    // Load data when month/year changes
    fetchMonthlyIncomeData();
    fetchCollectibles();
  }, [currentDate.month, currentDate.year, currentPage]);

  const fetchCollectibles = async () => {
    setLoading(true);
    try {``
      const response = await collectibleIncomeAPI.getAllCollectibleIncome();
      
      if (response && response.data && response.data.success) {
        const allCollectibles = response.data.data || [];
        setTotalPages(Math.ceil(allCollectibles.length / itemsPerPage));
        
        const filteredCollectibles = allCollectibles.filter(item => {
          const itemDate = new Date(item.dateConducted);
          return itemDate.getMonth() + 1 === currentDate.month && 
                  itemDate.getFullYear() === currentDate.year;
        })

        setTotalPages(Math.ceil(filteredCollectibles.length / itemsPerPage));
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedCollectibles = filteredCollectibles.slice(startIndex, startIndex + itemsPerPage);
        setCollectibles(paginatedCollectibles);
      } else {
        console.error("Failed response:", response);
        toast.error(`Failed to fetch collectible income data`);
        setCollectibles([]);
      }
    } catch (error) {
      console.error('Error details:', error);
      toast.error(`Error loading collectible income: ${error.message}`);
      setCollectibles([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthlyIncomeData = async () => {
    setDataLoading(true);
    try {
      // Get monthly income data
      const incomeResponse = await monthlyIncomeAPI.getMonthlyIncome(
        currentDate.month,
        currentDate.year
      );
      
      if (incomeResponse && incomeResponse.data && incomeResponse.data.success) {
        setMonthlyData(incomeResponse.data.data);
      } else {
        toast.error('Failed to fetch monthly income data');
        setMonthlyData({ departments: [], dailyIncome: [] });
      }
      
      // Get summary data
      const summaryResponse = await monthlyIncomeAPI.getMonthlyIncomeSummary(
        currentDate.month,
        currentDate.year
      );
      
      if (summaryResponse && summaryResponse.data && summaryResponse.data.success) {
        setMonthlySummary(summaryResponse.data.data);
      } else {
        toast.error('Failed to fetch monthly summary data');
        setMonthlySummary({
          totalGross: 0,
          totalGCash: 0, 
          totalCash: 0,
          departmentTotals: {},
          departments: []
        });
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error(`Error: ${error.message || 'Failed to load monthly data'}`);
    } finally {
      setDataLoading(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddIncome = goToAddTransaction({
    message: 'Please authenticate to add a new transaction'
  })

  const handleAddCollectibles = () => {
    setModalMode('add');
    setSelectedCollectible(null);
    setIsCollectibleModalOpen(true);
  }

  const handleEditCollectible = (collectible) => {
    setModalMode('edit');
    setSelectedCollectible(collectible);
    setIsCollectibleModalOpen(true);
    setActiveMenu(null); 
  }

  const handleCollectibleSubmit = async (data) => {
    setLoading(true);
    try {
      const collectibleData = {
        ...data,
        currentUserId: user?.userId || user?.id 
      };

      const response = await collectibleIncomeAPI.createCollectibleIncome(collectibleData);
       
      if (response?.data?.success) {
        toast.success('Collectible income added successfully');
        await fetchCollectibles();
      } else {
        toast.error(response?.data?.message || 'Failed to add collectible income');
      }
    } catch (error) {
      console.error('Error adding collectible income:', error);
      toast.error(`Error: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
      setIsCollectibleModalOpen(false);
    }
  }

  const handleCollectibleUpdate = async (data) => {
    setLoading(true);
    try {
      const updateData = {
        ...data,
        currentUserId: user?.userId || user?.id 
      };

      const response = await collectibleIncomeAPI.updateCollectibleIncome(selectedCollectible.companyId, updateData);
       
      if (response?.data?.success) {
        toast.success('Collectible income updated successfully');
        await fetchCollectibles();
      } else {
        toast.error(response?.data?.message || 'Failed to update collectible income');
      }
    } catch (error) {
      console.error('Error updating collectible income:', error);
      toast.error(`Error: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
      setIsCollectibleModalOpen(false);
      setSelectedCollectible(null);
    }
  }

  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const GoToMonthlyExpenses = () => {
    navigate('/monthly-expenses')
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month === 1 ? 12 : prev.month - 1;
      const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month === 12 ? 1 : prev.month + 1;
      const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  }

  const handleGenerateReport = async () => {
    try {
      // Get all collectibles for the current month (not paginated)
      const response = await collectibleIncomeAPI.getAllCollectibleIncome();
      let allCollectibles = [];
      
      if (response && response.data && response.data.success) {
        const allData = response.data.data || [];
        allCollectibles = allData.filter(item => {
          const itemDate = new Date(item.dateConducted);
          return itemDate.getMonth() + 1 === currentDate.month && 
                 itemDate.getFullYear() === currentDate.year;
        });
      }

      await exportMonthlyIncomeToExcel(monthlyData, monthlySummary, allCollectibles, currentMonth);
      toast.success('Monthly Income Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format dates in DD-MM-YY format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Get the number of days in the current month
  const daysInMonth = new Date(currentDate.year, currentDate.month, 0).getDate();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cream-50">
      
      {/* Toast Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Sidebar */}
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
      
      {/* Main content area with improved spacing */}
      <div className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64">
        
        <div className="bg-cream-50 border-green-800 rounded">
          
          <div className='flex justify-end mb-2'>
            <button onClick={GoToMonthlyExpenses} 
              className="text-green-800 bg-white border-2 border-green-800 hover:bg-green-300 hover:text-white font-medium py-1 px-3 rounded flex items-center">
              Monthly Expenses <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          
          {/* Month navigation - improved to match design */}
          <div className="flex justify-center items-center py-2">
            <div className="flex border border-green-800 rounded overflow-hidden">
              <button 
                onClick={handlePrevMonth}
                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center text-sm"
              >
               <ChevronLeft size={20} color="white" />
              </button>
              <div className="px-4 py-1 font-medium border-l border-r border-green-800 text-green-800">{currentMonth}</div>
              <button 
                onClick={handleNextMonth}
                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center text-sm"
              >
               <ChevronRight size={20} color="white" />
              </button>
            </div>
          </div>

          {/* Monthly Income Table */}
          <div className="p-2">
            <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
              Monthly Income
              <button onClick={handleAddIncome} className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <CirclePlus/>
              </button>
            </div>
            <div className="border border-green-800 rounded-b">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-800 bg-green-100">
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Day</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Gross</th>
                      {monthlyData.departments.map(dept => (
                        <th key={dept.id} className="p-1 border-r border-green-800 text-sm font-medium">
                          {dept.name}
                        </th>
                      ))}
                      <th className="p-1 border-r border-green-800 text-sm font-medium">GCash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr>
                        <td colSpan={monthlyData.departments.length + 4} className="p-2 text-center bg-white">
                          Loading data...
                        </td>
                      </tr>
                    ) : monthlyData.dailyIncome.length > 0 ? (
                      monthlyData.dailyIncome.map((day) => (
                        <tr key={day.date} className="border-b border-green-100">
                          <td className="p-1 border-r border-green-200 text-center bg-white">{formatDate(day.date)}</td>
                          <td className="p-1 border-r border-green-200 text-center bg-white">{formatCurrency(day.grossAmount)}</td>
                          {monthlyData.departments.map(dept => (
                            <td key={`${day.date}-${dept.id}`} className="p-1 border-r border-green-200 text-center bg-white">
                              {formatCurrency(day.departments[dept.id])}
                            </td>
                          ))}
                          <td className="p-1 border-r border-green-200 text-center bg-white">{formatCurrency(day.gCashAmount)}</td>
                          
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={monthlyData.departments.length + 4} className="p-2 text-center text-gray-500 bg-white">
                          No income data available for this month
                        </td>
                      </tr>
                    )}
                    
                    {/* Empty rows to fill space if needed */}
                    {!dataLoading && monthlyData.dailyIncome.length < 10 && 
                      [...Array(10 - monthlyData.dailyIncome.length)].map((_, index) => (
                        <tr key={`empty-row-${index}`} className="border-b border-green-100">
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          {monthlyData.departments.map(dept => (
                            <td key={`empty-${index}-${dept.id}`} className="p-1 border-r border-green-200 bg-white"></td>
                          ))}
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                        </tr>
                      ))
                    }
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-green-800 bg-green-100 font-bold">
                      <td className="p-1 border-r border-green-800 text-center">TOTAL:</td>
                      <td className="p-1 border-r border-green-800 text-center">{formatCurrency(monthlySummary.totalGross)}</td>
                      {monthlyData.departments.map(dept => (
                        <td key={`total-${dept.id}`} className="p-1 border-r border-green-800 text-center">
                          {formatCurrency(monthlySummary.departmentTotals[dept.id])}
                        </td>
                      ))}
                      <td className="p-1 border-r border-green-800 text-center">{formatCurrency(monthlySummary.totalGCash)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Collectible Income Section */}
          <div className="md:flex p-2 gap-2">
            {/* Collectible Income */}
            <div className="md:w-1/2">
              <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
                <span>Collectible Income</span>
                <button onClick={handleAddCollectibles} className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <CirclePlus/>
                </button>
              </div>
              <div className="border border-green-800 rounded-b">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-800 bg-green-100">
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Company</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Coordinator</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Date</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Income</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="p-2 text-center bg-white">Loading...</td>
                        </tr>
                      ) : collectibles.length > 0 ? (
                        collectibles.map((item) => (
                          <tr key={`collectible-row-${item.companyId}`} className="border-b border-green-200">
                            <td className="p-1 border-r border-green-200 text-center bg-white">{item.companyName}</td>
                            <td className="p-1 border-r border-green-200 text-center bg-white">{item.coordinatorName}</td>
                            <td className="p-1 border-r border-green-200 text-center bg-white">{new Date(item.dateConducted).toLocaleDateString()}</td>
                            <td className="p-1 border-r border-green-200 text-center bg-white">
                              {formatCurrency(item.totalIncome)}
                            </td>
                            <td className="p-1 text-center relative bg-white">
                              <button 
                                className="text-green-800 hover:text-green-600" 
                                onClick={() => toggleMenu(item.companyId)}
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {activeMenu === item.companyId && (
                                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <ul className="py-1">
                                    <li>
                                      <button 
                                        onClick={() => handleEditCollectible(item)}
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100"
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-2 text-center text-gray-500 bg-white">No collectible income records found</td>
                        </tr>
                      )}
                      
                      {!loading && collectibles.length < 5 && 
                        [...Array(5 - collectibles.length)].map((_, index) => (
                          <tr key={`empty-collectible-row-${index}`} className={collectibles.length === 0 ? "" : "border-b border-green-200"}>
                            <td className={collectibles.length === 0 ? "p-1 bg-white" : "p-1 border-r border-green-200 bg-white"}></td>
                            <td className={collectibles.length === 0 ? "p-1 bg-white" : "p-1 border-r border-green-200 bg-white"}></td>
                            <td className={collectibles.length === 0 ? "p-1 bg-white" : "p-1 border-r border-green-200 bg-white"}></td>
                            <td className={collectibles.length === 0 ? "p-1 bg-white" : "p-1 border-r border-green-200 bg-white"}></td>
                            <td className="p-1 bg-white"></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-2 border-t border-green-800 bg-green-100">
                  <div className="p-1 font-bold text-green-800">
                    TOTAL: {formatCurrency(collectibles.reduce((sum, item) => sum + parseFloat(item.totalIncome || 0), 0))}
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={goToPreviousPage} 
                      disabled={currentPage === 1}
                      className={`h-8 w-8 flex items-center justify-center rounded-l border border-green-800 ${
                        currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-800 text-white hover:bg-green-700'
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="h-8 min-w-[3rem] px-2 flex items-center justify-center bg-white border-t border-b border-green-800 text-green-800 font-medium">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`h-8 w-8 flex items-center justify-center rounded-r border border-green-800 ${
                        currentPage === totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-800 text-white hover:bg-green-700'
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Report Button - Only show if there's data */}
          {(monthlyData.dailyIncome.length > 0 || collectibles.length > 0) && (
            <div className="flex justify-end p-2">
              <button 
                onClick={handleGenerateReport}
                className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600"
              >
                Generate Report
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <CollectibleIncomeModal
        isOpen={isCollectibleModalOpen}
        onClose={() => {
          setIsCollectibleModalOpen(false);
          setSelectedCollectible(null);
          setModalMode('add');
        }}
        onSubmit={handleCollectibleSubmit}
        onUpdate={handleCollectibleUpdate}
        userId={user?.userId || user?.id}
        mode={modalMode}
        initialData={selectedCollectible}
      />
      
      {/* WebAuthn Authentication Modal */}
      <WebAuthnModal
        isOpen={isModalOpen}
        isAuthenticating={isWebAuthnAuthenticating}
        error={webAuthnError}
        message={pendingAction?.message}
        onAuthenticate={executeAuthentication}
        onCancel={cancelAuthentication}
        onClearError={clearError}
      />
      
      {/* Close dropdown menus when clicking outside */}
      {activeMenu && (
        <div 
          className="fixed inset-0 h-full w-full z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  )
}

export default Monthly
