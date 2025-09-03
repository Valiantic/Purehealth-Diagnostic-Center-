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
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className='bg-[#02542D] text-white p-2 flex justify-between items-center'>
          <h2 className="text-lg font-bold ml-2">Expense Summary</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Header Information */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="p-2 pl-4 w-28 font-medium border-r border-gray-700">First Name</td>
                <td className="p-2">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                    />
                  ) : (
                    editedData.firstName || 'N/A'
                  )}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 pl-4 w-28 font-medium border-r border-gray-700">Last Name</td>
                <td className="p-2">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                    />
                  ) : (
                    editedData.lastName || 'N/A'
                  )}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 pl-4 font-medium border-r border-green-700">Department</td>
                <td className="p-2">
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
              <tr className="border-b">
                <td className="p-2 pl-4 font-medium border-r border-green-700">Date</td>
                <td className="p-2">{new Date(selectedDate).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                }).replace(/\s/g, '-').toUpperCase()}</td>
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
                  <th className='text-left p-2 border-b'>Category</th>
                  <th className='text-right p-2 pr-4 border-b'>Amount</th>
                </tr>
              </thead>
              <tbody>
                {editedData.expenses && editedData.expenses.length > 0 ? (
                  editedData.expenses.map((expense, index) => (
                    <tr key={expense.id || index} className='border-b'>
                      <td className='p-2 pl-4'>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={expense.paidTo || ''}
                            onChange={(e) => handleExpenseChange(index, 'paidTo', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-xs"
                          />
                        ) : (
                          expense.paidTo || 'N/A'
                        )}
                      </td>
                      <td className='p-2'>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={expense.purpose || ''}
                            onChange={(e) => handleExpenseChange(index, 'purpose', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-xs"
                          />
                        ) : (
                          expense.purpose || 'N/A'
                        )}
                      </td>
                      <td className='p-2'>
                        {isEditMode ? (
                          <select
                            value={expense.categoryId || ''}
                            onChange={(e) => {
                              const selectedCategory = categories?.find(cat => cat.categoryId === parseInt(e.target.value));
                              handleExpenseChange(index, 'categoryId', e.target.value);
                              handleExpenseChange(index, 'categoryName', selectedCategory?.name || '');
                            }}
                            className="w-full px-1 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-xs"
                          >
                            <option value="">Select Category</option>
                            {categories?.filter(cat => cat.status === 'active').map((cat) => (
                              <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          expense.categoryName || 'N/A'
                        )}
                      </td>
                      <td className='p-2 pr-4 text-right'>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            value={expense.amount || ''}
                            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-600 text-xs text-right"
                          />
                        ) : (
                          (expense.amount || 0).toLocaleString()
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      No expenses to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Total Row */}
          <div className="px-4 py-3 flex items-center bg-green-100">
            <div className="text-sm font-bold text-green-800">TOTAL:</div>
            <div className="flex-grow"></div>
            <div className="text-sm font-bold text-green-800 text-right">
              {isEditMode ? calculateEditedTotal().toLocaleString() : (calculateTotal ? calculateTotal().toLocaleString() : '0.00')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 sm:gap-6 p-3'>
          {mode === "confirm" ? (
            <button 
              onClick={onConfirm}
              className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base hover:bg-green-700'
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
                  className='bg-gray-500 text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base hover:bg-gray-600'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base disabled:opacity-50 hover:bg-green-700'
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEnterEdit}
                  disabled={isLoading}
                  className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base disabled:opacity-50 hover:bg-green-700'
                >
                  Edit
                </button>
                <button 
                  className='bg-[#02542D] text-white py-1 px-4 sm:px-8 rounded text-sm sm:text-base hover:bg-green-700'
                  disabled={isLoading}
                >
                  Export
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