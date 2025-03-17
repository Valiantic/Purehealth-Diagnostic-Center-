import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../utils/webauthn';

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Start WebAuthn authentication directly
      const result = await authenticateUser(email);
      
      if (result.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleContinue}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
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
            {loading ? 'Authenticating...' : 'Sign In with Passkey'}
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-sm">
            Don't have an account?{' '}
            <button
              type="button"
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
              onClick={goToRegister}
            >
              Create one
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
