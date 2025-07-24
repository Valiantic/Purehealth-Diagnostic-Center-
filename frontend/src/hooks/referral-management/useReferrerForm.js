import { useState } from 'react';
import { toast } from 'react-toastify';

const useReferrerForm = () => {
  // Individual state variables for referrer form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('Male');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [contactNo, setContactNo] = useState('');

  // Reset all form fields to initial values
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setBirthday('');
    setSex('Male');
    setClinicName('');
    setClinicAddress('');
    setContactNo('');
  };

  // Validate required fields with blank field detection
  const validateForm = () => {
    const errors = [];

    if (!firstName.trim()) {
      errors.push('First name is required');
    }

    if (!lastName.trim()) {
      errors.push('Last name is required');
    }

    if (!birthday.trim()) {
      errors.push('Birthday is required');
    } else {
      const selectedDate = new Date(birthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        errors.push('Birthday cannot be in the future');
      }
    }

    if (!contactNo.trim()) {
      errors.push('Contact No. is required');
    }

    if (!clinicAddress.trim()) {
      errors.push('Clinic Address is required');
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
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: birthday.trim(),
      sex,
      clinicName: clinicName.trim(),
      clinicAddress: clinicAddress.trim(),
      contactNo: contactNo.trim()
    };
  };

  // Set form data from object (for editing)
  const setFormData = (data) => {
    setFirstName(data.firstName || '');
    setLastName(data.lastName || '');
    setBirthday(data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '');
    setSex(data.sex || 'Male');
    setClinicName(data.clinicName || '');
    setClinicAddress(data.clinicAddress || '');
    setContactNo(data.contactNo || '');
  };

  return {
    // State values
    firstName,
    lastName,
    birthday,
    sex,
    clinicName,
    clinicAddress,
    contactNo,
    
    // State setters
    setFirstName,
    setLastName,
    setBirthday,
    setSex,
    setClinicName,
    setClinicAddress,
    setContactNo,
    
    // Utility functions
    resetForm,
    validateForm,
    getFormData,
    setFormData
  };
};

export default useReferrerForm;
