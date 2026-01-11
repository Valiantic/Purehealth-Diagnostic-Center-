import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import useCollectibleIncomeModal from '../../hooks/monthly-income/useCollectibleIncomeModal';
import { testAPI } from '../../services/api';

const CollectibleIncomeModal = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  mode = 'add',
  initialData = null,
  onUpdate = null
}) => {
  const {
    formData,
    isSubmitting,
    errors,
    handleInputChange,
    handleDateChange,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleItemMultiChange,
    handleSubmit,
    handleClose,
    getModalTitle,
    getButtonText
  } = useCollectibleIncomeModal({
    isOpen,
    onClose,
    onSubmit,
    onUpdate,
    userId,
    mode,
    initialData
  });

  const [availableTests, setAvailableTests] = useState([]);

  // Fetch tests when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchTests = async () => {
        try {
          const response = await testAPI.getAllTests();

          // Handle the response - it's directly an array, not wrapped in success/tests
          let tests = [];
          if (Array.isArray(response.data)) {
            tests = response.data;
          } else if (response.data && response.data.success && response.data.tests) {
            tests = response.data.tests;
          }

          // Filter for active tests only
          const activeTests = tests.filter(test => test.status === 'active');
          setAvailableTests(activeTests);
        } catch (error) {
          console.error("Failed to fetch tests:", error);
        }
      };

      fetchTests();
    }
  }, [isOpen]);


  const handleCreateCollectibles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    handleSubmit(e);
  };

  // Helper to find test price
  const handleTestSelection = (index, testName) => {

    // Find the test to get its price
    const test = availableTests.find(t => t.testName === testName);

    // Update both testName and unitPrice in a single state update
    handleItemMultiChange(index, {
      testName: testName,
      unitPrice: test ? test.price : ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-auto shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-green-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-semibold">{getModalTitle()}</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Client Name/Organization */}
          <div>
            <label htmlFor="companyName" className="block text-green-700 font-medium mb-2">
              Client Name/Organization
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Client Name/Organization"
              className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition-colors ${errors.companyName
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-green-500'
                }`}
              required
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
            )}
          </div>

          {/* Coordinator Name */}
          <div>
            <label htmlFor="coordinatorName" className="block text-green-700 font-medium mb-2">
              Coordinator Name
            </label>
            <input
              type="text"
              id="coordinatorName"
              name="coordinatorName"
              value={formData.coordinatorName}
              onChange={handleInputChange}
              placeholder="Coordinator Name"
              className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition-colors ${errors.coordinatorName
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-green-500'
                }`}
              required
            />
            {errors.coordinatorName && (
              <p className="text-red-500 text-sm mt-1">{errors.coordinatorName}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-green-700 font-medium mb-2">
              Date
            </label>
            <div
              onClick={e => e.stopPropagation()}
              className="relative"
            >
              <input
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border-2 rounded-md focus:outline-none transition-colors px-3 py-2 ${errors.date
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-green-500'
                  }`}
                placeholder='YYYY-MM-DD'
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Dynamic Items List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-green-700 font-medium">Tests/Services</label>
            </div>

            <div className="space-y-3 mb-3">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 px-1">
                <div className="col-span-6">Test/Service</div>
                <div className="col-span-3">Unit Price</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-1"></div>
              </div>

              {formData.items && formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  {/* Test Selection */}
                  <div className="col-span-6">
                    <select
                      value={item.testName || ""}
                      onChange={(e) => {
                        handleTestSelection(index, e.target.value);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="">Select Test</option>
                      {(() => {
                        return availableTests.map((test) => (
                          <option key={test.testId} value={test.testName}>
                            {test.testName}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex justify-center pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center text-sm font-medium text-green-700 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-md border border-green-200 transition-colors"
            >
              <Plus size={16} className="mr-1" />
              Add Test
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Total Income Read-only */}
          <div>
            <label className="block text-green-700 font-medium mb-1">
              Total Income
            </label>
            <div className="text-2xl font-bold text-gray-800">
              ₱{parseFloat(formData.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <input type="hidden" name="totalIncome" value={formData.totalIncome} />

            {errors.totalIncome && (
              <p className="text-red-500 text-sm mt-1">{errors.totalIncome}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleCreateCollectibles}
              disabled={isSubmitting}
              className="w-full bg-green-800 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : getButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectibleIncomeModal;