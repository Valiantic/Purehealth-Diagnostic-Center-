import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="bg-red-600 rounded-t-lg text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <LogOut className="mr-2" size={24} />
            <h3 className="text-xl font-bold">Confirm Logout</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-lg mb-6">
            Are you sure you want to logout?
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
            >
              <LogOut className="mr-2" size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
