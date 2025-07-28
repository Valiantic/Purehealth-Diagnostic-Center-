import React from 'react';
import { X } from 'lucide-react';

const ReferrerModal = ({
  isOpen,
  onClose,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  birthday,
  setBirthday,
  sex,
  setSex,
  clinicName,
  setClinicName,
  clinicAddress,
  setClinicAddress,
  contactNo,
  setContactNo,
  onConfirm,
  isLoading = false,
  title = "New Referrer",
  mode = "add", 
  selectedReferrer = null,
  handleStatusChange = null
}) => {
  if (!isOpen) return null;

  // Handle contact number input - only allow numbers
  const handleContactChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9\s\-\(\)\+]/g, '');
    setContactNo(numericValue);
  };

  // Handle birthday change with future date validation
  const handleBirthdayChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      return;
    }
    
    setBirthday(e.target.value);
  };

  // Handle numeric keydown for contact field
  const handleContactKeyDown = (e) => {
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white w-full max-w-md rounded shadow-lg">
        <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-xl font-medium">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-green-800 font-medium mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                required
                disabled={isLoading}
              />
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-green-800 font-medium mb-1">Birthday</label>
              <div className="relative">
                <input
                  id={`${mode}-referrer-date`}
                  type="date"
                  value={birthday}
                  onChange={handleBirthdayChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-600"
                  disabled={isLoading}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-green-800 font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                required
                disabled={isLoading}
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-green-800 font-medium mb-1">Sex</label>
              <div className="relative">
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 appearance-none"
                  disabled={isLoading}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Clinic Name */}
            <div>
              <label className="block text-green-800 font-medium mb-1">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                disabled={isLoading}
              />
            </div>

            {/* Contact No. - Numbers Only */}
            <div>
              <label className="block text-green-800 font-medium mb-1">Contact No.</label>
              <input
                type="tel"
                value={contactNo}
                onChange={handleContactChange}
                onKeyDown={handleContactKeyDown}
                className="w-full border border-gray-300 rounded p-2"
                required
                disabled={isLoading}
              />
            </div>

            {/* Clinic Address - Full Width */}
            <div className="col-span-2">
              <label className="block text-green-800 font-medium mb-1">Clinic Address</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                required
                disabled={isLoading}
              />
            </div>

            {/* Status Dropdown - Only show in edit mode */}
            {mode === "edit" && selectedReferrer && (
              <div className="col-span-2">
                <label className="block text-green-800 font-medium mb-1">Status</label>
                <div className="relative">
                  <select
                    value={selectedReferrer.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}
                    onChange={handleStatusChange}
                    className="w-full border border-gray-300 rounded p-2 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="active">Unarchived</option>
                    <option value="inactive">Archived</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-4"></div>

          {/* Confirm Button */}
          <div className="flex justify-center">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (mode === "edit" ? 'Save Changes' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferrerModal;