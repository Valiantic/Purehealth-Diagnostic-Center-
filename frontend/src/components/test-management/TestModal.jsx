import React from 'react';
import { X } from 'lucide-react';

const TestModal = ({
  isOpen,
  onClose,
  testName,
  setTestName,
  testDate,
  handleDateChange,
  testDepartment,
  handleDepartmentChange,
  price,
  handlePriceChange,
  status,
  setStatus,
  departments = [],
  onConfirm,
  isLoading = false,
  title = "New Test",
  mode = "add", 
  isDepartmentArchived = false,
  navigate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start pt-20 justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full max-w-md rounded shadow-lg">
        <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-green-800 font-medium mb-1">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="Enter test name"
                required
              />
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Date Created</label>
              <div className="relative">
                <input
                  id={`${mode}-test-date`}
                  type="date"
                  value={testDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-600"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Test Department</label>
              <div className="relative">
                <select
                  value={testDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value, departments, navigate)}
                  className="w-full border border-gray-300 rounded p-2 appearance-none"
                  required
                >
                  {mode === "add" ? (
                    <>
                      {Array.isArray(departments) ? departments
                        .filter(dept => dept.status === 'active') 
                        .map(dept => (
                        <option key={dept.departmentId} value={dept.departmentName}>{dept.departmentName}</option>
                      )) : <option value="">No departments available</option>}
                      <option value="add-department">+ Add Department</option>
                    </>
                  ) : (
                    // Edit mode - show all departments
                    departments.map(dept => (
                      <option key={dept.departmentId} value={dept.departmentName}>{dept.departmentName}</option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-green-800 font-medium mb-1">Price</label>
              <input
                type="text"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-right"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          {mode === "edit" && (
            <div className="mt-4">
              <label className="block text-green-800 font-medium mb-1">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full border border-gray-300 rounded p-2 appearance-none ${isDepartmentArchived ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  disabled={isDepartmentArchived}
                >
                  <option value="active">Unarchived</option>
                  <option value="inactive">Archived</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              {isDepartmentArchived && (
                <div className="mt-1 text-xs text-red-600">
                  Note: Status cannot be changed because this test's department is archived.
                </div>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-300 my-4"></div>
          <div className="flex justify-center">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700"
            >
              {isLoading ? (mode === "add" ? 'Creating...' : 'Saving...') : (mode === "add" ? 'Confirm' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestModal;
