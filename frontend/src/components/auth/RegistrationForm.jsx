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
        
        // Redirect based on role: receptionist -> dashboard, admin -> view-accounts
        const redirectPath = userData?.role === 'receptionist' ? '/dashboard' : '/view-accounts';
        navigate(redirectPath, { 
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
              <h6 className="text-green-700 mt-4 text-sm">"Welcome! You are now creating an account as an <strong>IT Expert</strong>. Please note that our Revenue Management System employs FIDO2 WebAuthn for security purposes. This ensures robust protection of financial data, 
                which is critical to the integrity of our capstone study."</h6>
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
            <p className="mb-4 mt-5 text-green-700 text-sm font-semibold">Secure your account with a backup security key</p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> A backup passkey is essential for account recovery. Without it, you may lose access to your account if your primary device is lost or damaged. This step is highly recommended for account security.
                  </p>
                </div>
              </div>
            </div>
            
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;