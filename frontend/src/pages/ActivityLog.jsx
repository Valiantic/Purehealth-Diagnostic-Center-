import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, RefreshCw, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'
import { activityLogAPI } from '../services/api'
import { useQuery } from '@tanstack/react-query'

const ActivityLog = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(7) 
  const [selectedDate, setSelectedDate] = useState('')
  const dateInputRef = useRef(null)

  // Debounce search term to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: logsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['activityLogs', debouncedSearchTerm, selectedDate],
    queryFn: async () => {
      const params = {};
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      if (selectedDate) {
        params.date = selectedDate;
      }
  
      const response = await activityLogAPI.getAllLogs(params);
      return response.data;
    },
    staleTime: 10000, 
    refetchInterval: 15000,
    retry: 2
  })

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, debouncedSearchTerm]);

  if (isAuthenticating) {
    return null;
  }
  if (!user) {
    return null;
  }
 
  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Activity';

  const handleRefresh = () => {
    refetch();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleDateFilterClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  const totalPages = Math.ceil(logsData?.logs?.length / itemsPerPage);

  const indexOfLastLog = currentPage * itemsPerPage;
  const indexOfFirstLog = indexOfLastLog - itemsPerPage;
  const currentLogs = logsData?.logs ? logsData.logs.slice(indexOfFirstLog, indexOfLastLog) : [];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
     
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={tabsConfig} />
          
          {activeTab === 'Activity' && (
            <>
              {/* Improved controls layout with filter and search at top right */}
              <div className="p-2 mt-4 mb-4">
                <div className="flex justify-between items-center">
                  {/* Refresh button stays on left */}
                  <button 
                    className="bg-green-800 text-white p-2 rounded-full hover:bg-green-600 flex-shrink-0"
                    onClick={handleRefresh}
                    title="Refresh logs"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                  
                  {/* Filter and search aligned to right */}
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    {/* Date Filter */}
                    <div className="relative w-full sm:w-auto">
                      <button 
                        onClick={handleDateFilterClick}
                        className="border-2 border-green-800 bg-white text-green-800 rounded-lg px-3 py-2 text-sm md:text-base flex items-center w-full sm:w-auto justify-between"
                        type="button"
                      >
                        <span className="truncate pr-1">
                          {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Filter by Date'}
                        </span>
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                      </button>
                      
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="sr-only"
                      />
                    </div>

                    {/* Search input */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search by Activity..."
                        className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          className="absolute right-9 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={clearSearch}
                          title="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active filters indicator */}
              {selectedDate && (
                <div className="px-2 mb-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Active filter:</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                      Date: {new Date(selectedDate).toLocaleDateString()}
                      <button 
                        onClick={clearDateFilter}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                </div>
              )}

              <div className="p-2">
                <div className="bg-green-800 p-2 rounded-t">
                  <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Activity Log</h1>
                </div>
                <div className="border border-green-800 rounded-b">
                
                  {/* Replaced nested scrolling containers with single responsive table container */}
                  <div className="overflow-auto w-full" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                    <table className="w-full text-sm table-fixed">
                      <thead className="sticky top-0 bg-green-100 z-10">
                        <tr className="border-b border-green-800">
                          <th className="p-1 border-r border-green-800 text-sm font-medium w-[15%] sm:w-[15%]">User</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium hidden sm:table-cell w-[10%]">Role</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium w-[15%] sm:w-[10%]">Time</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium w-[15%] sm:w-[10%]">Date</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium w-[55%]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="5" className="text-center p-4">Loading activity logs...</td>
                          </tr>
                        ) : isError ? (
                          <tr>
                            <td colSpan="5" className="text-center p-4 text-red-500">Error: {error.message}</td>
                          </tr>
                        ) : !logsData?.logs?.length ? (
                          <tr>
                            <td colSpan="5" className="text-center p-4">No activity logs found</td>
                          </tr>
                        ) : (
                          currentLogs.map(log => (
                            <tr key={log.logId} className="border-b border-green-200">
                              <td className="p-1 pl-2 border-r border-green-200 truncate">
                                {log.user?.name || 'System'}
                              </td>
                              <td className="p-1 border-r border-green-200 text-center hidden sm:table-cell">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    log.user?.role === 'admin'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {log.user?.role
                                    ? log.user.role === 'admin'
                                      ? 'Admin'
                                      : 'Receptionist'
                                    : 'SYSTEM'}
                                </span>
                              </td>
                              <td className="p-1 border-r border-green-200 text-center">
                                {log.time}
                              </td>
                              <td className="p-1 border-r border-green-200 text-center">
                                {log.date}
                              </td>
                              <td className="p-1 pl-2 sm:pl-4 border-r border-green-200 break-words">
                                {log.details}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination controls */}
                {logsData?.logs?.length > itemsPerPage && (
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
                        {/* Create a sliding window of page numbers */}
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


                {/* Generate Report button */}
                <div className="mt-4 flex flex-col md:flex-row justify-end">
                  <div className="flex flex-wrap items-center mb-4 md:mb-0">
                    <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                      Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLog
