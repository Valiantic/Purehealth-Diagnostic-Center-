import React from 'react';

const ConfirmationModal = ({ 
  isOpen,
  onClose,
  onConfirm,
  isPending,
  title = "Confirm Cancellation",
  message = "Are you sure you want to cancel this transaction? This action cannot be undone.",
  confirmText = "Yes, Cancel It", 
  cancelText = "No, Keep It"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-red-600 mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            onClick={onClose}
            type="button"
            id="cancel-confirmation-btn"
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={onConfirm}
            disabled={isPending}
            type="button"
            id="confirm-cancellation-btn"
          >
            {isPending ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
