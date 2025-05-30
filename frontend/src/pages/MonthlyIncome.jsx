import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CirclePlus, MoreVertical } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import AddCollectibleIncomeModal from '../components/monthly/AddCollectiblesIncomeModals'
import { collectibleIncomeAPI } from '../services/api'
import { toast } from 'react-toastify';

const Monthly = () => {
  const { user, isAuthenticating } = useAuth()
  const [currentMonth, setCurrentMonth] = useState('MAR-2025');
  const navigate = useNavigate()
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCollectibles();
  }, [currentMonth, currentPage]);

  const fetchCollectibles = async () => {
    setLoading(true);
    try {
    
      const response = await collectibleIncomeAPI.getAllCollectibleIncome();
      
    
      if (response && response.data && response.data.success) {
        
        const allCollectibles = response.data.data || [];
        setTotalPages(Math.ceil(allCollectibles.length / itemsPerPage));
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedCollectibles = allCollectibles.slice(startIndex, startIndex + itemsPerPage);
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

  const handleAddIncome = () => {
    navigate('/add-income')
  }

  const handleAddCollectibles = () => {
    setIsCollectibleModalOpen(true);
  }

  const handleCollectibleSubmit = async (data) => {
    setLoading(true);
    try {
      const collectibleData = {
        ...data,
        currentUserId: user?.id
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

  const handleDeleteCollectible = async (id) => {
    try {
      const response = await collectibleIncomeAPI.deleteCollectibleIncome(id);
      if (response && response.success) {
        toast.success('Collectible income deleted successfully');
        await fetchCollectibles();
      } else {
        toast.error(response?.message || 'Failed to delete collectible income');
      }
    } catch (error) {
      console.error('Error deleting collectible income:', error);
      toast.error('An error occurred while deleting collectible income');
    }
    setActiveMenu(null);
  }

  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const GoToMonthlyExpenses = () => {
    navigate('/monthly-expenses')
  }

  const handlePrevMonth = () => {
    setCurrentMonth('FEB-2025');
  }

  const handleNextMonth = () => {
    setCurrentMonth('APR-2025');
  }

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cream-50">
      {/* Sidebar */}
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
      
      {/* Main content area with improved spacing */}
      <div className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64">
        
        <div className="bg-cream-50  border-green-800 rounded">
          
          <div className='flex justify-end mb-2'>
            <button  onClick={GoToMonthlyExpenses} 
    className="text-green-800 bg-white border-2 border-green-800 hover:bg-green-300 hover:text-white font-medium py-1 px-3 rounded flex items-center">
              Monthly Expenses <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          
          {/* Month navigation */}
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
                      <th className="p-1 border-r border-green-800 text-sm font-medium">UTZ</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Lab</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">DT</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">PE</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">ECG</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">X-Ray</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">GCash</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">SO</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Empty rows for data input */}
                    {[...Array(10)].map((_, index) => (
                      <tr key={`income-row-${index}`} className="border-b border-green-100">
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-1 border-t border-green-800 font-bold bg-green-100 text-green-800">
                TOTAL:
              </div>
            </div>
          </div>

          {/* Monthly Expense and Collectible Income Sections (side by side on larger screens) */}
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
                          <td colSpan="5" className="p-2 text-center">Loading...</td>
                        </tr>
                      ) : collectibles.length > 0 ? (
                        collectibles.map((item) => (
                          <tr key={`collectible-row-${item.companyId}`} className="border-b border-green-200">
                            <td className="p-1 border-r border-green-200 text-center">{item.companyName}</td>
                            <td className="p-1 border-r border-green-200 text-center">{item.coordinatorName}</td>
                            <td className="p-1 border-r border-green-200 text-center">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="p-1 border-r border-green-200 text-center">
                              {parseFloat(item.totalIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1 text-center relative">
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
                                        onClick={() => handleEditCollectible(item.companyId)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                          <td colSpan="5" className="p-2 text-center text-gray-500">No collectible income records found</td>
                        </tr>
                      )}
                      
                      {!loading && collectibles.length < 5 && 
                        [...Array(5 - collectibles.length)].map((_, index) => (
                          <tr key={`empty-collectible-row-${index}`} className={collectibles.length === 0 ? "" : "border-b border-green-200"}>
                            <td className={collectibles.length === 0 ? "p-1" : "p-1 border-r border-green-200"}></td>
                            <td className={collectibles.length === 0 ? "p-1" : "p-1 border-r border-green-200"}></td>
                            <td className={collectibles.length === 0 ? "p-1" : "p-1 border-r border-green-200"}></td>
                            <td className={collectibles.length === 0 ? "p-1" : "p-1 border-r border-green-200"}></td>
                            <td className="p-1"></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-2 border-t border-green-800 bg-green-100">
                  <div className="p-1 font-bold text-green-800">
                    TOTAL: {collectibles.length > 0 ? 
                      collectibles.reduce((sum, item) => sum + parseFloat(item.totalIncome), 0)
                        .toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
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

          {/* Generate Report Button */}
          <div className="flex justify-end p-2">
            <button className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600">
              Generate Report
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AddCollectibleIncomeModal
        isOpen={isCollectibleModalOpen}
        onClose={() => setIsCollectibleModalOpen(false)}
        onSubmit={handleCollectibleSubmit}
      />
      
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
