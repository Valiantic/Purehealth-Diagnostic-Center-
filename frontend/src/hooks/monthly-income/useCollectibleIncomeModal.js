import { useState, useEffect } from 'react';

const useCollectibleIncomeModal = ({
  isOpen = false,
  onClose = () => { },
  onSubmit = () => { },
  onUpdate = () => { },
  userId = null,
  mode = 'add',
  initialData = null
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    coordinatorName: '',
    totalIncome: '0',
    date: new Date().toISOString().split('T')[0],
    items: [] // Array of { testName: '', unitPrice: 0, quantity: 1 }
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
        totalIncome: initialData.totalIncome || '0',
        date: dateValue,
        items: initialData.items || []
      });
    } else if (mode === 'add' || !isOpen) {
      resetForm();
    }
  }, [mode, initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      coordinatorName: '',
      totalIncome: '0',
      date: new Date().toISOString().split('T')[0],
      items: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Item handler functions
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { testName: '', unitPrice: '', quantity: 1 }]
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);

    // Recalculate total
    const newTotal = calculateTotal(newItems);

    setFormData(prev => ({
      ...prev,
      items: newItems,
      totalIncome: newTotal.toFixed(2)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total if price or quantity changes
    const newTotal = calculateTotal(newItems);

    setFormData(prev => ({
      ...prev,
      items: newItems,
      totalIncome: newTotal.toFixed(2)
    }));
  };

  // Update multiple fields at once to avoid React batching issues
  const handleItemMultiChange = (index, updates) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], ...updates };

    // Recalculate total
    const newTotal = calculateTotal(newItems);

    setFormData(prev => ({
      ...prev,
      items: newItems,
      totalIncome: newTotal.toFixed(2)
    }));
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
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
      newErrors.companyName = 'Client name/Organization is required';
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

    // Validate items if any are present (optional, but good practice if items are meant to drive total)
    /*
    if (formData.items.length > 0) {
       formData.items.forEach((item, index) => {
         if (!item.testName) newErrors[`item_${index}_testName`] = 'Required';
         if (!item.unitPrice) newErrors[`item_${index}_unitPrice`] = 'Required';
       });
    }
    */

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

    // Simplistic check for items changes - deep comparison ideal but simple length/content check often sufficient
    const itemsChanged = JSON.stringify(formData.items) !== JSON.stringify(initialData.items || []);

    return (
      formData.companyName !== (initialData.companyName || '') ||
      formData.coordinatorName !== (initialData.coordinatorName || '') ||
      formData.totalIncome !== (initialData.totalIncome || '') ||
      formData.date !== originalDateValue ||
      itemsChanged
    );
  };

  return {
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
    resetForm,

    validateForm,
    getModalTitle,
    getButtonText,
    hasChanges
  };
};

export default useCollectibleIncomeModal;
