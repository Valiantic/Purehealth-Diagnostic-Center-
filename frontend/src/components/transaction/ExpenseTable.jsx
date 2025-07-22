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
        .filter(item => item.status !== 'refunded' && item.status !== 'paid')
        .reduce((itemTotal, item) => itemTotal + parseFloat(item.amount || 0), 0);
    }
    return expense.status !== 'refunded' && expense.status !== 'paid' ? total + parseFloat(expense.amount || 0) : total;
  }, 0);

  const refundedTotalExpense = filteredExpenses.reduce((total, expense) => {
    if (expense.ExpenseItems && Array.isArray(expense.ExpenseItems)) {
      return total + expense.ExpenseItems
        .filter(item => item.status === 'refunded')
        .reduce((itemTotal, item) => itemTotal + parseFloat(item.amount || 0), 0);
    }
    return expense.status === 'refunded' ? total + parseFloat(expense.amount || 0) : total;
  }, 0);

  return (
    <div className="relative">
      <div className="max-h-[70vh] overflow-y-auto">
        <table className="min-w-full border-collapse text-sm md:text-base">
          <thead className="sticky top-0 z-10">
            <tr className="bg-green-800 text-white">
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Payee Name</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Purpose</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Category</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Department</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-right border border-green-200">Amount</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-center border border-green-200 w-24">Action</th>
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
                const isRefunded = expense.status === 'refunded';
                
                return [(
                  <tr 
                    key={`exp-single-${expenseId}-${expenseIndex}`} 
                    className={`border-b border-green-200 hover:bg-gray-50 text-xs md:text-sm ${
                      isRefunded ? 'bg-gray-200 text-gray-500' : ''
                    }`}
                  >
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {payeeName}
                      </span>
                      {isRefunded && (
                        <span className="ml-1 text-xs text-red-500 italic">(Refunded)</span>
                      )}
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={`font-medium ${isRefunded ? 'line-through' : ''}`}>
                        {expensePurpose}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {departmentName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 text-right border border-green-200">
                      <div>
                        <span className={`font-medium ${isRefunded ? 'line-through' : ''}`}>
                          {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        {isRefunded && (
                          <span className="ml-1 text-xs text-red-500">→ 0.00</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                      <div className="relative">
                        <button 
                          type="button"
                          className="text-gray-600 hover:text-green-600 focus:outline-none"
                          onClick={(e) => toggleDropdown(expenseId, e)}
                        >
                          <MoreVertical size={16} className="md:w-5 md:h-5" />
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
                const isRefunded = expenseItem.status === 'refunded';
                
                return (
                  <tr 
                    key={uniqueItemKey} 
                    className={`
                      border-b border-green-200 hover:bg-gray-50 text-xs md:text-sm 
                      ${itemIndex > 0 ? 'bg-gray-50' : ''}
                      ${isRefunded ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {payeeName}
                      </span>
                      {isRefunded && (
                        <span className="ml-1 text-xs text-red-500 italic">(Refunded)</span>
                      )}
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={`font-medium ${isRefunded ? 'line-through' : ''}`}>
                        {expensePurpose}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">
                      <span className={isRefunded ? 'line-through' : ''}>
                        {departmentName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-3 text-right border border-green-200">
                      <div>
                        <span className={`font-medium ${isRefunded ? 'line-through' : ''}`}>
                          {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        {isRefunded && (
                          <span className="ml-1 text-xs text-red-500">→ 0.00</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                      <div className="relative">
                        <button 
                          type="button"
                          className="text-gray-600 hover:text-green-600 focus:outline-none"
                          onClick={(e) => toggleDropdown(`${expenseId}-item-${itemIndex}`, e)}
                        >
                          <MoreVertical size={16} className="md:w-5 md:h-5" />
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

            {/* Active expenses total row */}
            <tr className="bg-green-100">
              <td colSpan="4" className="py-1 md:py-2 px-2 md:px-3 font-bold border border-green-200 text-green-800 text-left">TOTAL:</td>
              <td className="py-1 md:py-2 px-2 md:px-3 text-right font-bold border border-green-200 text-green-800">
                {activeTotalExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Footer section with Generate Report button and record count */}
      <div className="mt-2 flex flex-col md:flex-row justify-between items-center p-2">
        <div className="flex flex-wrap items-center mb-4 md:mb-0">
          {filteredExpenses.length > 0 && (
            <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
              Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          {expenseSearchTerm && sortedExpenses.length > filteredExpenses.length && 
            <span> (filtered from {sortedExpenses.length})</span>}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExpenseTable);
