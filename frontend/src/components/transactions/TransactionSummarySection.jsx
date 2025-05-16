import React from 'react';
import { Download } from 'lucide-react';
import { isTestRefunded } from '../../utils/transactionUtils';

const TransactionSummarySection = ({ 
  filteredTransactions, 
  totalGCash,
  departmentTotals,
  departmentsWithValues
}) => {
  // Calculate refund total directly inside the component
  const calculateRefunds = () => {
    let refundTotal = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction?.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          if (isTestRefunded(test)) {
            const amount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
            refundTotal += amount;
          }
        });
      }
    });
    
    return refundTotal;
  };
  
  // Calculate deposit: total gross - refunds - gcash
  const calculateDeposit = () => {
    let totalGross = 0;
    let refundTotal = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled') {
        // Add gross amount
        if (transaction.originalTransaction?.TestDetails) {
          transaction.originalTransaction.TestDetails.forEach(test => {
            if (test.status !== 'refunded') {
              totalGross += parseFloat(test.discountedPrice) || 0;
            }
          });
        } else {
          totalGross += transaction.grossDeposit;
        }
        
        // Calculate refunds
        if (transaction.originalTransaction?.TestDetails) {
          transaction.originalTransaction.TestDetails.forEach(test => {
            if (isTestRefunded(test)) {
              refundTotal += parseFloat(test.originalPrice || test.discountedPrice) || 0;
            }
          });
        }
      }
    });
    
    // Deposit is gross minus refunds minus gcash
    return totalGross - refundTotal - totalGCash;
  };
  
  // Get the calculated values
  const refundTotal = calculateRefunds();
  const depositTotal = calculateDeposit();
  
  // Get gross total (excluding cancelled transactions)
  const grossTotal = filteredTransactions.reduce((total, transaction) => {
    if (transaction.status !== 'cancelled') {
      return total + transaction.grossDeposit;
    }
    return total;
  }, 0);
  
  return (
    <div className="mt-4 border-t border-green-800 pt-3">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex flex-wrap gap-2 md:gap-4">
          <div className="bg-green-50 border border-green-200 px-2 md:px-4 py-1 md:py-2 rounded-lg">
            <span className="text-green-900 font-medium text-xs md:text-sm">Total: </span>
            <span className="text-green-800 font-bold ml-1">
              ₱{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="bg-red-50 border border-red-200 px-2 md:px-4 py-1 md:py-2 rounded-lg">
            <span className="text-red-900 font-medium text-xs md:text-sm">Refunds: </span>
            <span className="text-red-800 font-bold ml-1">
              ₱{refundTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 px-2 md:px-4 py-1 md:py-2 rounded-lg">
            <span className="text-blue-900 font-medium text-xs md:text-sm">GCash: </span>
            <span className="text-blue-800 font-bold ml-1">
              ₱{totalGCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 px-2 md:px-4 py-1 md:py-2 rounded-lg">
            <span className="text-yellow-900 font-medium text-xs md:text-sm">Deposit: </span>
            <span className="text-yellow-800 font-bold ml-1">
              ₱{depositTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div>
          <button className="flex items-center space-x-1 bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Department breakdown */}
      {departmentsWithValues && departmentsWithValues.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Department Breakdown:</h3>
          <div className="flex flex-wrap gap-2">
            {departmentsWithValues.map(dept => (
              <div 
                key={dept.departmentId} 
                className="bg-gray-50 border border-gray-200 px-2 py-1 rounded-md"
              >
                <span className="text-xs font-medium text-gray-600">{dept.departmentName}: </span>
                <span className="text-xs font-bold text-green-800">
                  ₱{(departmentTotals?.[dept.departmentId] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSummarySection;
