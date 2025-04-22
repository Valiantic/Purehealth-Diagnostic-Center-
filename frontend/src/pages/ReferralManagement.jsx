import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, PlusCircle, X, Calendar, MoreVertical, Edit, Check, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'
import { referrerAPI } from '../services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ReferralManagement = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState('asc'); 
  
  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('Male');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [contactNo, setContactNo] = useState('');
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  
  // State for kebab menu
  const [activeMenu, setActiveMenu] = useState(null);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // Fetch referrers using React Query
  const {
    data: referrersData = { data: [] },
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['referrers', sortDirection, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        const response = await referrerAPI.searchReferrers({ 
          search: searchQuery,
          sort: sortDirection
        });
        return response.data;
      } else {
        const response = await referrerAPI.getAllReferrers(true);
        // If we have data but need to sort client-side
        if (response.data && response.data.data) {
          const sortedData = [...response.data.data].sort((a, b) => {
            // Sort by firstName instead of lastName
            const compareResult = a.firstName.localeCompare(b.firstName);
            return sortDirection === 'asc' ? compareResult : -compareResult;
          });
          response.data.data = sortedData;
        }
        return response.data;
      }
    },
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2
  });

  // Create referrer mutation
  const addReferrerMutation = useMutation({
    mutationFn: (referrerData) => 
      referrerAPI.createReferrer(referrerData, user.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrers'] });
      toast.success('Referrer added successfully');
      closeAddModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add referrer');
    }
  });

  // Update referrer mutation 
  const updateReferrerMutation = useMutation({
    mutationFn: (data) => 
      referrerAPI.updateReferrer(data.id, data.referrerData, user.userId, data.actionType || 'UPDATE_REFERRER_DETAILS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrers'] });
      
      // Show a single consistent toast message regardless of what was updated
      toast.success('Referrer updated successfully');
      
      closeEditModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update referrer');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    // The query will be refetched automatically due to the queryKey dependency
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    // The query will be refetched automatically due to the queryKey dependency
  };

  // Open add modal with empty fields
  const openAddModal = () => {
    setFirstName('');
    setLastName('');
    setBirthday('');
    setSex('Male');
    setClinicName('');
    setClinicAddress('');
    setContactNo('');
    setIsAddModalOpen(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Handle referrer creation
  const handleAddReferrer = async () => {
    // Validate required fields before submission
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    
    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    // Format birthday as YYYY-MM-DD for API
    const formattedBirthday = birthday ? birthday : null;
    
    addReferrerMutation.mutate({
      firstName,
      lastName,
      birthday: formattedBirthday,
      sex,
      clinicName,
      clinicAddress,
      contactNo
    });
  };

  // Open edit modal with selected referrer data
  const openEditModal = (referrer) => {
   
    const originalReferrer = {...referrer};
    setSelectedReferrer(originalReferrer);
    
    // Set form field values
    setFirstName(referrer.firstName);
    setLastName(referrer.lastName);
    setBirthday(referrer.birthday ? new Date(referrer.birthday).toISOString().split('T')[0] : '');
    setSex(referrer.sex || 'Male');
    setClinicName(referrer.clinicName || '');
    setClinicAddress(referrer.clinicAddress || '');
    setContactNo(referrer.contactNo || '');
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedReferrer(null);
  };

  // Handle referrer update with status
  const handleUpdateReferrer = async () => {
    // Validate required fields before submission
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    
    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    // Format birthday as YYYY-MM-DD for API
    const formattedBirthday = birthday ? birthday : null;
    
    // Get original values for comparison
    const originalValues = {
      firstName: selectedReferrer.firstName || '',
      lastName: selectedReferrer.lastName || '',
      birthday: selectedReferrer.birthday ? new Date(selectedReferrer.birthday).toISOString().split('T')[0] : null,
      sex: selectedReferrer.sex || 'Male',
      clinicName: selectedReferrer.clinicName || '',
      clinicAddress: selectedReferrer.clinicAddress || '',
      contactNo: selectedReferrer.contactNo || '',
      status: (selectedReferrer.originalStatus || '').toLowerCase()
    };
    
    // Normalize form values for more accurate comparison
    const currentValues = {
      firstName: firstName || '',
      lastName: lastName || '',
      birthday: formattedBirthday,
      sex: sex || 'Male',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || '',
      contactNo: contactNo || '',
      status: (selectedReferrer.status || '').toLowerCase() 
    };
    
    // Check if anything other than status has changed
    const detailsChanged = 
      currentValues.firstName !== originalValues.firstName ||
      currentValues.lastName !== originalValues.lastName ||
      currentValues.birthday !== originalValues.birthday ||
      currentValues.sex !== originalValues.sex ||
      currentValues.clinicName !== originalValues.clinicName ||
      currentValues.clinicAddress !== originalValues.clinicAddress ||
      currentValues.contactNo !== originalValues.contactNo;
    
    // Check if status has changed - use lowercase for comparison
    const statusChanged = originalValues.status !== currentValues.status;
    
    console.log('Original status:', originalValues.status);
    console.log('Current status:', currentValues.status); 
    console.log('Details changed:', detailsChanged);
    console.log('Status changed:', statusChanged);
    
    // Determine the appropriate action type based on what changed
    let actionType = 'UPDATE_REFERRER_DETAILS';
    
    if (statusChanged && !detailsChanged) {
      actionType = currentValues.status === 'active' ? 'ACTIVATE_REFERRER' : 'DEACTIVATE_REFERRER';
    } else if (statusChanged && detailsChanged) {
      actionType = 'UPDATE_REFERRER_ALL';
    }
    
    updateReferrerMutation.mutate({
      id: selectedReferrer.referrerId,
      referrerData: {
        firstName: currentValues.firstName,
        lastName: currentValues.lastName,
        birthday: currentValues.birthday,
        sex: currentValues.sex,
        clinicName: currentValues.clinicName,
        clinicAddress: currentValues.clinicAddress,
        contactNo: currentValues.contactNo,
        status: currentValues.status,
        statusOnly: statusChanged && !detailsChanged
      },
      actionType: actionType 
    });
  };
wn
  const handleStatusChange = (e) => {
    const normalizedStatus = e.target.value.toLowerCase();
    
    if (!selectedReferrer.originalStatus) {
      setSelectedReferrer({
        ...selectedReferrer,
        originalStatus: selectedReferrer.status,
        status: normalizedStatus
      });
    } else {
      setSelectedReferrer({
        ...selectedReferrer,
        status: normalizedStatus
      });
    }
    
    console.log(`Status changed in dropdown to: ${normalizedStatus}`);
  };

  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortDirection]);

  const filterReferrers = (referrers, query) => {
    if (!query || query.trim() === '') return referrers;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return referrers.filter(referrer => {
      if (
        referrer.firstName?.toLowerCase().includes(normalizedQuery) ||
        referrer.lastName?.toLowerCase().includes(normalizedQuery) ||
        referrer.clinicName?.toLowerCase().includes(normalizedQuery) ||
        referrer.clinicAddress?.toLowerCase().includes(normalizedQuery) ||
        (referrer.status && referrer.status.toLowerCase().includes(normalizedQuery))
      ) {
        return true;
      }
      
      // Simple date search using toLocaleDateString - similar to Department Management
      if (referrer.birthday) {
        const formattedBirthday = new Date(referrer.birthday).toLocaleDateString();
        if (formattedBirthday.includes(normalizedQuery)) {
          return true;
        }
      }
      
      if (referrer.createdAt) {
        const formattedCreatedAt = new Date(referrer.createdAt).toLocaleDateString();
        if (formattedCreatedAt.includes(normalizedQuery)) {
          return true;
        }
      }
      
      // Numeric search for day/month/year components
      if (!isNaN(normalizedQuery)) {
        const numQuery = parseInt(normalizedQuery);
        
        if (referrer.birthday) {
          const birthDate = new Date(referrer.birthday);
          if (
            birthDate.getDate() === numQuery ||
            (birthDate.getMonth() + 1) === numQuery ||
            birthDate.getFullYear() === numQuery
          ) {
            return true;
          }
        }
        
        if (referrer.createdAt) {
          const createdDate = new Date(referrer.createdAt);
          if (
            createdDate.getDate() === numQuery ||
            (createdDate.getMonth() + 1) === numQuery ||
            createdDate.getFullYear() === numQuery
          ) {
            return true;
          }
        }
      }
      
      return false;
    });
  };

  const filteredReferrers = filterReferrers(referrersData?.data || [], searchQuery);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReferrers = filteredReferrers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReferrers.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Referrer';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className='md:sticky md:top-0 md:h-screen z-10'>
        <Sidebar />
      </div>
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 md:h-full"> {/* Added min-h-0 for mobile */}
          <TabNavigation tabsConfig={tabsConfig} />
          <div className="flex-1 p-4 md:p-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-2 mb-2"> {/* Reduced margin */}
              <button 
                onClick={openAddModal} 
                className="bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
              >
                <PlusCircle className="mr-1 sm:mr-2" size={18} />
                Add New Referrer
              </button>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <button 
                    onClick={toggleSortDirection}
                    className="border-2 border-green-800 bg-white text-green-800 rounded-lg px-4 py-1 md:py-2 text-sm md:text-base flex items-center w-full sm:w-auto justify-between hover:bg-green-50"
                  >
                    <span>Sort First Name {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</span>
                    {sortDirection === 'asc' ? (
                      <ArrowUp size={16} className="ml-2" />
                    ) : (
                      <ArrowDown size={16} className="ml-2" />
                    )}
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by name, date, clinic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2"> 
              <div className="bg-green-800 p-2 rounded-t">
                <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Doctors</h1>
              </div>
              <div className="border border-green-800 rounded-b">
                <div className="overflow-x-auto w-full" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <table className="min-w-[800px] w-full text-sm">
                    <thead className="sticky top-0 bg-green-100 z-10">
                      <tr className="border-b border-green-800 bg-green-100">
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[150px] w-[20%]">Doctor Name</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[120px] w-[15%]">Clinic Name</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[120px] w-[20%]">Address</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[100px] w-[12%]">Birth Date</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[100px] w-[12%]">Date Created</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium min-w-[90px] w-[10%]">Status</th>
                        <th className="p-1 text-sm font-medium min-w-[80px] w-[10%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>{isLoading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">Loading...</td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-red-500">{error}</td>
                      </tr>
                    ) : !Array.isArray(referrersData?.data) || referrersData?.data.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">No referrers found</td>
                      </tr>
                    ) : (
                      currentReferrers.map((referrer) => (
                        <tr key={referrer.referrerId} className="border-b border-green-200">
                          <td className="p-1 pl-5 border-r border-green-200 text-left truncate">
                            {referrer.firstName} {referrer.lastName}
                          </td>
                          <td className="p-1 border-r border-green-200 text-center truncate">{referrer.clinicName}</td>
                          <td className="p-1 border-r border-green-200 text-center truncate">{referrer.clinicAddress}</td>
                          <td className="p-1 border-r border-green-200 text-center">
                            {referrer.birthday ? new Date(referrer.birthday).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-1 border-r border-green-200 text-center">
                            {referrer.createdAt ? new Date(referrer.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-1 border-r border-green-200 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              referrer.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {referrer.status?.toLowerCase() === 'active' ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-1 border-r border-green-200 text-center relative">
                            <div className="flex justify-center relative">
                              <button 
                                onClick={() => toggleMenu(referrer.referrerId)} 
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                              >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" strokeWidth="2" fill="none" 
                                     strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="12" cy="5" r="1"></circle>
                                  <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                              </button>
                              
                              {activeMenu === referrer.referrerId && (
                                <div className="absolute top-0 right-full mr-1 mt-6 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setActiveMenu(null);
                                        openEditModal(referrer);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                                    >
                                      <Edit size={16} className="mr-2" />
                                      Edit Referrer
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!isLoading && currentReferrers.length > 0 && currentReferrers.length < itemsPerPage && (
                      [...Array(itemsPerPage - currentReferrers.length)].map((_, index) => (
                        <tr key={`empty-row-${index}`} className="border-b border-green-200">
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                          <td className="p-1 border-r border-green-200">&nbsp;</td>
                        </tr>
                      ))
                    )}</tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {filteredReferrers.length > itemsPerPage && (
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

              <div className="mt-2 flex flex-col md:flex-row justify-end p-2">
                <div className="flex flex-wrap items-center mb-4 md:mb-0">
                  <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                    Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>

              {/* Add Referrer Modal - Updated positioning */}
              {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"> {/* Unchanged */}
                  <div className="bg-white w-full max-w-md rounded shadow-lg"> {/* Removed max-height and overflow */}
                    <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10"> {/* Unchanged */}
                      <h3 className="text-xl font-medium">New Referrer</h3>
                      <button onClick={closeAddModal} className="text-white hover:text-gray-200">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            required
                          />
                        </div>

                        {/* Birthday */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Birthday</label>
                          <div className="relative">
                            <input
                              type="date"
                              value={birthday}
                              onChange={(e) => setBirthday(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 pr-10"
                            />
                            <Calendar className="absolute right-2 top-2 text-gray-500" size={20} />
                          </div>
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            required
                          />
                        </div>

                        {/* Sex */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Sex</label>
                          <div className="relative">
                            <select
                              value={sex}
                              onChange={(e) => setSex(e.target.value)}
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

                        {/* Clinic Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Clinic Name</label>
                          <input
                            type="text"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>

                        {/* Contact No. */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Contact No.</label>
                          <input
                            type="text"
                            value={contactNo}
                            onChange={(e) => setContactNo(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>

                        {/* Clinic Address - Full Width */}
                        <div className="col-span-2">
                          <label className="block text-green-800 font-medium mb-1">Clinic Address</label>
                          <input
                            type="text"
                            value={clinicAddress}
                            onChange={(e) => setClinicAddress(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-300 my-4"></div>

                      {/* Confirm Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={handleAddReferrer}
                          className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 uppercase font-medium"
                        >
                          CONFIRM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Referrer Modal - Updated positioning */}
              {isEditModalOpen && selectedReferrer && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"> {/* Unchanged */}
                  <div className="bg-white w-full max-w-md rounded shadow-lg"> {/* Removed max-height and overflow */}
                    <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10"> {/* Unchanged */}
                      <h3 className="text-xl font-medium">Edit Referrer</h3>
                      <button onClick={closeEditModal} className="text-white hover:text-gray-200">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            required
                          />
                        </div>

                        {/* Birthday */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Birthday</label>
                          <div className="relative" onClick={() => document.getElementById('edit-referrer-date').showPicker()}>
                            <input
                              id="edit-referrer-date"
                              type="date"
                              value={birthday}
                              onChange={(e) => setBirthday(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                            />
                            <Calendar className="absolute right-2 top-2 text-gray-500" size={20} />
                          </div>
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            required
                          />
                        </div>

                        {/* Sex */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Sex</label>
                          <div className="relative">
                            <select
                              value={sex}
                              onChange={(e) => setSex(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 appearance-none"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Clinic Name */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Clinic Name</label>
                          <input
                            type="text"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>

                        {/* Contact No. */}
                        <div>
                          <label className="block text-green-800 font-medium mb-1">Contact No.</label>
                          <input
                            type="text"
                            value={contactNo}
                            onChange={(e) => setContactNo(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>

                        {/* Clinic Address - Full Width */}
                        <div className="col-span-2">
                          <label className="block text-green-800 font-medium mb-1">Clinic Address</label>
                          <input
                            type="text"
                            value={clinicAddress}
                            onChange={(e) => setClinicAddress(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>

                        {/* Status Dropdown */}
                        <div className="col-span-2">
                          <label className="block text-green-800 font-medium mb-1">Status</label>
                          <div className="relative">
                            <select
                              value={selectedReferrer.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}
                              onChange={handleStatusChange}
                              className="w-full border border-gray-300 rounded p-2 appearance-none"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Deactivated</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-300 my-4"></div>

                      {/* Save Changes Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={handleUpdateReferrer}
                          className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralManagement;