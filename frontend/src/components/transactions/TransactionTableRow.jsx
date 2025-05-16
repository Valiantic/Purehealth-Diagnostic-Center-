import React from 'react';
import { Edit, X, MoreVertical, Save, FileText } from 'lucide-react';
import { getRefundedTestsInfo } from '../../utils/transactionUtils';

const TransactionTableRow = ({
  transaction,
  departmentsWithValues,
  editingId,
  editedTransaction,
  openMenuId,
  referrers,
  handleEditClick,
  handleCancelClick,
  handleSaveClick,
  handleEditChange,
  handleCancelInlineEdit,
  toggleIncomeMenu,
  handleDropdownClick,
  handleViewSummary
}) => {
  return (
    <tr 
      className={transaction.status === 'cancelled' 
        ? 'bg-gray-100 text-gray-500' 
        : getRefundedTestsInfo(transaction).count > 0 ? 'bg-red-50' : 'bg-white'
      }
    >
      {/* MC# Column */}
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
      
      {/* Patient Name Column */}
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
            
        return (
          <td 
            key={dept.departmentId} 
            className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 ${isArchivedWithValue ? 'bg-green-50' : ''} ${hasRefund ? 'relative' : ''}`}
          >
            {transaction.status === 'cancelled' 
              ? <span className="text-gray-500 text-xs">Cancelled</span>
              : (
                  <>
                    {deptData && deptData.amount > 0 ? (
                      <span className={hasRefund ? 'relative' : ''}>
                        {deptData.amount.toLocaleString(2)}
                      </span>
                    ) : ''}
                  </>
                )
            }
          </td>
        );
      })}
      
      {/* Gross Column */}
      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
        {transaction.status === 'cancelled' ? (
          ''
        ) : (
          transaction.grossDeposit.toLocaleString(2)
        )}
      </td>
      
      {/* Referrer Column */}
      <td className="py-0 md:py-1 px-1 md:px-2 border border-green-200 max-w-[80px] md:max-w-[120px]">
        <div className="text-xs md:text-sm truncate">
          {editingId === transaction.id ? (
            <select
              value={editedTransaction.originalTransaction.referrerId || ""}
              onChange={(e) => {
                const referrerId = e.target.value || null;
                setEditedTransaction({
                  ...editedTransaction,
                  originalTransaction: {
                    ...editedTransaction.originalTransaction,
                    referrerId
                  }
                });
              }}
              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
            >
              <option value="">Out Patient</option>
              {referrers.map((ref) => (
                <option key={ref.referrerId} value={ref.referrerId}>
                  Dr. {ref.lastName}
                </option>
              ))}
            </select>
          ) : (
            <span className={transaction.status === 'cancelled' ? 'line-through' : ''}>
              {transaction.referrer}
            </span>
          )}
        </div>
      </td>
      
      {/* Actions Column */}
      <td className="py-0 md:py-1 px-1 md:px-2 border border-green-200 text-center relative">
        {editingId === transaction.id ? (
          <div className="flex justify-center space-x-1 md:space-x-2">
            <button
              onClick={handleSaveClick}
              className="text-green-600 hover:text-green-800"
              title="Save changes"
            >
              <Save className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={handleCancelInlineEdit}
              className="text-red-500 hover:text-red-700"
              title="Cancel editing"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleIncomeMenu(transaction.id);
              }}
              className="text-green-700 hover:text-green-900"
              title="Actions"
            >
              <MoreVertical className="h-4 w-4 md:h-5 md:w-5 mx-auto" />
            </button>
            
            {openMenuId === transaction.id && (
              <div 
                className="absolute right-0 mt-1 z-50 bg-white shadow-lg rounded-md overflow-hidden min-w-[120px] border border-gray-200"
                onClick={handleDropdownClick}
              >
                {transaction.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => {
                        toggleIncomeMenu(null);
                        handleViewSummary(transaction);
                      }}
                      className="w-full px-3 py-1 text-left text-xs md:text-sm hover:bg-green-50 flex items-center"
                    >
                      <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleIncomeMenu(null);
                        handleEditClick(transaction);
                      }}
                      className="w-full px-3 py-1 text-left text-xs md:text-sm hover:bg-green-50 flex items-center"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleIncomeMenu(null);
                        handleCancelClick(transaction);
                      }}
                      className="w-full px-3 py-1 text-left text-xs md:text-sm hover:bg-red-50 text-red-600 flex items-center"
                    >
                      <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                
                {transaction.status === 'cancelled' && (
                  <div className="px-3 py-1 text-gray-500 text-xs md:text-sm italic">
                    Cancelled
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default TransactionTableRow;
