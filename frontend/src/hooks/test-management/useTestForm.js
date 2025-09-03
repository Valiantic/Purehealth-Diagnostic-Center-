import { useState } from 'react';
import { toast } from 'react-toastify';

const useTestForm = () => {
  // Individual state variables for test form
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDepartment, setTestDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('active');
  const [userSelectedDepartment, setUserSelectedDepartment] = useState(false);

  // Reset all form fields to initial values
  const resetForm = () => {
    setTestName('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setTestDepartment('');
    setDepartmentId('');
    setPrice('');
    setStatus('active');
    setUserSelectedDepartment(false);
  };

  // Validate required fields with blank field detection
  const validateForm = () => {
    const errors = [];

    if (!testName.trim()) {
      errors.push('Test name is required');
    }

    if (!departmentId) {
      errors.push('Department is required');
    }

    if (!price || parseFloat(price) <= 0) {
      errors.push('Please enter a valid price');
    }

    if (!testDate.trim()) {
      errors.push('Date created is required');
    } else {
      // Additional validation for future dates - same as useReferrerForm
      const selectedDate = new Date(testDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        errors.push('Date created cannot be in the future');
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      toast.error(errors[0]); // Show first error
      return false;
    }

    return true;
  };

  // Get form data as object
  const getFormData = () => {
    return {
      testName: testName.trim(),
      departmentId,
      price: parseFloat(price),
      dateCreated: testDate,
      status
    };
  };

  // Set form data from object (for editing)
  const setFormData = (data) => {
    setTestName(data.testName || '');
    setTestDate(data.dateCreated ? new Date(data.dateCreated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setTestDepartment(data.departmentName || '');
    setDepartmentId(data.departmentId || '');
    setPrice(data.price ? parseFloat(data.price).toFixed(2) : '');
    setStatus(data.status || 'active');
    setUserSelectedDepartment(true);
  };

  // Handle department change
  const handleDepartmentChange = (value, departments, navigate) => {
    if (value === 'add-department') {
      navigate('/department-management');
      return;
    }
    setTestDepartment(value);
    const selected = departments.find(dep => dep.departmentName === value);
    if (selected) {
      setDepartmentId(selected.departmentId);
      setUserSelectedDepartment(true);
    }
  };

  // Handle price change with validation
  const handlePriceChange = (value) => {
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setPrice(value);
    }
  };

  // Handle date change with future date validation - same as useReferrerForm
  const handleDateChange = (value) => {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      return;
    }
    
    setTestDate(value);
  };

  return {
    // State values
    testName,
    testDate,
    testDepartment,
    departmentId,
    price,
    status,
    userSelectedDepartment,
    
    // State setters
    setTestName,
    setTestDate,
    setTestDepartment,
    setDepartmentId,
    setPrice,
    setStatus,
    setUserSelectedDepartment,
    
    // Utility functions
    resetForm,
    validateForm,
    getFormData,
    setFormData,
    handleDepartmentChange,
    handlePriceChange,
    handleDateChange
  };
};

export default useTestForm;
