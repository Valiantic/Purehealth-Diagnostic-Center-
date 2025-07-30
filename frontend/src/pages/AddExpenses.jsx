import React, { useState, useEffect } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import { X } from 'lucide-react';
import CategoryModal from '../components/add-expenses/CategoryModal';
import ExpenseSummaryModal from '../components/transaction/ExpenseSummaryModal';
import useAuth from '../hooks/auth/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentAPI, expenseAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddExpenses = () => {

  const { user, isAuthenticating } = useAuth()
  const queryClient = useQueryClient()
  const [paidTo, setPaidTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(''); 
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(''); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    const selectedDate = new Date(inputDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      return;
    }
    setSelectedDate(inputDate);
  };

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    paidTo: '',
    purpose: '',
    category: '',
    amount: ''
  });

  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAllDepartments().then(res => {
      return res.data;
    }),
    onError: (error) => console.error('Failed to fetch departments:', error),

  });

  // Fetch categories using expenseAPI
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseAPI.getAllCategories().then(res => {
      return res.data;
    }),
    onError: (error) => console.error('Failed to fetch categories:', error),
  });

  // Access the departments data consistently
  const departments = departmentsData ? 
    (Array.isArray(departmentsData) ? departmentsData : 
    (departmentsData.data && Array.isArray(departmentsData.data) ? departmentsData.data : [])) 
    : [];

  const categories = categoriesData ? 
    (Array.isArray(categoriesData) ? categoriesData : 
    (categoriesData.data && Array.isArray(categoriesData.data) ? categoriesData.data : [])) 
    : [];

  // Handle department selection
  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
  };

   // Handle category selection
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'add_new') {
      setShowCategoryModal(true);
    } else {
      setCategory(value);
    }
  };

  // Handle adding new category using expenseAPI
  const handleAddCategory = async (newCategory) => {
    try {
      const categoryData = {
        ...newCategory,
        userId: user?.userId || 1  
      };
      
      const response = await expenseAPI.createCategory(categoryData);
      if (response.data.success) {
        toast.success('Category added successfully');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setCategory(response.data.data.categoryId);
        setShowCategoryModal(false);
      } else {
        toast.error('Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Error adding category');
    }
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
      setIsConfirming(true);
      
      if (!firstName.trim()) {
        toast.error('First name is required');
        return;
      }
      
      if (!lastName.trim()) {
        toast.error('Last name is required');
        return;
      }
      
      if (!selectedDepartment) {
        toast.error('Department is required');
        return;
      }
      
      if (!selectedDate) {
        toast.error('Date is required');
        return;
      }
      
      if (expenses.length === 0) {
        toast.error('Please add at least one expense item');
        return;
      }

      const expenseData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        departmentId: parseInt(selectedDepartment),
        date: selectedDate, 
        expenses: expenses.map(exp => ({
          paidTo: exp.paidTo.trim(),
          purpose: exp.purpose.trim(),
          categoryId: parseInt(exp.categoryId),
          amount: parseFloat(exp.amount)
        })),
        userId: user.userId
      };
      
      const response = await expenseAPI.createExpense(expenseData);
      
      if (response && response.data && response.data.success) {
        setShowSummaryModal(false);
        setExpenses([]);
        setPaidTo('');
        setPurpose('');
        setCategory('');
        setAmount('');
        setFirstName('');
        setLastName('');
        toast.success('Expense saved successfully');
      } else {
        toast.error('Failed to save expense - Invalid response');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to save expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsConfirming(false);
    }
  };

  // Add a new expense to the list
  const handleAddExpense = () => {
    // Reset previous errors
    const newErrors = {
      firstName: '',
      lastName: '',
      paidTo: '',
      purpose: '',
      category: '',
      amount: ''
    };

    // Validate fields
    let isValid = true;

    if(!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if(!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    
    if (!paidTo.trim()) {
      newErrors.paidTo = 'Paid To is required';
      isValid = false;
    }
    
    if (!purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
      isValid = false;
    }

    if(!category) {
      newErrors.category = 'Category is required';
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
      const selectedCategoryObj = categories.find(cat => cat.categoryId === parseInt(category));
      const newExpense = {
        id: Date.now(), // Use timestamp as a simple unique id
        paidTo,
        purpose,
        categoryId: category,
        categoryName: selectedCategoryObj?.name || 'Unknown Category',
        amount: parseFloat(amount)
      };
      setExpenses([...expenses, newExpense]);
      // Reset form fields
      setPaidTo('');
      setPurpose('');
      setCategory('');
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
              {/* First Name Field */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-gray-700 font-semibold text-sm mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none`}
                  />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                {/* Last Name Field */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-gray-700 font-semibold text-sm mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none`}
                  />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
                    departments.filter(dept => dept.status === 'active')
                    .map((dept) => (
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
                <div className="relative">
                  <input
                    id="date-created"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-600"
                    placeholder="YYYY-MM-DD"
                  />
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

               {/* Category Field */}
                <div>
                  <label 
                    htmlFor="category"
                    className='block text-gray-700 font-semibold text-sm mb-1'
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={handleCategoryChange}
                    className={`w-full border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none`}
                  >
                    <option value="">Select a category</option>
                    {categoriesLoading ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : (
                      categories.filter(cat => cat.status === 'active')
                      .map((cat) => (
                        <option
                          key={cat.categoryId}
                          value={cat.categoryId}
                        >
                          {cat.name}
                        </option>
                      ))
                    )}
                    <option value="add_new" className="text-green-600 font-semibold">
                      + Add New Category
                    </option>
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
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
                    <th className="border-b py-2 px-4 text-left text-green-800">Category</th>
                    <th className="border-b py-2 px-4 text-right text-green-800">Amount</th>
                    <th className="border-b py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="border-b py-2 px-4">{expense.paidTo}</td>
                      <td className="border-b py-2 px-4">{expense.purpose}</td>
                      <td className="border-b py-2 px-4">{expense.categoryName}</td>
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
              <div className="flex-grow"></div>
              <div className="text-sm font-bold text-green-800 text-right pr-8">
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

            {/* Expense Summary Modal */}
            <ExpenseSummaryModal
              isOpen={showSummaryModal}
              onClose={handleCloseSummaryModal}
              firstName={firstName}
              lastName={lastName}
              selectedDepartment={selectedDepartment}
              selectedDate={selectedDate}
              departments={departments}
              expenses={expenses}
              calculateTotal={calculateTotal}
              onConfirm={handleConfirmTransaction}
              isLoading={isConfirming}
              mode="confirm"
            />
          </div>
        </div>
      </div>

            {/* Category Modal */}
            <CategoryModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                if (!category) {
                }
              }}
              onAddCategory={handleAddCategory}
            />

    </div>
    </div>
  )
}

export default AddExpenses
