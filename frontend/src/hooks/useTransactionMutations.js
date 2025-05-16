import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../services/api';
import { toast } from 'react-toastify';

const useTransactionMutations = (userId, selectedDate, onSuccessCallback) => {
  const queryClient = useQueryClient();

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: (transactionId) => {
      return transactionAPI.updateTransactionStatus(
        transactionId,
        'cancelled',
        userId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
        exact: false,
        refetchType: 'all'
      });
      
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error) => {
      console.error('Failed to cancel transaction:', error);
      toast.error(`Failed to cancel transaction: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  });

  // Save transaction mutation
  const saveTransactionMutation = useMutation({
    mutationFn: (data) => {
      return transactionAPI.updateTransaction(data.transactionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction updated successfully');
      
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  });

  // Save edited transaction with refunds
  const saveEditedTransactionMutation = useMutation({
    mutationFn: (data) => {
      return transactionAPI.updateTransaction(data.transactionId, data);
    },
    onSuccess: (response, variables) => {
      if (response?.data) {
        toast.success('Transaction updated successfully');
        
        const hasRefunds = variables.isRefundProcessing;
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: ['transactions'],
          exact: false,
          refetchType: 'all'
        });
        
        queryClient.invalidateQueries({
          queryKey: ['refunds'],
          exact: false,
          refetchType: 'all'
        });
        
        queryClient.invalidateQueries({
          queryKey: ['department-revenue'],
          exact: false,
          refetchType: 'all'
        });
        
        if (onSuccessCallback) {
          onSuccessCallback(hasRefunds);
        }
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to save changes: Unexpected response format');
      }
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  });

  return {
    cancelTransactionMutation,
    saveTransactionMutation,
    saveEditedTransactionMutation
  };
};

export default useTransactionMutations;
