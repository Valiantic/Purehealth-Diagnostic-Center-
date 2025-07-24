import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../../utils/webauthn';
import { Shield } from 'lucide-react';
import MicroscopeBg from '../../assets/images/LoginCover.jpg';
import PHDCILogo from '../../assets/icons/purehealth_logo.png';
import AuthModal from './AuthModal';

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const validateUsername = () => {
    if (!username) {
      setError('Username is required');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateUsername()) return;
    
    setLoading(true);
    setError('');
    setShowAuthModal(true);
    
    try {
      const result = await authenticateUser(username);
      
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setShowAuthModal(false);
        navigate('/dashboard');
      } else {
        setShowAuthModal(false);
        setError(result.message || 'Authentication failed');
      }
    } catch (error) {
      setShowAuthModal(false);
      setError('Authentication failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 w-full max-w-full overflow-hidden">
    {/* Login Cover - Mobile */}
    <div className="md:hidden h-20 bg-cover bg-center relative w-screen" style={{
      backgroundImage: `url(${MicroscopeBg})`,
      maxWidth: '100%'
    }}>
      <div className="absolute inset-0 bg-black bg-opacity-40">
        <div className="h-full flex flex-col justify-between p-2">
          <div className="flex items-center gap-1">
            <img 
              src={PHDCILogo}
              alt="PHDCI Logo" 
              className="w-5 h-5"
            />
            <span className="text-white text-[10px] font-bold">Purehealth Diagnostic Center</span>
          </div>
        </div>
      </div>
    </div>

    {/* Login Cover - Desktop */}
    <div className="hidden md:block md:w-1/2 bg-cover bg-center relative" style={{
      backgroundImage: `url(${MicroscopeBg})`
    }}>
      <div className="absolute inset-0 bg-black bg-opacity-40">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <img 
              src={PHDCILogo}
              alt="PHDCI Logo" 
              className="w-14 h-14"
            />
            <span className="text-white text-3xl font-bold">Purehealth Diagnostic Center</span>
          </div>
        </div>
      </div>
    </div>

    {/* Login Form Container */}
    <div className="w-full md:w-1/2 flex items-center justify-center p-1 md:p-8 min-h-[auto] md:min-h-screen">
      <div className="w-full max-w-[200px] xs:max-w-[260px] sm:max-w-[340px] md:max-w-[400px] mx-auto flex flex-col items-center px-1 xs:px-3 sm:px-4 md:px-6 py-2 md:py-10">
        {/* Logo */}
        <img 
          src={PHDCILogo}
          alt="PHDCI Logo" 
          className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 mb-2 md:mb-8"
        />

        {/* Welcome Text */}
        <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-green-800 mb-0.5 sm:mb-2 md:mb-4 text-center">
          Welcome Back!
        </h1>
        <p className="text-[10px] sm:text-base md:text-lg mb-2 sm:mb-6 md:mb-10 text-center">
          Please enter your login credential below.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-2 sm:space-y-4 md:space-y-6">
          {/* Username Input */}
          <div>
            <input
              className="w-full px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 text-[10px] sm:text-sm md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500 placeholder:text-[10px] sm:placeholder:text-sm"
              id="username"
              type="text"
              placeholder="Enter your email"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-[8px] sm:text-sm md:text-base text-center">{error}</div>
          )}
          
          {/* Login Button */}
          <button
            className="w-full bg-green-800 hover:bg-green-900 text-white text-[10px] sm:text-sm md:text-lg font-semibold py-1.5 sm:py-2.5 md:py-4 rounded-lg transition duration-200 ease-in-out flex items-center justify-center"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1.5 md:gap-3 mt-2 sm:mt-4 md:mt-8">
            <Shield className="w-2 h-2 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-800"/>
            <span className="text-[8px] sm:text-xs md:text-base text-green-800 underline">
              Secure Login with FIDO2 WebAuthn
            </span>
          </div>
        </form>
      </div>
    </div>
  </div>

  <AuthModal
  isOpen={showAuthModal}
  onClose={() => setShowAuthModal(false)}
  />
    </>
  );
};

export default LoginForm;
