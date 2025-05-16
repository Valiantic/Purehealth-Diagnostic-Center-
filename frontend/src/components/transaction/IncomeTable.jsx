import React from 'react';
import { MoreVertical, Save, X } from 'lucide-react';
import { getRefundedTestsInfo } from '../../utils/transactionUtils';

const TransactionRow = ({ 
  transaction,
  departmentsWithValues,
  editingId,
  editedTransaction,
  openMenuId,
  referrers,
  handlers
}) => {
  const { 
    handleEditClick, 
    handleCancelClick, 
    handleEditChange, 
    handleSaveClick,
    handleCancelInlineEdit,
    toggleIncomeMenu,
    handleDropdownClick
  } = handlers;

  return (
    <tr 
      key={transaction.id} 
      className={transaction.status === 'cancelled' 
        ? 'bg-gray-100 text-gray-500' 
        : getRefundedTestsInfo(transaction).count > 0 ? 'bg-red-50' : 'bg-white'
      }
    >
      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 sticky left-0 bg-inherit">
        {editingId === transaction.id ? (
          <input
            type="text"
            value={editedTransaction.id}
            onChange={(e) => handleEditChange(e, 'id')}
            className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        ) : (
          <span className={transaction.status === 'cancelled' ? 'line-through' : ''}>
            {transaction.id}
            {getRefundedTestsInfo(transaction).count > 0 && (
              <span className="ml-1 text-xs text-red-600 font-medium">
                ({getRefundedTestsInfo(transaction).count} refunded: ₱{getRefundedTestsInfo(transaction).amount.toFixed(2)})
              </span>
            )}
          </span>
        )}
      </td>
      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200">
        {editingId === transaction.id ? (
          <input
            type="text"
            value={editedTransaction.name}
            onChange={(e) => handleEditChange(e, 'name')}
            className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        ) : (
          <span className={transaction.status === 'cancelled' ? 'line-through' : ''}>
            {transaction.name}
          </span>
        )}
      </td>
      
      {/* Department columns and amounts */}
      {departmentsWithValues.map(dept => {
        const deptData = transaction.departmentRevenues[dept.departmentId];
        const isArchivedWithValue = dept.status !== 'active' && 
                                  deptData && 
                                  deptData.amount > 0;
        const hasRefund = transaction.status !== 'cancelled' && deptData && deptData.refundAmount > 0;
        const hasBalance = transaction.status !== 'cancelled' && deptData && deptData.balanceAmount > 0;
            
        return (
          <td 
            key={dept.departmentId} 
            className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 ${isArchivedWithValue ? 'bg-green-50' : ''} ${hasRefund || hasBalance ? 'relative' : ''}`}
          >
            {transaction.status === 'cancelled' 
              ? <span className="text-gray-500 text-xs">Cancelled</span>
              : (
                  <>
                    {deptData && deptData.amount > 0 ? (
                      <span className={hasBalance ? 'relative' : ''}>
                        {deptData.amount.toLocaleString(2)}
                      </span>
                    ) : ''}
                  </>
                )
            }
          </td>
        );
      })}
      
      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
        {transaction.status === 'cancelled' ? (
          '' 
        ) : (
          transaction.grossDeposit.toLocaleString(2)
        )}
      </td>
      <td className="py-0 md:py-1 px-1 md:px-2 border border-green-200 max-w-[80px] md:max-w-[120px]">
        {editingId === transaction.id ? (
          <select
            value={editedTransaction.referrerId}
            onChange={(e) => handleEditChange(e, 'referrerId')}
            className="w-full px-1 py-1 border border-green-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="">Out Patient</option>
            {referrers.map(ref => (
              <option key={ref.referrerId} value={ref.referrerId}>
                Dr. {ref.lastName}
              </option>
            ))}
          </select>
        ) : (
          <div 
            title={`Referrer: ${transaction.originalTransaction?.referrerId || 'None'}`} 
            className={`truncate text-xs md:text-sm font-medium ${transaction.status === 'cancelled' ? 'text-gray-500' : ''}`}
          >
            {transaction.referrer}
          </div>
        )}
      </td>
      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
        {transaction.status !== 'cancelled' && (
          <div className="relative flex justify-center">
            {editingId === transaction.id ? (
              <div className="flex space-x-1">
                <button 
                  className="text-green-600 hover:text-green-800 focus:outline-none"
                  onClick={() => handleSaveClick(transaction)}
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
              <button 
                className="text-gray-600 hover:text-green-600 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIncomeMenu(transaction.id);
                }}
              >
                <MoreVertical size={16} className="md:w-5 md:h-5" />
              </button>
            )}
            
            {openMenuId === transaction.id && !editingId && (
              <div 
                className="absolute right-0 top-full mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-20"
                onClick={handleDropdownClick}
              >
                <button 
                  className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                  onClick={() => handleEditClick(transaction)}
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
                  onClick={() => handleCancelClick(transaction)}
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
        {transaction.status === 'cancelled' && (
          <span className="text-red-500 text-xs md:text-sm font-medium">Cancelled</span>
        )}
      </td>
    </tr>
  );
};

export default TransactionRow;
