import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatShortDate, calculateAge } from '../../utils/dateUtils';

const noSpinnerStyle = { 
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
  margin: 0, 
  appearance: 'textfield' 
};

const TransactionSummaryModal = ({
  isOpen,
  onClose,
  transaction,
  isEditingSummary,
  editedTransaction,
  isLoading,
  isRefundMode,
  selectedRefunds,
  referrers,
  idTypeOptions,
  mcNoExists,
  isMcNoChecking,
  mutations,
  handlers
}) => {
  if (!isOpen || !transaction) return null;

  const { 
    handleSummaryInputChange, 
    handleMcNoChange, 
    handleTestDetailChange, 
    handleSaveEdit, 
    handleCancelEdit,
    handleEnterEditMode, 
    toggleRefundMode, 
    handleRefundSelection 
  } = handlers;


  const getReferrerDisplayName = () => {
    if (!transaction) return 'Out Patient';
    
    if (transaction.referrer) return transaction.referrer;
    
    const referrerId = transaction.referrerId || transaction.originalTransaction?.referrerId;
    if (!referrerId) return 'Out Patient';
    
    const referrer = referrers.find(r => String(r.referrerId) === String(referrerId));
    return referrer ? `Dr. ${referrer.lastName}` : 'Out Patient';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] flex flex-col">
        <div className="bg-green-800 text-white p-3 md:p-4 flex justify-between items-center rounded-t-md sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-bold">
            {isEditingSummary ? 'Edit Transaction' : 'Transaction Summary'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-green-800 font-semibold">Loading transaction data...</div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
              {isEditingSummary && isRefundMode && (
                <div className="bg-red-50 p-3 border-l-4 border-red-500 mb-3">
                  <h3 className="text-red-700 font-bold">Refund Mode Active</h3>
                  <p className="text-red-600 text-sm">
                    Select tests to refund by checking the boxes in the Refund column. 
                    Selected tests will be marked as refunded and completely removed from revenue calculations.
                    The original price of the test will be added to the daily refund total.
                  </p>
                </div>
              )}
              
              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
                <div className="p-3 md:border-r border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="font-bold text-green-800">First Name:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <input
                          type="text"
                          value={editedTransaction.originalTransaction.firstName}
                          onChange={(e) => handleSummaryInputChange(e, 'firstName')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                        />
                      ) : (
                        transaction.originalTransaction?.firstName || 'N/A'
                      )}
                    </div>

                    <div className="font-bold text-green-800">Last Name:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <input
                          type="text"
                          value={editedTransaction.originalTransaction.lastName}
                          onChange={(e) => handleSummaryInputChange(e, 'lastName')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                        />
                      ) : (
                        transaction.originalTransaction?.lastName || 'N/A'
                      )}
                    </div>
                    
                    <div className="font-bold text-green-800">Referrer:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <select
                          value={editedTransaction.originalTransaction.referrerId || ""}
                          onChange={(e) => handleSummaryInputChange(e, 'referrerId')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                        >
                          <option value="">Out Patient</option>
                          {referrers.map(ref => (
                            <option key={ref.referrerId} value={ref.referrerId}>
                              Dr. {ref.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getReferrerDisplayName()
                      )}
                    </div>

                    <div className="font-bold text-green-800">OR#:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <div>
                          <input
                            type="text"
                            value={editedTransaction.id}
                            onChange={handleMcNoChange}
                            className={`w-full px-2 py-1 border ${mcNoExists ? 'border-red-500' : 'border-green-600'} rounded focus:outline-none focus:ring-1 ${mcNoExists ? 'focus:ring-red-500' : 'focus:ring-green-600'}`}
                          />
                          {isMcNoChecking && <span className="text-xs text-blue-500 mt-1">Checking...</span>}
                          {mcNoExists && <span className="text-xs text-red-500 mt-1">This MC# already exists in the database</span>}
                        </div>
                      ) : (
                        transaction.id
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="font-bold text-green-800">Birth Date:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <div className="relative">
                          <input
                            type="date"
                            value={editedTransaction.originalTransaction.birthDate ? 
                              new Date(editedTransaction.originalTransaction.birthDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleSummaryInputChange(e, 'birthDate')}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 border border-green-600 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-600"
                            onClick={(e) => e.target.showPicker()}
                          />
                        </div>
                      ) : (
                        <>
                          {transaction.originalTransaction?.birthDate
                            ? `${formatShortDate(transaction.originalTransaction.birthDate)}  (Age: ${calculateAge(transaction.originalTransaction.birthDate)})`
                            : 'N/A'}
                        </>
                      )}
                    </div>

                    <div className="font-bold text-green-800">Sex:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <select
                          value={editedTransaction.originalTransaction.sex || ""}
                          onChange={(e) => handleSummaryInputChange(e, 'sex')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        transaction.originalTransaction?.sex || 'N/A'
                      )}
                    </div>

                    <div className="font-bold text-green-800">ID Type:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <select
                          value={editedTransaction.originalTransaction.idType || ''}
                          onChange={(e) => handleSummaryInputChange(e, 'idType')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                        >
                          {idTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        transaction.originalTransaction?.idType || 'Regular'
                      )}
                    </div>

                    <div className="font-bold text-green-800">ID #:</div>
                    <div className="col-span-2 text-green-700">
                      {isEditingSummary ? (
                        <input
                          type="text"
                          maxLength={25}
                          value={editedTransaction.originalTransaction.idNumber || ''}
                          onChange={(e) => handleSummaryInputChange(e, 'idNumber')}
                          className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                          readOnly={editedTransaction.originalTransaction.idType === 'Regular'} 
                          disabled={editedTransaction.originalTransaction.idType === 'Regular'}
                        />
                      ) : (
                        transaction.originalTransaction?.idNumber || 'N/A'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Details Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Test Name</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Original Price</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Disc. %</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Price</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Cash</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">GCash</th>
                      <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Balance</th>
                      {isEditingSummary && isRefundMode && (
                        <th className="p-1 md:p-2 text-center border-b border-gray-200 font-bold text-red-600">Refund</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingSummary 
                      ? editedTransaction?.originalTransaction?.TestDetails 
                      : transaction?.originalTransaction?.TestDetails)
                      ?.map((test, index) => (
                      <tr key={index} 
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${test.status === 'refunded' && !isEditingSummary ? "bg-red-50" : ""}`}>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          <div className="text-xs md:text-sm">
                            {test.testName}
                            {test.status === 'refunded' && 
                              <span className="ml-1 text-xs text-red-500 font-medium">(Refunded)</span>}
                          </div>
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          <div className={`text-xs md:text-sm font-medium ${test.status === 'refunded' && !isEditingSummary ? "text-red-500" : ""}`}>
                            {parseFloat(test.originalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          {isEditingSummary ? (
                            <input
                              type="text" 
                              inputMode="numeric" 
                              pattern="[0-9]*" 
                              value={test.discountPercentage || ''}
                              onChange={(e) => handleTestDetailChange(index, 'discountPercentage', e.target.value)}
                              style={noSpinnerStyle}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              placeholder="0"
                              disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                            />
                          ) : (
                            <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500" : ""}`}>
                              {`${test.discountPercentage}%`}
                            </div>
                          )}
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          <div className={`text-xs md:text-sm font-medium ${test.status === 'refunded' && !isEditingSummary ? "text-red-500 line-through" : ""}`}>
                            {parseFloat(test.discountedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {test.status === 'refunded' && <span className="ml-1 text-red-500">→ 0.00</span>}
                          </div>
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          {isEditingSummary ? (
                            <input
                              type="text" 
                              inputMode="decimal" 
                              value={test.cashAmount || ''}
                              onChange={(e) => handleTestDetailChange(index, 'cashAmount', e.target.value)}
                              onKeyPress={(e) => {
                                // Allow only numbers and decimal point
                                const regex = /^[0-9.]*$/;
                                if (!regex.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              style={{...noSpinnerStyle, caretColor: 'auto'}}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              placeholder="0.00"
                              disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                            />
                          ) : (
                            <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                              {parseFloat(test.cashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          {isEditingSummary ? (
                            <input
                              type="text" 
                              inputMode="decimal" 
                              value={test.gCashAmount || ''}
                              onChange={(e) => handleTestDetailChange(index, 'gCashAmount', e.target.value)}
                              onKeyPress={(e) => {
                                // Allow only numbers and decimal point
                                const regex = /^[0-9.]*$/;
                                if (!regex.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              style={{...noSpinnerStyle, caretColor: 'auto'}}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              placeholder="0.00"
                              disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                            />
                          ) : (
                            <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                              {parseFloat(test.gCashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td className="p-1 md:p-2 border-b border-gray-200">
                          {isEditingSummary ? (
                            <input
                              type="text" 
                              inputMode="decimal" 
                              value={test.balanceAmount || ''}
                              onChange={(e) => handleTestDetailChange(index, 'balanceAmount', e.target.value)}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                              placeholder="0.00"
                              disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                            />
                          ) : (
                            <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                              {parseFloat(test.balanceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        {isEditingSummary && isRefundMode && (
                          <td className="p-1 md:p-2 border-b border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedRefunds[test.testDetailId] || test.status === 'refunded'}
                              onChange={() => handleRefundSelection(test.testDetailId)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              disabled={test.status === 'refunded'}
                            />
                            {(!!selectedRefunds[test.testDetailId] || test.status === 'refunded') && (
                              <div className="text-xs text-red-600 mt-1 font-medium">
                                {test.status === 'refunded' ? 'Already refunded' : 'Will be refunded'}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Total row - protect against undefined TestDetails */}
                  {(isEditingSummary 
                    ? editedTransaction?.originalTransaction?.TestDetails?.length 
                    : transaction?.originalTransaction?.TestDetails?.length) > 0 && (
                    <tfoot>
                      <tr className="bg-green-100 font-bold">
                        <td className="p-2 border-b border-gray-200 text-green-800" colSpan={4}>TOTAL</td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {(() => {
                            // Calculate cash total excluding refunded tests
                            let cashTotal = 0;
                            const testDetails = isEditingSummary
                              ? editedTransaction?.originalTransaction?.TestDetails
                              : transaction?.originalTransaction?.TestDetails;
                              
                            if (testDetails) {
                              testDetails.forEach(test => {
                                if (isEditingSummary || test.status !== 'refunded') {
                                  cashTotal += parseFloat(test.cashAmount || 0);
                                }
                              });
                            }
                            
                            return cashTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {(() => {
                            // Calculate GCash total excluding refunded tests
                            let gCashTotal = 0;
                            const testDetails = isEditingSummary
                              ? editedTransaction?.originalTransaction?.TestDetails
                              : transaction?.originalTransaction?.TestDetails;
                            
                            if (testDetails) {
                              testDetails.forEach(test => {
                                if (isEditingSummary || test.status !== 'refunded') {
                                  gCashTotal += parseFloat(test.gCashAmount || 0);
                                }
                              });
                            }
                            
                            return gCashTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </td>
                        <td className="p-2 border-b border-gray-200 text-green-800">
                          {(() => {
                            // Calculate balance total excluding refunded tests
                            let balanceTotal = 0;
                            const testDetails = isEditingSummary
                              ? editedTransaction?.originalTransaction?.TestDetails
                              : transaction?.originalTransaction?.TestDetails;
                            
                            if (testDetails) {
                              testDetails.forEach(test => {
                                if (isEditingSummary || test.status !== 'refunded') {
                                  balanceTotal += parseFloat(test.balanceAmount || 0);
                                }
                              });
                            }
                            
                            return balanceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </td>
                        {isEditingSummary && isRefundMode && (
                          <td className="p-2 border-b border-gray-200 text-red-600">
                            {Object.keys(selectedRefunds).length} item(s)
                          </td>
                        )}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            
            {/* Footer buttons */}
            <div className="flex justify-end gap-4 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              {isEditingSummary ? (
                <>
                  <button
                    className="bg-gray-500 text-white px-8 py-2 rounded hover:bg-gray-600 focus:outline-none"
                    onClick={handleCancelEdit}
                    disabled={mutations?.saveTransaction?.isPending}
                  >
                    Cancel
                  </button>
                  {isRefundMode ? (
                    <button
                      className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 focus:outline-none"
                      onClick={toggleRefundMode}
                      disabled={mutations?.saveTransaction?.isPending}
                    >
                      Exit Refund Mode
                    </button>
                  ) : (
                    <button
                      className="bg-red-600 text-white px-8 py-2 rounded hover:bg-red-700 focus:outline-none"
                      onClick={toggleRefundMode}
                      disabled={mutations?.saveTransaction?.isPending}
                    >
                      Refund
                    </button>
                  )}
                  <button
                    className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
                    onClick={handleSaveEdit}
                    disabled={mutations?.saveTransaction?.isPending}
                  >
                    {mutations?.saveTransaction?.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
                    onClick={handleEnterEditMode}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
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

export default TransactionSummaryModal;
