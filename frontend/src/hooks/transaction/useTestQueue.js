import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { testAPI } from '../../services/api';

const useTestQueue = () => {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false); // Track if errors should be shown
  const queryClient = useQueryClient();

  // Form state with blank field detection
  const [formData, setFormData] = useState({
    testName: '',
    department: '',
    price: '',
    dateCreated: new Date()
  });

  // Individual field validators with blank field detection
  const validateField = (fieldName, value, isRequired = true) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    
    if (isRequired && (!trimmedValue || trimmedValue === '')) {
      return {
        isValid: false,
        error: `${fieldName} is required`
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  };

  const validatePrice = (price) => {
    const basicValidation = validateField('Price', price);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return {
        isValid: false,
        error: 'Price must be a valid number greater than 0'
      };
    }

    return {
      isValid: true,
      error: null
    };
  };

  // Real-time field validation - only show errors if showValidationErrors is true
  const getFieldError = (fieldName) => {
    if (!showValidationErrors) return null; // Don't show errors until form submission is attempted
    
    switch (fieldName) {
      case 'testName':
        return validateField('Test name', formData.testName).error;
      case 'department':
        return validateField('Department', formData.department).error;
      case 'price':
        return validatePrice(formData.price).error;
      default:
        return null;
    }
  };

  // Check if individual field is valid
  const isFieldValid = (fieldName) => {
    return getFieldError(fieldName) === null;
  };

  // Check if entire form is valid (without showing errors)
  const isFormValid = () => {
    const validations = [
      validateField('Test name', formData.testName),
      validateField('Department', formData.department),
      validatePrice(formData.price)
    ];

    return validations.every(validation => validation.isValid);
  };

  // Validate all required fields and show errors
  const validateForm = () => {
    const validations = [
      validateField('Test name', formData.testName),
      validateField('Department', formData.department),
      validatePrice(formData.price)
    ];

    const errors = validations
      .filter(validation => !validation.isValid)
      .map(validation => validation.error);

    if (errors.length > 0) {
      setShowValidationErrors(true); // Enable error display when validation fails
      toast.error(errors[0]); // Show first error
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      department: '',
      price: '',
      dateCreated: new Date()
    });
    setShowValidationErrors(false); // Reset validation error display when form is reset
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing in a field
    if (showValidationErrors) {
      // Check if the field now has valid content, if so clear the validation flag
      const newFormData = { ...formData, [field]: value };
      const isFieldNowValid = field === 'testName' ? validateField('Test name', value).isValid :
                              field === 'department' ? validateField('Department', value).isValid :
                              field === 'price' ? validatePrice(value).isValid : true;
      
      // If user is actively fixing the form and all fields become valid, clear validation errors
      if (isFieldNowValid) {
        const allFieldsValid = validateField('Test name', newFormData.testName).isValid &&
                               validateField('Department', newFormData.department).isValid &&
                               validatePrice(newFormData.price).isValid;
        
        if (allFieldsValid) {
          setShowValidationErrors(false);
        }
      }
    }
  };

  // Helper function to format date
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const addToQueue = () => {
    if (!validateForm()) {
      return false;
    }

    const newItem = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      testName: formData.testName.trim(),
      department: formData.department.trim(),
      price: typeof formData.price === 'string' ? formData.price : formData.price.toString(),
      created: formatDate(formData.dateCreated),
      dateCreated: formData.dateCreated.toISOString()
    };

    setQueue(prevQueue => [...prevQueue, newItem]);
    resetForm();
    toast.success("Test added to queue successfully");
    return true;
  };

  const removeFromQueue = (itemId) => {
    setQueue(prevQueue => prevQueue.filter(item => item.id !== itemId));
    toast.info("Test removed from queue");
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // FIXED: Sequential processing to ensure all tests are logged in activity log
  const batchCreateMutation = useMutation({
    mutationFn: async ({ queue, departments, userId }) => {
      const results = [];
      
      // Process each test sequentially instead of Promise.all
      // This ensures each test creates its own activity log entry
      for (const item of queue) {
        try {
          const department = departments.find(
            d => d.departmentName.toLowerCase() === item.department.toLowerCase()
          );

          if (!department) {
            throw new Error(`Department not found for: ${item.department}`);
          }

          const testData = {
            testName: item.testName,
            departmentId: department.departmentId,
            price: parseFloat(item.price),
            dateCreated: item.dateCreated, // Use the actual selected date
            currentUserId: userId
          };

          // THIS FIXES THE ACTIVITY LOG BUG - Each test is created individually and sequentially
          const result = await testAPI.createTest(testData, userId);
          results.push({ 
            success: true, 
            testName: item.testName, 
            result,
            index: results.length 
          });
          
        } catch (error) {
          console.error(`Error saving test "${item.testName}":`, error);
          results.push({ 
            success: false, 
            testName: item.testName, 
            error: error.message,
            index: results.length 
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} test${successCount > 1 ? 's' : ''}`);
      }

      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} test${errorCount > 1 ? 's' : ''}`);
        // Log specific errors
        results.filter(r => !r.success).forEach(result => {
          console.error(`Failed to create ${result.testName}: ${result.error}`);
        });
      }

      // Clear queue on success
      if (successCount > 0) {
        clearQueue();
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Batch create error:', error);
      toast.error('Failed to process test queue');
    }
  });

  const processQueue = (departments, userId) => {
    if (queue.length === 0) {
      toast.error("No tests in queue to save");
      return;
    }

    if (!userId) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setIsProcessing(true);
    batchCreateMutation.mutate(
      { queue, departments, userId },
      {
        onSettled: () => {
          setIsProcessing(false);
        }
      }
    );
  };

  return {
    // State
    queue,
    formData,
    isProcessing: isProcessing || batchCreateMutation.isPending,
    
    // Actions
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    updateFormField,
    resetForm,
    
    // Validation functions with blank field detection
    getFieldError,
    isFieldValid,
    isFormValid,
    validateForm,
    
    // Computed values
    queueCount: queue.length,
    isEmpty: queue.length === 0,
    
    // Computed validation state
    errors: {
      testName: getFieldError('testName'),
      department: getFieldError('department'),
      price: getFieldError('price')
    },
    isValid: isFormValid()
  };
};

export default useTestQueue;
