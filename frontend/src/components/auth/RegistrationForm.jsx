import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, registerBackupPasskey } from '../../utils/webauthn';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'receptionist' // Default role
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
          lastName: formData.lastName,
          role: formData.role
        });
        
        setStep(2);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check for various WebAuthn cancellation errors
      if (
        error.name === 'AbortError' || 
        error.message?.includes('The operation either timed out or was not allowed') ||
        error.message?.includes('The user attempted to register') ||
        error.message?.includes('user canceled') ||
        error.message?.includes('The operation was aborted')
      ) {
        setError('Passkey registration was canceled. Your account has not been created.');
      } else {
        setError(`Registration failed: ${error.message || 'Unknown error'}`);
      }
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
        
        // Redirect to view-accounts instead of dashboard
        navigate('/view-accounts', { 
          state: { 
            success: true, 
            message: 'Account successfully created!'
          }
        });
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
    
    // Redirect to view-accounts instead of dashboard
    navigate('/view-accounts', { 
      state: { 
        success: true, 
        message: 'Account successfully created!'
      }
    });
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center w-full">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto mt-10">
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div className='text-center mb-6'>
              <h3 className="text-xl font-bold text-green-700 text-4xl">Create an Account</h3>
              <h6 className="text-green-700 mt-4 text-sm">NOTE: This is for Development Stage Account Creation!</h6>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                 className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-1 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500 placeholder:text-[10px] sm:placeholder:text-sm"
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
                 className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-1 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500 placeholder:text-[10px] sm:placeholder:text-sm"
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
                Middle Name
              </label>
              <input
                 className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-1 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500 placeholder:text-[10px] sm:placeholder:text-sm"
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
                  className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-1 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500 placeholder:text-[10px] sm:placeholder:text-sm"
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Role
              </label>
              <select
                className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-1 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex items-center justify-center mb-4">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
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
                  className="text-green-500 hover:text-green-700 focus:outline-none"
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
            <h3 className="text-xl font-bold text-green-700 text-4xl">Set Up Backup Passkey</h3>
            <p className="mb-6 mt-5 text-green-700 mt-4 text-sm">Would you like to set up a backup security key?</p>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex flex-col space-y-4">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleBackupRegistration}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Set up Backup Passkey'}
              </button>
              
              <button
                className="text-green-500 hover:text-green-700 focus:outline-none"
                onClick={skipBackupRegistration}
                disabled={loading}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;