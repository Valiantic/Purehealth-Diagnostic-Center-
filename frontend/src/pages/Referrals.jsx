import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import { referrerAPI } from '../services/api'
import { useQuery } from '@tanstack/react-query'

const Referrals = () => {
  const { user, isAuthenticating } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: referrersData, isLoading, error } = useQuery({
    queryKey: ['referrers'],
    queryFn: async () => {
      // Return the full response object
      const response = await referrerAPI.getAllReferrers(true)
      return response
    },
    enabled: !!user, 
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false 
  })

  // Extract the referrers array from the nested data structure
  const referrers = referrersData?.data?.data || []

  // Filter out deactivated referrers and apply search filter
  const filteredReferrers = referrers.filter(referrer => {
   
    if (referrer.status?.toLowerCase() !== 'active') {
      return false;
    }
    
    if (searchTerm) {
      const fullName = `${referrer.firstName} ${referrer.lastName}`.toLowerCase()
      return fullName.includes(searchTerm.toLowerCase())
    }
    
    return true;
  })

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

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
        <div className="flex justify-end mb-4 pr-2">
          <div className="relative">
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-green-800 font-medium">Loading referrers data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error.message || 'Failed to load referrers data. Please try again.'}</p>
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
                          <th className="p-1 border-r border-green-800 text-sm font-medium">MC#</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Patient Name</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">UTZ</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Lab</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">DT</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">PE</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">ECG</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">X-Ray</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Gross</th>
                          <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Empty rows for data input */}
                        {[...Array(5)].map((_, index) => (
                          <tr key={`${referrer.referrerId}-row-${index}`} className="border-b border-green-200">
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 border-r border-green-200 bg-white"></td>
                            <td className="p-1 bg-white"></td>
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
            ))}
          </div>
        )}

        {/* Generate Report Button */}
        <div className="flex justify-end p-2 mt-4">
          <button className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600">
            Generate Report
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Referrals
