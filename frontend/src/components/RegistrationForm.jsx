import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, registerBackupPasskey } from '../utils/webauthn';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Email, first name, and last name are required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await registerUser(formData);
      
      if (result.success) {
        setUserId(result.userId);
        
        // Save user data for later use
        setUserData({
          userId: result.userId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        
        setStep(2);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred during registration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupRegistration = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await registerBackupPasskey(userId);
      
      if (result.success) {
        // Store user data in localStorage
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred during backup passkey registration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const skipBackupRegistration = () => {
    // Store user data in localStorage even if skipping backup
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Redirect to dashboard
    navigate('/dashboard');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="middleName">
              Middle Name (optional)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="middleName"
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}
          
          <div className="flex items-center justify-center mb-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Create Account with FIDO2 WebAuthn'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm">
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
                onClick={goToLogin}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      )}
      
      {step === 2 && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Set Up Backup Passkey</h3>
          <p className="mb-6">Would you like to set up a backup security key?</p>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}
          
          <div className="flex flex-col space-y-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleBackupRegistration}
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Set up Backup Passkey'}
            </button>
            
            <button
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
              onClick={skipBackupRegistration}
              disabled={loading}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm; 