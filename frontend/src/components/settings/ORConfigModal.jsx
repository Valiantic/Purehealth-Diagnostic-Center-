import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';

const ORConfigModal = ({ isOpen, onClose, onSave, currentORNumber, highestTransactionOR }) => {
    const [orNumber, setOrNumber] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && currentORNumber) {
            setOrNumber(currentORNumber.toString());
        }
    }, [isOpen, currentORNumber]);

    const handleSave = () => {
        const newORNumber = parseInt(orNumber);

        // Validation: must be a number and greater than highest transaction OR#
        if (isNaN(newORNumber)) {
            setError('Please enter a valid number');
            return;
        }

        // Use highestTransactionOR if provided, otherwise fall back to currentORNumber
        const minAllowed = highestTransactionOR !== undefined ? highestTransactionOR : currentORNumber;

        if (newORNumber <= minAllowed) {
            setError(`OR# must be greater than ${minAllowed} (highest transaction OR#)`);
            return;
        }

        onSave(newORNumber);
        setError('');
        onClose();
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-auto shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-green-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileText size={24} />
                        <h2 className="text-lg font-semibold">OR# Configuration</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="orNumber" className="block text-green-700 font-medium mb-2">
                            Next OR#/MC No
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                            Highest Transaction OR#: <span className="font-semibold text-gray-700">{highestTransactionOR !== undefined ? highestTransactionOR : currentORNumber}</span>
                        </p>
                        <input
                            type="number"
                            id="orNumber"
                            value={orNumber}
                            onChange={(e) => {
                                setOrNumber(e.target.value);
                                setError('');
                            }}
                            min={highestTransactionOR !== undefined ? highestTransactionOR + 1 : currentORNumber}
                            placeholder={`Enter number (must be > ${highestTransactionOR !== undefined ? highestTransactionOR : currentORNumber})`}
                            className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition-colors ${error
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:border-green-500'
                                }`}
                            required
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            Note: OR# must be greater than the highest transaction OR# to prevent duplicates.
                        </p>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-green-800 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Save Configuration
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-6 bg-gray-500 text-white py-3 rounded-md font-semibold hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ORConfigModal;
