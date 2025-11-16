import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ExpenseSummaryModal = ({
  isOpen,
  onClose,
  firstName,
  lastName,
  selectedDepartment,
  selectedDate,
  departments,
  categories,
  expenses,
  calculateTotal,
  onConfirm,
  onSave,
  isLoading = false,
  isEditing = false,
  onEnterEditMode,
  mode = "confirm"
}) => {
  const [editedData, setEditedData] = useState({
    firstName: firstName || '',
    lastName: lastName || '',
    selectedDepartment: selectedDepartment || '',
    expenses: expenses || []
  });
  const [isEditMode, setIsEditMode] = useState(isEditing);

  useEffect(() => {
    setEditedData({
      firstName: firstName || '',
      lastName: lastName || '',
      selectedDepartment: selectedDepartment || '',
      expenses: expenses || []
    });
    setIsEditMode(isEditing);
  }, [firstName, lastName, selectedDepartment, expenses, isEditing]);

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseChange = (index, field, value) => {
    setEditedData(prev => ({
      ...prev,
      expenses: prev.expenses.map((expense, i) => 
        i === index ? { ...expense, [field]: value } : expense
      )
    }));
  };

  const handleEnterEdit = () => {
    setIsEditMode(true);
    if (onEnterEditMode) {
      onEnterEditMode();
    }
  };

  const handleSaveChanges = () => {
    if (onSave) {
      onSave(editedData);
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    // Reset to original data
    setEditedData({
      firstName: firstName || '',
      lastName: lastName || '',
      selectedDepartment: selectedDepartment || '',
      expenses: expenses || []
    });
    setIsEditMode(false);
  };

  const calculateEditedTotal = () => {
    return editedData.expenses.reduce((total, exp) => total + (parseFloat(exp.amount) || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className='bg-[#02542D] text-white py-3 px-4 flex justify-between items-center'>
          <h2 className="text-lg font-bold">Expense Summary</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
            disabled={isLoading}
          >
            <X size={22} />
          </button>
        </div>
        
        {/* Payee Information Section */}
        <div className="overflow-auto flex-1">
         
          
          <table className="w-full text-sm border-collapse">
            <tbody className='bg-green-100'>
              <tr className="border-b border-gray-300">
                <td className="py-2 px-4 w-32 font-semibold text-gray-700">Name:</td>
                <td className="py-2 px-4">
                  {isEditMode ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editedData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                      />
                      <input
                        type="text"
                        value={editedData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                      />
                    </div>
                  ) : (
                    `${editedData.firstName || ''} ${editedData.lastName || ''}`.trim() || 'N/A'
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2 px-4 font-semibold text-gray-700">Department:</td>
                <td className="py-2 px-4">
                  {isEditMode ? (
                    <select
                      value={editedData.selectedDepartment}
                      onChange={(e) => handleInputChange('selectedDepartment', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (() => {
                      if (!editedData.selectedDepartment) {
                        return 'N/A';
                      }
                      
                      const dept = departments.find(d => 
                        String(d.departmentId) === String(editedData.selectedDepartment)
                      );
                      
                      return dept ? dept.departmentName : 'N/A';
                    })()
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2 px-4 font-semibold text-gray-700">Date:</td>
                <td className="py-2 px-4">{new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: '2-digit',
                  day: '2-digit', 
                  year: 'numeric'
                })}</td>
              </tr>
            </tbody>
          </table>

  

          {/* Expense Table with Scrollbar */}
          <div className="max-h-[280px] overflow-y-auto">
            <table className='w-full border-collapse text-sm'>
              <thead className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className='text-left py-2 px-4 font-semibold text-gray-700'>Paid to</th>
                  <th className='text-left py-2 px-4 font-semibold text-gray-700'>Purpose</th>
                  <th className='text-left py-2 px-4 font-semibold text-gray-700'>Category</th>
                  <th className='text-left py-2 px-4 font-semibold text-gray-700'>Status</th>
                  <th className='text-right py-2 px-4 font-semibold text-gray-700'>Amount</th>
                </tr>
              </thead>
              <tbody>
                {editedData.expenses && editedData.expenses.length > 0 ? (
                  editedData.expenses.map((expense, index) => (
                    <tr key={expense.id || index} className='border-b border-gray-200 hover:bg-gray-50'>
                      <td className='py-2 px-4'>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={expense.paidTo || ''}
                            onChange={(e) => handleExpenseChange(index, 'paidTo', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-sm"
                          />
                        ) : (
                          <span className="text-gray-800">{expense.paidTo || 'N/A'}</span>
                        )}
                      </td>
                      <td className='py-2 px-4'>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={expense.purpose || ''}
                            onChange={(e) => handleExpenseChange(index, 'purpose', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-sm"
                          />
                        ) : (
                          <span className="text-gray-800">{expense.purpose || 'N/A'}</span>
                        )}
                      </td>
                      <td className='py-2 px-4'>
                        {isEditMode ? (
                          <select
                            value={expense.categoryId || ''}
                            onChange={(e) => {
                              const selectedCategory = categories?.find(cat => cat.categoryId === parseInt(e.target.value));
                              handleExpenseChange(index, 'categoryId', e.target.value);
                              handleExpenseChange(index, 'categoryName', selectedCategory?.name || '');
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-sm"
                          >
                            <option value="">Select Category</option>
                            {categories?.filter(cat => cat.status === 'active').map((cat) => (
                              <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-800">{expense.categoryName || 'N/A'}</span>
                        )}
                      </td>
                      <td className='py-2 px-4'>
                        {isEditMode ? (
                          <select
                            value={expense.status || 'pending'}
                            onChange={(e) => handleExpenseChange(index, 'status', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="reimbursed">Reimbursed</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            expense.status === 'reimbursed' ? 'bg-blue-100 text-blue-800' :
                            expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                            expense.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {expense.status ? expense.status.charAt(0).toUpperCase() + expense.status.slice(1) : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className='py-2 px-4 text-right'>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            value={expense.amount || ''}
                            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-sm text-right"
                          />
                        ) : (
                          <span className="text-gray-800 font-medium">
                            {parseFloat(expense.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No expenses to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Total Row */}
          <div className="border-t-2 border-gray-300 bg-white">
            <div className="px-4 py-3 flex items-center">
              <div className="text-base font-bold text-gray-800">Total:</div>
              <div className="flex-grow"></div>
              <div className="text-base font-bold text-gray-800 text-right">
                {isEditMode 
                  ? parseFloat(calculateEditedTotal()).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                  : parseFloat(calculateTotal ? calculateTotal() : 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3'>
          {mode === "confirm" ? (
            <button 
              onClick={onConfirm}
              className='bg-[#02542D] text-white py-2 px-8 rounded hover:bg-green-700 font-semibold transition-colors'
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </button>
          ) : (
            isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className='bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 font-semibold transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className='bg-[#02542D] text-white py-2 px-6 rounded disabled:opacity-50 hover:bg-green-700 font-semibold transition-colors'
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEnterEdit}
                  disabled={isLoading}
                  className='bg-orange-600 text-white py-2 px-8 rounded disabled:opacity-50 hover:bg-orange-700 font-semibold transition-colors'
                >
                  Edit
                </button>
                <button 
                  onClick={onConfirm}
                  className='bg-[#02542D] text-white py-2 px-8 rounded hover:bg-green-700 font-semibold transition-colors'
                  disabled={isLoading}
                >
                  Confirm
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseSummaryModal;