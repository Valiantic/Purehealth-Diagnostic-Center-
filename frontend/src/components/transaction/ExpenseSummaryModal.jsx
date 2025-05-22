import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { expenseAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ExpenseSummaryModalNew = ({
  isOpen,
  onClose,
  expense,
  isEditing,
  departments,
  onSave,
  isLoading
}) => {
  const [editedExpense, setEditedExpense] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize expense state
  useEffect(() => {
    if (expense) {
      setEditedExpense({
        ...expense,
        ExpenseItems: expense.ExpenseItems ? [...expense.ExpenseItems] : []
      });
    }
  }, [expense]);

  const handleEnterEditMode = () => {
    // Toggle edit mode
    if (typeof onSave === 'function') {
      onSave({ ...editedExpense, isEditing: true });
    }
  };

  const handleCancelEdit = () => {
    // Reset form and exit edit mode
    setEditedExpense(expense);
    
    if (typeof onSave === 'function') {
      onSave({ ...expense, isEditing: false });
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Calculate total from expense items
      const totalAmount = editedExpense.ExpenseItems.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0), 0
      );
      
      // Get the correct expense ID
      const expenseId = editedExpense.id || editedExpense.expenseId;
      
      if (!expenseId) {
        throw new Error('Expense ID is missing');
      }

      // Fix for departmentId - ensure it's a number
      const departmentId = typeof editedExpense.departmentId === 'string' 
        ? parseInt(editedExpense.departmentId, 10) 
        : editedExpense.departmentId;

      let formattedDate;
      try {
        const today = new Date();
        formattedDate = today.toISOString().split('T')[0]; 
      } catch (error) {
        console.error('Error formatting date:', error);
        formattedDate = new Date().toDateString();
      }

      // Update status for items
      const updatedItems = editedExpense.ExpenseItems.map(item => {
        return {
          ...item,
          id: item.id || undefined, 
          paidTo: item.paidTo || '',
          purpose: item.purpose || '',
          amount: parseFloat(item.amount || 0),
          status: item.status || 'active'
        };
      });

      // Prepare data for API with correct field types
      const updateData = {
        name: editedExpense.name || '',
        departmentId: departmentId,
        date: formattedDate,
        totalAmount: totalAmount,
        ExpenseItems: updatedItems,
        userId: editedExpense.userId || editedExpense.User?.userId || 1
      };
      
  
      
      const response = await expenseAPI.updateExpense(expenseId, updateData);
      
      toast.success('Expense updated successfully');
      
      const updatedExpenseData = {
        ...response.data?.data || editedExpense,
        ExpenseItems: response.data?.data?.ExpenseItems || updatedItems,
        date: formattedDate,
        departmentId: departmentId,
        department: editedExpense.department,
        Department: editedExpense.Department,
        isUpdated: true
      };
      
      // Close the modal
      if (typeof onClose === 'function') {
        onClose();
      }
      
      if (typeof onSave === 'function') {
        onSave(updatedExpenseData);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(`Failed to update expense: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e, field) => {
    setEditedExpense({
      ...editedExpense,
      [field]: e.target.value
    });
  };

  const handleExpenseItemChange = (index, field, value) => {
    const updatedItems = [...editedExpense.ExpenseItems];
    
    // For amount field, only allow numeric input (with decimal point)
    if (field === 'amount') {
      // Replace any non-numeric characters (except decimal point)
      value = value.replace(/[^\d.]/g, '');
      
      // Ensure only one decimal point exists
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    setEditedExpense({
      ...editedExpense,
      ExpenseItems: updatedItems
    });
  };

  if (!isOpen || !expense) return null;

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch(e) {
      return 'Invalid Date';
    }
  };

  // Determine department name
  const getDepartmentName = () => {
    if (!expense) return 'N/A';
    
    try {
      if (expense.department) {
        if (typeof expense.department === 'string') {
          return expense.department;
        } else if (typeof expense.department === 'object' && expense.department !== null) {
          return expense.department.departmentName || expense.department.name || 'N/A';
        }
      } else if (expense.departmentName) {
        return expense.departmentName;
      } else if (expense.Department && expense.Department.departmentName) {
        return expense.Department.departmentName;
      }
      return 'N/A';
    } catch (err) {
      return 'N/A';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-800 text-white p-2 md:p-3 lg:p-4 flex justify-between items-center rounded-t-md sticky top-0 z-10">
          <h2 className="text-base md:text-lg lg:text-xl font-bold truncate">
            {isEditing ? 'Edit Expense' : 'Expense Summary'}
          </h2>
  
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <X size={18} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-green-800 font-semibold">Loading expense data...</div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
              
              {/* Expense Information */}
              <div className="p-2 md:p-4 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  {/* Payee Name - Takes full width on mobile, 1/2 on desktop */}
                  <div className="md:col-span-1">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Payee Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedExpense?.name || ''}
                        onChange={(e) => handleInputChange(e, 'name')}
                        className="w-full px-2 md:px-3 py-1 md:py-2 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-base"
                      />
                    ) : (
                      <div className="px-2 md:px-3 py-1 md:py-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-xs md:text-base">
                        {expense?.name || 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Department - Takes full width on mobile, 1/2 on desktop */}
                  <div className="md:col-span-1">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Department</label>
                    {isEditing ? (
                      <select
                        value={editedExpense?.departmentId || ''}
                        onChange={(e) => handleInputChange(e, 'departmentId')}
                        className="w-full px-2 md:px-3 py-1 md:py-2 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-base"
                      >
                        <option value="">Select Department</option>
                        {departments?.map((dept) => (
                          <option key={dept.departmentId} value={dept.departmentId}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-2 md:px-3 py-1 md:py-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-xs md:text-base">
                        {getDepartmentName()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Items */}
              <div className="p-2 md:p-4">
                <div className="flex justify-between items-center mb-1 md:mb-3">
                  <h3 className="text-sm md:text-lg font-medium">Expense Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs md:text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1 md:px-4 md:py-2 text-left text-gray-700 border border-gray-200">Paid To</th>
                        <th className="p-1 md:px-4 md:py-2 text-left text-gray-700 border border-gray-200">Purpose</th>
                        <th className="p-1 md:px-4 md:py-2 text-right text-gray-700 border border-gray-200">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedExpense?.ExpenseItems?.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-1 md:px-4 md:py-2 border border-gray-200">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.paidTo || ''}
                                onChange={(e) => handleExpenseItemChange(index, 'paidTo', e.target.value)}
                                className="w-full px-1 md:px-2 py-1 md:py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              />
                            ) : (
                              <span className="line-clamp-2">{item.paidTo || 'N/A'}</span>
                            )}
                          </td>
                          <td className="p-1 md:px-4 md:py-2 border border-gray-200">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.purpose || ''}
                                onChange={(e) => handleExpenseItemChange(index, 'purpose', e.target.value)}
                                className="w-full px-1 md:px-2 py-1 md:py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              />
                            ) : (
                              <span className="line-clamp-2">{item.purpose || 'N/A'}</span>
                            )}
                          </td>
                          <td className="p-1 md:px-4 md:py-2 text-right border border-gray-200">
                            {isEditing ? (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.amount || ''}
                                onChange={(e) => handleExpenseItemChange(index, 'amount', e.target.value)}
                                className="w-full px-1 md:px-2 py-1 md:py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-right text-xs md:text-sm"
                              />
                            ) : (
                              parseFloat(item.amount || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!editedExpense?.ExpenseItems || editedExpense.ExpenseItems.length === 0) && (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-gray-500 border border-gray-200">
                            No expense items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {editedExpense?.ExpenseItems?.length > 0 && (
                      <tfoot>
                        <tr className="bg-green-100">
                          <td colSpan={2} className="px-4 py-2 font-bold text-green-800 border border-gray-200">Total</td>
                          <td className="px-4 py-2 text-right font-bold text-green-800 border border-gray-200">
                            {editedExpense.ExpenseItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
            
            {/* Footer buttons */}
            <div className="flex justify-end gap-1 md:gap-4 p-2 md:p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              {isEditing ? (
                <>
                  <button
                    className="bg-gray-500 text-white px-2 md:px-8 py-1 md:py-2 rounded text-xs md:text-base hover:bg-gray-600 focus:outline-none"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-green-800 text-white px-2 md:px-8 py-1 md:py-2 rounded text-xs md:text-base hover:bg-green-700 focus:outline-none"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-green-800 text-white px-2 md:px-8 py-1 md:py-2 rounded text-xs md:text-base hover:bg-green-700 focus:outline-none"
                    onClick={handleEnterEditMode}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-green-800 text-white px-2 md:px-8 py-1 md:py-2 rounded text-xs md:text-base hover:bg-green-700 focus:outline-none"
                  >
                    Export
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummaryModalNew;