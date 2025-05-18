import React from 'react';
import { MoreVertical, Save, X, Download } from 'lucide-react';

const ExpenseTable = ({ 
  filteredExpenses, 
  totalExpense,
  editingId,
  openMenuId,
  handlers,
  expenseSearchTerm 
}) => {
  const {
    handleEditClick,
    handleCancelClick,
    handleSaveClick,
    handleCancelInlineEdit,
    toggleExpenseMenu,
  } = handlers || {};

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA; 
  });

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

  return (
    <div className="relative">
      <div className="max-h-[70vh] overflow-y-auto">
        <table className="min-w-full border-collapse text-sm md:text-base">
          <thead className="sticky top-0 z-10">
            <tr className="bg-green-800 text-white">
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Name</th>
              <th className="py-1 md:py-2 px-2 md:px-3 text-left border border-green-200">Purpose</th>
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
                const expenseId = expense.id || `exp-${expenseIndex}`;
                const expenseName = expense.name || '';
                
                let expensePurpose = expense.purpose || expense.expensePurpose || expense.description || 'N/A';
                
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
                
                return [(
                  <tr 
                    key={`exp-single-${expenseId}-${expenseIndex}`} 
                    className="border-b border-green-200 hover:bg-gray-50 text-xs md:text-sm"
                  >
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">{expenseName || 'Unknown'}</td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200"><span className="font-medium">{expensePurpose}</span></td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">{departmentName || 'N/A'}</td>
                    <td className="py-1 md:py-2 px-2 md:px-3 text-right border border-green-200">
                      <span className="font-medium">
                        {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                      {editingId === expenseId ? (
                        <div className="flex justify-center space-x-1">
                          <button 
                            className="text-green-600 hover:text-green-800 focus:outline-none"
                            onClick={() => handleSaveClick && handleSaveClick(expenseId)}
                          >
                            <Save size={16} className="md:w-5 md:h-5" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                            onClick={handleCancelInlineEdit}
                          >
                            <X size={16} className="md:w-5 md:h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative flex justify-center">
                          <button 
                            className="text-gray-600 hover:text-green-600 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpenseMenu && toggleExpenseMenu(expenseId);
                            }}
                          >
                            <MoreVertical size={16} className="md:w-5 md:h-5" />
                          </button>
                          
                          {openMenuId === expenseId && (
                            <div 
                              className="absolute right-0 top-full mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-20"
                            >
                              <button 
                                className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                                onClick={() => handleEditClick && handleEditClick(expense)}
                              >
                                <span className="mr-2 inline-block">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </span>
                                Edit
                              </button>
                              <button
                                className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                                onClick={() => handleCancelClick && handleCancelClick(expenseId)}
                              >
                                <span className="mr-2 inline-block">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </span>
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )];
              }
              
              return expense.ExpenseItems.map((expenseItem, itemIndex) => {
                // Create a globally unique key using both the expense index and item index
                const uniqueItemKey = `${expense.id || expenseIndex}-item-${itemIndex}`;
                const expenseId = expense.id || `exp-${expenseIndex}`;
                const expenseName = expense.name || '';
                
                let expensePurpose = expenseItem.purpose || expenseItem.description || 'N/A';
                
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
                
                return (
                  <tr 
                    key={uniqueItemKey} 
                    className={`border-b border-green-200 hover:bg-gray-50 text-xs md:text-sm ${itemIndex > 0 ? 'bg-gray-50' : ''}`}
                  >
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">{expenseName || 'Unknown'}</td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200"><span className="font-medium">{expensePurpose}</span></td>
                    <td className="py-1 md:py-2 px-2 md:px-3 border border-green-200">{departmentName || 'N/A'}</td>
                    <td className="py-1 md:py-2 px-2 md:px-3 text-right border border-green-200">
                      <span className="font-medium">
                        {isNaN(amount) ? '0.00' : amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                      <div className="relative flex justify-center">
                        <button 
                          className="text-gray-600 hover:text-green-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpenseMenu && toggleExpenseMenu(uniqueItemKey);
                          }}
                        >
                          <MoreVertical size={16} className="md:w-5 md:h-5" />
                        </button>
                        
                        {openMenuId === uniqueItemKey && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-20"
                          >
                            <button 
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                              onClick={() => handleEditClick && handleEditClick(expense)}
                            >
                              <span className="mr-2 inline-block">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </span>
                              Edit
                            </button>
                            <button
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                              onClick={() => handleCancelClick && handleCancelClick(expenseId)}
                            >
                              <span className="mr-2 inline-block">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </span>
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })}

            {/* Total row  */}
            <tr className="bg-green-100">
              <td colSpan="3" className="py-1 md:py-2 px-2 md:px-3 font-bold border border-green-200 text-green-800 text-left">TOTAL:</td>
              <td className="py-1 md:py-2 px-2 md:px-3 text-right font-bold border border-green-200 text-green-800">
                {totalExpense.toLocaleString(undefined, {
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

// Wrap the export with React.memo to prevent unnecessary re-renders
export default React.memo(ExpenseTable);
