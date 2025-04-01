import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, CirclePlus } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'

const Monthly = () => {
  const { user, isAuthenticating } = useAuth()

  const [currentMonth, setCurrentMonth] = useState('MAR-2025');

  const handlePrevMonth = () => {
    setCurrentMonth('FEB-2025');
  }

  const handleNextMonth = () => {
    setCurrentMonth('APR-2025');
  }

  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
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
            <div className="bg-green-800 text-white p-2 font-semibold rounded-t">
              Monthly Income
            </div>
            <div className="border border-green-800 rounded-b">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-800 bg-green-200">
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
                      <th className="p-1">Opt.</th>
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
                        <td className="p-1 border-r border-green-200"></td>
                        <td className="p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-1 border-t border-green-800 font-bold bg-green-200 text-green-800">
                TOTAL:
              </div>
            </div>
          </div>

          {/* Monthly Expense and Collectible Income Sections (side by side on larger screens) */}
          <div className="md:flex p-2 gap-2">
            {/* Monthly Expense */}
            <div className="md:w-1/2 mb-2 md:mb-0">
              <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
                <span>Monthly Expense</span>
                <button className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <CirclePlus/>
                </button>
              </div>
              <div className="border border-green-800 rounded-b">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-800 bg-green-200">
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Name</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Purpose</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Amount</th>
                        <th className="p-1 text-sm font-medium">Opt.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(7)].map((_, index) => (
                        <tr key={`expense-row-${index}`} className="border-b border-green-200">
                          <td className="p-1 border-r border-green-200"></td>
                          <td className="p-1 border-r border-green-200"></td>
                          <td className="p-1 border-r border-green-200"></td>
                          <td className="p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-1 border-t bg-green-200 border-green-800 font-bold text-green-800">
                  TOTAL:
                </div>
              </div>
            </div>

            {/* Collectible Income */}
            <div className="md:w-1/2">
              <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
                <span>Collectible Income</span>
                <button className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <CirclePlus/>
                </button>
              </div>
              <div className="border border-green-800 rounded-b">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-800 bg-green-200">
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Company</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Coordinator</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Date</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Income</th>
                        <th className="p-1 text-sm font-medium">Opt.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(7)].map((_, index) => (
                        <tr key={`collectible-row-${index}`} className="border-b border-green-200">
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
                <div className="p-1 border-t bg-green-200 border-green-800 font-bold text-green-800">
                  TOTAL:
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
    </div>
  )
}

export default Monthly
