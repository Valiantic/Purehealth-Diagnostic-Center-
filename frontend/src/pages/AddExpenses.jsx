import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Calendar, ChevronDown } from 'lucide-react';
import useAuth from '../hooks/useAuth'

const AddExpenses = () => {

  const { user, isAuthenticating } = useAuth()
  const [paidTo, setPaidTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  // Initialize with some mock data
  const [expenses, setExpenses] = useState([
    { id: 1, paidTo: 'Juan Ponce', purpose: 'New Furniture', amount: 2500 },
    { id: 2, paidTo: 'ABC Medical', purpose: 'Medical Supplies', amount: 1800 }
  ]);

  // Add a new expense to the list
  const handleAddExpense = () => {
    if (paidTo && amount) {
      const newExpense = {
        id: Date.now(), // Use timestamp as a simple unique id
        paidTo,
        purpose,
        amount: parseFloat(amount)
      };
      setExpenses([...expenses, newExpense]);
      // Reset form fields
      setPaidTo('');
      setPurpose('');
      setAmount('');
    }
  };

  // Remove an expense from the list
  const handleRemoveExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Calculate total of all expenses
  const calculateTotal = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <div className="flex-1 overflow-auto p-4 sm:p-6 pt-16 lg:pt-6 lg:ml-64">
    
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Forms */}
        <div className="w-full lg:w-1/2 space-y-6">
          {/* Payee Details */}
          <div className="w-full bg-white rounded-lg shadow-md">
            <div className="bg-[#02542D] text-white text-lg font-bold py-2 px-4 rounded-t-lg">
              Payee Details
            </div>

            <div className="p-4 space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 font-semibold text-sm mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>

              {/* Department Field */}
              <div>
                <label
                  htmlFor="department"
                  className="block text-gray-700 font-semibold text-sm mb-1"
                >
                  Department
                </label>
                <select
                  id="department"
                  value="ECG"
                  readOnly
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none"
                >
                  <option value="ECG">ECG</option>
                  <option value="ECG">Blood Test</option>
                </select>
              </div>

              {/* Date Created Field */}
              <div>
                <label
                  htmlFor="date-created"
                  className="block text-gray-700 font-semibold text-sm mb-1"
                >
                  Date Created
                </label>
                <div className="flex items-center border border-gray-300 rounded-md py-2 px-3">
                  <input
                    type="text"
                    id="date-created"
                    value="24-Mar-2024"
                    readOnly
                    className="flex-grow text-gray-700 focus:outline-none"
                  />
                  <Calendar className="text-gray-500 ml-2" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Add Particulars */}
          <div className="w-full bg-white rounded-lg shadow-md">
            <div className="bg-[#02542D] text-white text-lg font-bold py-2 px-4 rounded-t-lg">
              Add Particulars
            </div>

            <div className="p-4 space-y-4">
              {/* Paid To Field */}
              <div>
                <label
                  htmlFor="paidTo"
                  className="block text-gray-700 font-semibold text-sm mb-1"
                >
                  Paid To
                </label>
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>

              {/* Purpose Field */}
              <div>
                <label
                  htmlFor="purpose"
                  className="block text-gray-700 font-semibold text-sm mb-1"
                >
                  Purpose
                </label>
                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter purpose"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none"
                />
              </div>

              {/* Amount Field and Queue Button */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label
                    htmlFor="amount"
                    className="block text-gray-700 font-semibold text-sm mb-1"
                  >
                    Amount
                  </label>
                  <input
                    type="text"
                    id="amount"
                    placeholder="0.00"
                    pattern="[0-9]*\.?[0-9]*"
                    inputMode="decimal"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setAmount(value);
                    }}
                    value={amount}
                  />
                </div>
                <div className="pt-6">
                  <button
                    onClick={handleAddExpense}
                    className="bg-[#02542D] hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
                  >
                    Queue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Expenses Summary */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md">
            {/* Table Header */}
            <div className="bg-[#02542D] text-white text-lg font-bold py-2 px-4 rounded-t-lg">
              Expenses Summary
            </div>

            {/* Table Content - With responsive height */}
            <div className="overflow-auto max-h-[300px] min-h-[100px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border-b py-2 px-4 text-left text-green-800">Paid To</th>
                    <th className="border-b py-2 px-4 text-left text-green-800">Purpose</th>
                    <th className="border-b py-2 px-4 text-right text-green-800">Amount</th>
                    <th className="border-b py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="border-b py-2 px-4">{expense.paidTo}</td>
                      <td className="border-b py-2 px-4">{expense.purpose}</td>
                      <td className="border-b py-2 px-4 text-right">
                        {expense.amount.toLocaleString()}
                      </td>
                      <td className="border-b py-2 px-4 text-center">
                        <button 
                          onClick={() => handleRemoveExpense(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✖
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div className="px-4 py-2 border-t flex justify-between items-center bg-green-100">
              <div className="text-sm font-medium text-green-800">TOTAL:</div>
              <div className="flex space-x-4 text-sm">
                <span>{calculateTotal().toLocaleString()}</span>
                <span>--</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between p-4">
              <button 
                onClick={() => setExpenses([])} 
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Clear All
              </button>
              <button className="bg-[#02542D] text-white py-2 px-4 rounded hover:bg-green-600">
                Process Transaction
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
    
    </div>
  )
}

export default AddExpenses
