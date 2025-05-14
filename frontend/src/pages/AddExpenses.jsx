import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuth from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query';
import { departmentAPI, expenseAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddExpenses = () => {

  const { user, isAuthenticating } = useAuth()
  const [paidTo, setPaidTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);

  const [name, setName] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(''); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const datePickerRef = useRef(null);

  const [errors, setErrors] = useState({
    paidTo: '',
    purpose: '',
    amount: ''
  });

  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAllDepartments().then(res => {
      return res.data;
    }),
    onSuccess: (data) => {
    },
    onError: (error) => console.error('Failed to fetch departments:', error),
    staleTime: 300000,
  });

  // Access the departments data consistently
  const departments = departmentsData ? 
    (Array.isArray(departmentsData) ? departmentsData : 
    (departmentsData.data && Array.isArray(departmentsData.data) ? departmentsData.data : [])) 
    : [];

  // Handle department selection
  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
  };

  // Always call useEffect regardless of conditions - moved from below
  useEffect(() => {
    if (departments && departments.length > 0) {
      // If no department is selected and we have departments, select the first one
      if (!selectedDepartment && departments.length > 0) {
        const firstDeptId = departments[0].departmentId;
        setSelectedDepartment(firstDeptId);
      }
    }
  }, [departments, selectedDepartment]);

  // Calendar date picker
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const prevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProcessTransaction = () => {
    if (expenses.length > 0) {
      setShowSummaryModal(true);
    }
  };

  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
  };

  const handleConfirmTransaction = async () => {
    try {
      const expenseData = {
        name: name || 'Unnamed Expense',
        departmentId: selectedDepartment,
        date: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        expenses: expenses.map(exp => ({
          paidTo: exp.paidTo,
          purpose: exp.purpose,
          amount: exp.amount
        })),
        userId: user.userId
      };
      
      const response = await expenseAPI.createExpense(expenseData);
      
      setShowSummaryModal(false);
      setExpenses([]);
      setPaidTo('');
      setPurpose('');
      setAmount('');
      setName('');
      toast.success('Expense saved successfully');
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  // Add a new expense to the list
  const handleAddExpense = () => {
    // Reset previous errors
    const newErrors = {
      paidTo: '',
      purpose: '',
      amount: ''
    };

    // Validate fields
    let isValid = true;
    
    if (!paidTo.trim()) {
      newErrors.paidTo = 'Paid To is required';
      isValid = false;
    }
    
    if (!purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
      isValid = false;
    }
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
      isValid = false;
    }
    
    setErrors(newErrors);

    if (isValid) {
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
    <ToastContainer position="top-right" autoClose={3000} />
    
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none cursor-pointer"
                >
                 <option value="">Select Department</option>
                  {isLoading ? (
                    <option value="" disabled>Loading departments...</option>
                  ) : (
                    departments.map((dept) => (
                      <option 
                        key={dept.departmentId} 
                        value={dept.departmentId}
                      >
                        {dept.departmentName}
                      </option>
                    ))
                  )}
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
                <div className='relative'>
                  <div className="flex items-center border border-gray-300 rounded-md py-2 px-3"
                   onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                  <input
                    type="text"
                    id="date-created"
                    value={formatDate(selectedDate)}
                    readOnly
                    className="flex-grow text-gray-700 focus:outline-none"
                  />
                  <Calendar className="text-gray-500 ml-2" size={20} />
                  </div>

                   {showDatePicker && (
                    <div 
                      ref={datePickerRef}
                      className="absolute z-10 mt-1 bg-white border border-gray-300 shadow-lg rounded-md p-2 w-full"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <button 
                          onClick={prevMonth} 
                          className="p-1 hover:bg-gray-100 rounded-full"
                          type="button"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="font-medium">
                          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={nextMonth} 
                          className="p-1 hover:bg-gray-100 rounded-full"
                          type="button"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                          <div key={`header-${index}`} className="text-xs font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                        
                        {getDaysInMonth().map((day, index) => (
                          <div key={`day-${index}`} className="text-center">
                            {day !== null ? (
                              <button
                                key={`btn-${day}`}
                                type="button"
                                onClick={() => handleDateSelect(day)}
                                className={`w-8 h-8 rounded-full text-sm ${
                                  selectedDate.getDate() === day ? 
                                  'bg-green-600 text-white' : 
                                  'hover:bg-gray-200'
                                }`}
                              >
                                {day}
                              </button>
                            ) : (
                              <div key={`empty-${index}`} className="w-8 h-8"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  className={`w-full border ${errors.paidTo ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none`}
                />
                {errors.paidTo && <p className="text-red-500 text-xs mt-1">{errors.paidTo}</p>}
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
                  className={`w-full border ${errors.purpose ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none`}
                />
                {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
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
                    className={`w-full border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setAmount(value);
                    }}
                    value={amount}
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
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
            <div className="px-4 py-2 border-t flex items-center bg-green-100">
              <div className="text-sm font-medium text-green-800 flex-shrink-0">TOTAL:</div>
              <div className="flex-1"></div>
              <div className="text-sm text-right font-medium text-green-800 w-24 mr-12">
                {calculateTotal().toLocaleString()}
              </div>
              <div className="w-10"></div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between p-4">
              <button 
                onClick={() => setExpenses([])} 
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Clear All
              </button>
              <button onClick={handleProcessTransaction} className="bg-[#02542D] text-white py-2 px-4 rounded hover:bg-green-600">
                Process Transaction
              </button>
            </div>

            {showSummaryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
                  {/* Modal Header */}
                  <div className='bg-[#02542D] text-white p-2 flex justify-between items-center'>
                    <h2 className="text-lg font-bold ml-2">Expense Summary</h2>
                    <button 
                      onClick={handleCloseSummaryModal}
                      className="text-white hover:text-gray-300"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Header Information */}
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 pl-4 w-28 font-medium border-r border-gray-700">Name</td>
                          <td className="p-2">{name || 'Juan Ponce Enrile'}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 pl-4 font-medium border-r border-green-700">Department</td>
                          <td className="p-2">
                            {(() => {
                              if (!selectedDepartment) {
                                return 'N/A';
                              }
                              
                              const dept = departments.find(d => 
                                String(d.departmentId) === String(selectedDepartment)
                              );
                              
                              return dept ? dept.departmentName : 'N/A';
                            })()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 pl-4 font-medium border-r border-green-700">Date</td>
                          <td className="p-2">{formatDate(selectedDate)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Expense Table with Scrollbar */}
                    <div className="max-h-[250px] overflow-y-auto border-b">
                      <table className='w-full border-collapse text-sm'>
                        <thead className="sticky top-0 bg-green-100">
                          <tr>
                            <th className='text-left p-2 pl-4 border-b'>Paid to</th>
                            <th className='text-left p-2 border-b'>Purpose</th>
                            <th className='text-right p-2 pr-4 border-b'>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id} className='border-b'>
                              <td className='p-2 pl-4'>{expense.paidTo}</td>
                              <td className='p-2'>{expense.purpose}</td>
                              <td className='p-2 pr-4 text-right'>{expense.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Total Row */}
                    <div className="px-4 py-3 flex justify-between items-center bg-green-100">
                      <div className="text-sm font-bold text-green-800">TOTAL:</div>
                      <div className="text-sm font-bold text-green-800">
                        {calculateTotal().toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className='flex justify-end gap-2 sm:gap-6 p-3'>
                    <button className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base'>
                      Export
                    </button>
                    <button
                      onClick={handleConfirmTransaction}
                      className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base'
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
    
    </div>
  )
}

export default AddExpenses
