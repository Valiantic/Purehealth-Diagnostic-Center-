import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { ChevronLeft, ChevronRight, CirclePlus, ChevronDown } from 'lucide-react'
import useAuth from '../hooks/useAuth'

const MonthlyExpenses = () => {
  const { user, isAuthenticating } = useAuth()
 
  const [currentMonth, setCurrentMonth] = useState('MAR-2025');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const navigate = useNavigate()

  const departments = ['All Departments', 'X-Ray', 'Lab', 'Blood Test', 'DT', 'ECG'];

  const handleAddExpense = () => {
    navigate('/add-expenses')
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
        {/* Month navigation */}
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

        <div className="flex justify-end px-2 mb-2">
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-white border-2 border-green-800 text-green-800 font-bold text-sm rounded py-1 pl-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-white"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none">
              <ChevronDown size={16} className="text-green-800" />
            </div>
          </div>
        </div>

        <div className="p-2">
          <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
            <div>X-Ray Monthly Expenses</div>
         
              <button onClick={handleAddExpense} className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <CirclePlus/>
              </button>
          
          </div>
          <div className="border border-green-800 rounded-b">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-800 bg-green-100">
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Payee</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Purpose</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Amount</th>
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
  </div>
  )
}

export default MonthlyExpenses
