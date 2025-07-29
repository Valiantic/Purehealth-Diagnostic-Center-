import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddCollectibleIncomeModal = ({ isOpen, onClose, onSubmit, userId }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    coordinatorName: '',
    totalIncome: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  

  const handleCreateCollectibles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    handleSubmit();
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault(); 
      e.stopPropagation(); 
    }
    
    if (!formData.companyName || !formData.coordinatorName || !formData.totalIncome || !formData.date) {
      return; 
    }
    
    onSubmit({
      ...formData,
      currentUserId: userId 
    });

    setFormData({
      companyName: '',
      coordinatorName: '',
      totalIncome: '',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      coordinatorName: '',
      totalIncome: '',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-green-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Collectible Income</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-green-700 font-medium mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Company Name"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none transition-colors"
              required
            />
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
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Total Income and Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalIncome" className="block text-green-700 font-medium mb-2">
                Total Income
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="totalIncome"
                name="totalIncome"
                value={formData.totalIncome}
                onChange={handleInputChange}
                placeholder="0.00"
                className="no-spinner w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none transition-colors"
                required
              />
              <style>{`
                /* Remove spinner buttons from number inputs */
                .no-spinner {
                  -moz-appearance: textfield;
                }
                .no-spinner::-webkit-outer-spin-button,
                .no-spinner::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
              `}</style>
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
              className='w-full border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none transition-colors px-3 py-2'
              placeholder='YYYY-MM-DD'
              />
              </div>
            </div>
          </div>
          
          <div style={{ height: '1px', margin: '10px 0', clear: 'both' }}></div>

          <div className="pt-4">
            <button
              type="button" 
              onClick={handleCreateCollectibles}
              className="w-full bg-green-800 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCollectibleIncomeModal;