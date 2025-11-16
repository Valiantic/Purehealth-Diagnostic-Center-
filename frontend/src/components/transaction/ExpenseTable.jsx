import React, { useState } from 'react';
import { MoreVertical, Download, Edit } from 'lucide-react';

const ExpenseTable = ({ 
  filteredExpenses, 
  expenseSearchTerm,
  onEditExpense
}) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleEditFromDropdown = (expense, e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenDropdownId(null); 
    if (onEditExpense) {
      onEditExpense(expense);
    }
  };

  // Sort expenses by creation date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA; 
  });

  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!filteredExpenses || filteredExpenses.length === 0) {
    return (
      <div className="overflow-x-auto pb-2 relative">
        <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500 font-medium">No expenses found on this day</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses or adjust your search criteria</p>
        </div>
        
        <div className="flex justify-end mt-4 px-2">
          <div className="text-sm text-gray-600">
            Showing 0 expenses
          </div>
        </div>
      </div>
    );
  }

  const activeTotalExpense = filteredExpenses.reduce((total, expense) => {
    if (expense.ExpenseItems && Array.isArray(expense.ExpenseItems)) {
      return total + expense.ExpenseItems
        .filter(item => item.status !== 'paid')
        .reduce((itemTotal, item) => itemTotal + parseFloat(item.amount || 0), 0);
    }
    return expense.status !== 'paid' ? total + parseFloat(expense.amount || 0) : total;
  }, 0);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#02542D] text-white">
              <th className="py-3 px-4 text-left font-semibold border-r border-green-700">Payee</th>
              <th className="py-3 px-4 text-left font-semibold border-r border-green-700">Paid to</th>
              <th className="py-3 px-4 text-left font-semibold border-r border-green-700">Category</th>
              <th className="py-3 px-4 text-left font-semibold border-r border-green-700">Department</th>
              <th className="py-3 px-4 text-left font-semibold border-r border-green-700">Status</th>
              <th className="py-3 px-4 text-right font-semibold border-r border-green-700">Amount</th>
              <th className="py-3 px-4 text-center font-semibold w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.flatMap((expense, expenseIndex) => {
              const hasExpenseItems = expense.ExpenseItems && 
                                    Array.isArray(expense.ExpenseItems) && 
                                    expense.ExpenseItems.length > 0;
                                    
              if (!hasExpenseItems) {
                const expenseId = expense.id || expense.expenseId || `exp-${expenseIndex}`;
                
                // Format payee name (firstName + lastName)
                const payeeName = (() => {
                  if (expense.firstName || expense.lastName) {
                    return `${expense.firstName || ''} ${expense.lastName || ''}`.trim();
                  } else if (expense.name) {
                    return expense.name;
                  }
                  return 'Unknown';
                })();
                
                let expensePurpose = expense.purpose || expense.expensePurpose || expense.description || 'N/A';
                
                // Get category name
                const categoryName = expense.Category?.name || 'No Category';
                
                let departmentName = '';
                try {
                  if (expense.department) {
                    if (typeof expense.department === 'string') {
                      departmentName = expense.department;
                    } else if (typeof expense.department === 'object' && expense.department !== null) {
                      departmentName = expense.department.departmentName || expense.department.name || '';
                    }
                  } else if (expense.departmentName) {
                    departmentName = expense.departmentName;
                  } else if (expense.Department && expense.Department.departmentName) {
                    departmentName = expense.Department.departmentName;
                  }
                } catch (err) {
                  departmentName = 'Unknown';
                }
                
                const amount = parseFloat(expense.amount || expense.expenseAmount || 0);
                const isCancelled = expense.status === 'cancelled';
                const statusToDisplay = expense.status || 'pending';
                
                return [(
                  <tr 
                    key={`exp-single-${expenseId}-${expenseIndex}`} 
                    className={`border-b hover:bg-gray-50 ${
                      isCancelled ? 'bg-red-50 text-red-600' : ''
                    }`}
                  >
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {payeeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={`${isCancelled ? 'line-through' : ''}`}>
                        {expensePurpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {departmentName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        statusToDisplay === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        statusToDisplay === 'reimbursed' ? 'bg-blue-100 text-blue-800' :
                        statusToDisplay === 'paid' ? 'bg-green-100 text-green-800' :
                        statusToDisplay === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusToDisplay.charAt(0).toUpperCase() + statusToDisplay.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right border-r border-gray-200">
                      <span className={`font-medium ${isCancelled ? 'line-through' : ''}`}>
                        {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="relative">
                        <button 
                          type="button"
                          className="text-gray-600 hover:text-green-600 focus:outline-none"
                          onClick={(e) => toggleDropdown(expenseId, e)}
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {openDropdownId === expenseId && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                            <button
                              onClick={(e) => handleEditFromDropdown(expense, e)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit Expense
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )];
              }
              
              const expenseId = expense.id || expense.expenseId || `exp-${expenseIndex}`;
              
              return expense.ExpenseItems.map((expenseItem, itemIndex) => {
                const uniqueItemKey = `${expenseId}-item-${itemIndex}`;
                
                // Format payee name (firstName + lastName)
                const payeeName = (() => {
                  if (expense.firstName || expense.lastName) {
                    return `${expense.firstName || ''} ${expense.lastName || ''}`.trim();
                  } else if (expense.name) {
                    return expense.name;
                  }
                  return 'Unknown';
                })();
                
                let expensePurpose = expenseItem.purpose || expenseItem.description || 'N/A';
                
                // Get category name for this specific expense item
                const categoryName = expenseItem.Category?.name || 'No Category';
                
                let departmentName = '';
                try {
                  if (expense.department) {
                    if (typeof expense.department === 'string') {
                      departmentName = expense.department;
                    } else if (typeof expense.department === 'object' && expense.department !== null) {
                      departmentName = expense.department.departmentName || expense.department.name || '';
                    }
                  } else if (expense.departmentName) {
                    departmentName = expense.departmentName;
                  } else if (expense.Department && expense.Department.departmentName) {
                    departmentName = expense.Department.departmentName;
                  }
                } catch (err) {
                  departmentName = 'Unknown';
                }
                
                const amount = parseFloat(expenseItem.amount || 0);
                const isCancelled = expenseItem.status === 'cancelled';
                const statusToDisplay = expenseItem.status || 'pending';
                
                return (
                  <tr 
                    key={uniqueItemKey} 
                    className={`border-b hover:bg-gray-50 ${
                      isCancelled ? 'bg-red-50 text-red-600' : ''
                    }`}
                  >
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {payeeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={`${isCancelled ? 'line-through' : ''}`}>
                        {expensePurpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={isCancelled ? 'line-through' : ''}>
                        {departmentName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        statusToDisplay === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        statusToDisplay === 'reimbursed' ? 'bg-blue-100 text-blue-800' :
                        statusToDisplay === 'paid' ? 'bg-green-100 text-green-800' :
                        statusToDisplay === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusToDisplay.charAt(0).toUpperCase() + statusToDisplay.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right border-r border-gray-200">
                      <span className={`font-medium ${isCancelled ? 'line-through' : ''}`}>
                        {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="relative">
                        <button 
                          type="button"
                          className="text-gray-600 hover:text-green-600 focus:outline-none"
                          onClick={(e) => toggleDropdown(`${expenseId}-item-${itemIndex}`, e)}
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {openDropdownId === `${expenseId}-item-${itemIndex}` && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                            <button
                              onClick={(e) => handleEditFromDropdown(expense, e)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit Expense
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })}

            {/* Total row - removed as it's shown elsewhere */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(ExpenseTable);
