import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'

const Referrals = () => {
  const { user, isAuthenticating } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

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
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
          </div>
        </div>

        {/* Monthly Income Table */}
        <div className="p-2">
            <div className="bg-green-800 p-2 rounded-t">
              <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Dr. Williams</h1>
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
                    {[...Array(10)].map((_, index) => (
                      <tr key={`income-row-${index}`} className="border-b border-green-200">
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
  )
}

export default Referrals
