import { useState, useEffect } from 'react';

const useCollectibleIncomeModal = ({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  onUpdate = () => {},
  userId = null,
  mode = 'add',
  initialData = null
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    coordinatorName: '',
    totalIncome: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && initialData && isOpen) {
      let dateValue = new Date().toISOString().split('T')[0];
      if (initialData.dateConducted) {
        dateValue = new Date(initialData.dateConducted).toISOString().split('T')[0];
      } else if (initialData.date) {
        dateValue = new Date(initialData.date).toISOString().split('T')[0];
      } else if (initialData.createdAt) {
        dateValue = new Date(initialData.createdAt).toISOString().split('T')[0];
      }

      setFormData({
        companyName: initialData.companyName || '',
        coordinatorName: initialData.coordinatorName || '',
        totalIncome: initialData.totalIncome || '',
        date: dateValue
      });
    } else if (mode === 'add' || !isOpen) {
      resetForm();
    }
  }, [mode, initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      coordinatorName: '',
      totalIncome: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

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

  const validateForm = () => {
    const newErrors = {};
    const { companyName, coordinatorName, totalIncome, date } = formData;
    
    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!coordinatorName.trim()) {
      newErrors.coordinatorName = 'Coordinator name is required';
    }
    
    if (!totalIncome || parseFloat(totalIncome) <= 0) {
      newErrors.totalIncome = 'Total income must be greater than 0';
    }
    
    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        currentUserId: userId
      };

      if (mode === 'edit' && onUpdate && initialData) {
        await onUpdate(submitData);
      } else if (mode === 'add' && onSubmit) {
        await onSubmit(submitData);
      }

      resetForm();
      onClose();
      return true;

    } catch (error) {
      console.error('Error submitting form:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setErrors({});
    onClose();
  };

  const getModalTitle = () => {
    return mode === 'edit' ? 'Edit Collectible Income' : 'Add Collectible Income';
  };

  const getButtonText = () => {
    if (isSubmitting) {
      return mode === 'edit' ? 'Updating...' : 'Adding...';
    }
    return mode === 'edit' ? 'Update' : 'Confirm';
  };

  const hasChanges = () => {
    if (mode === 'add' || !initialData) return true;
    
    let originalDateValue = new Date().toISOString().split('T')[0];
    if (initialData.dateConducted) {
      originalDateValue = new Date(initialData.dateConducted).toISOString().split('T')[0];
    } else if (initialData.date) {
      originalDateValue = new Date(initialData.date).toISOString().split('T')[0];
    } else if (initialData.createdAt) {
      originalDateValue = new Date(initialData.createdAt).toISOString().split('T')[0];
    }
    
    return (
      formData.companyName !== (initialData.companyName || '') ||
      formData.coordinatorName !== (initialData.coordinatorName || '') ||
      formData.totalIncome !== (initialData.totalIncome || '') ||
      formData.date !== originalDateValue
    );
  };

  return {
    formData,
    isSubmitting,
    errors,
    
    handleInputChange,
    handleDateChange,
    handleSubmit,
    handleClose,
    resetForm,
    
    validateForm,
    getModalTitle,
    getButtonText,
    hasChanges
  };
};

export default useCollectibleIncomeModal;
