import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const TestQueueModal = ({
  isOpen,
  onClose,
  queue,
  formData,
  departments = [],
  isProcessing,
  errors,
  isValid,
  onAddToQueue,
  onRemoveFromQueue,
  onProcessQueue,
  onUpdateFormField,
  title = "New Test"
}) => {
  if (!isOpen) return null;

  const handleAddToQueue = () => {
    onAddToQueue();
  };

  const handleInputChange = (field, value) => {
    onUpdateFormField(field, value);
  };

  const handlePriceChange = (value) => {
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      handleInputChange('price', value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-md relative">
        <div className="bg-green-800 text-white p-3 rounded-t-md flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-green-800 font-medium mb-1">Test Name</label>
              <input
                type="text"
                value={formData.testName}
                onChange={(e) => handleInputChange('testName', e.target.value)}
                className={`w-full border border-gray-300 rounded p-2 ${
                  errors.testName ? 'border-red-500' : ''
                }`}
                placeholder="Electrocardiogram"
                disabled={isProcessing}
              />
              {errors.testName && (
                <span className="text-red-500 text-xs mt-1 block">{errors.testName}</span>
              )}
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Date Created</label>
              <div className="relative" onClick={() => document.getElementById('new-test-date').showPicker()}>
                <input
                  id="new-test-date"
                  type="date"
                  value={formData.dateCreated ? new Date(formData.dateCreated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('dateCreated', new Date(e.target.value))}
                  className="w-full border border-gray-300 rounded p-2 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Test Department</label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full border border-gray-300 rounded p-2 appearance-none ${
                  errors.department ? 'border-red-500' : ''
                }`}
                disabled={isProcessing}
                required
              >
                <option value="">Select department</option>
                {departments
                  .filter(dept => dept.status === 'active')
                  .map(dept => (
                    <option key={dept.departmentId} value={dept.departmentName}>
                      {dept.departmentName}
                    </option>
                  ))}
                <option value="add-department">+ Add Department</option>
              </select>
              {errors.department && (
                <span className="text-red-500 text-xs mt-1 block">{errors.department}</span>
              )}
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Price</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className={`w-full border border-gray-300 rounded p-2 text-right ${
                  errors.price ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
                disabled={isProcessing}
                required
              />
              {errors.price && (
                <span className="text-red-500 text-xs mt-1 block">{errors.price}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddToQueue}
              disabled={isProcessing || !isValid}
              className="bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Queue
            </button>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-green-800">Test Name</th>
                  <th className="text-left py-2 px-2 text-green-800">Department</th>
                  <th className="text-left py-2 px-2 text-green-800">Price</th>
                  <th className="text-left py-2 px-2 text-green-800">Created</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item, index) => (
                  <tr key={item.id || index} className="border-b bg-gray-50">
                    <td className="py-2 px-2">{item.testName}</td>
                    <td className="py-2 px-2">{item.department}</td>
                    <td className="py-2 px-2">{item.price}</td>
                    <td className="py-2 px-2">{item.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => onProcessQueue()}
              disabled={isProcessing || queue.length === 0}
              className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestQueueModal;
