import React, { useState } from 'react'
import { useNavigate  } from 'react-router-dom'
import { registerUser, registerBackupPasskey } from '../utils/webauthn'
import { Shield, X } from 'lucide-react'
import BackupKeyImg from '../assets/images/BackupKeyPic.png'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'
import FIDO2BG from '../assets/images/FIDO2BG.png'
import tabsConfig from '../config/tabsConfig'

const AddAccount = () => {
  const { user, isAuthenticating } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState(null)
  const [userData, setUserData] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'receptionist' // Default role
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
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
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
        
    setLoading(true);
    setError('');
        
    try {
      const result = await registerUser(formData);
      
      if (result.success) {
        setUserId(result.userId);
        
        setUserData({
          userId: result.userId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role // Include role in userData
        });
        
        setStep(2);
        setShowModal(true);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
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
       
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
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
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  
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
  
  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Account';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
     
      <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
          <TabNavigation tabsConfig={tabsConfig} />
          
          {activeTab === 'Account' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                <div className="bg-white rounded-lg border border-green-800">
                  <div className="bg-green-800 text-white p-3">
                    <h2 className="text-lg font-medium">Create New Account</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Email Address</label>
                      <input 
                        type="email"
                        name="email" 
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        readOnly={step === 2}
                      />
                    </div>
    
                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        readOnly={step === 2}
                      />
                    </div>
    
                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Middle Name</label>
                      <input 
                        type="text" 
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        readOnly={step === 2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        readOnly={step === 2}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        disabled={step === 2}
                      >
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    {error && step === 1 && (
                      <div className="text-red-500 text-sm mt-2">{error}</div>
                    )}

                    <div className="pt-2">
                      {step === 1 && (
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="w-full py-2 px-4 bg-green-800 hover:bg-green-700 text-white font-medium rounded-md transition"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      )}
                      {step === 2 && (
                        <div className="py-2 px-4 bg-gray-100 text-center text-gray-500 rounded-md">
                          Account created successfully!
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="flex flex-col space-y-4 mt-8 sm:mt-4 md:mt-0">
                  <div className="flex justify-center items-center space-x-2 text-center">
                    <div className="flex-shrink-0">
                        <Shield className="w-6 h-6 text-green-800" />
                    </div>
                    <span className="font-medium text-green-800 underline text-sm md:text-base">Create Account using FIDO2 WebAuthn</span>
                  </div>
                  
                  <div className="border border-green-800 rounded-lg p-4 flex justify-center items-center bg-white mt-2">
                    <div className="relative w-64 h-48 mt-3">
                      <div className="absolute right-0 top-10">
                        <div className="bg-green-800 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>
                        </div>
                      </div>
                      <img 
                        src={FIDO2BG}
                        alt="FIDO2 WebAuthn illustration" 
                        className="object-contain mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {step === 2 && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full relative">
            

            <div className="bg-green-800 rounded-t-lg text-white p-4 text-center relative">
              <h3 className="text-2xl font-bold text-white">Set Up Backup Passkey</h3>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className='p-6'>
              <div className='flex flex-col items-center mb-6'>
                <div className='mb-6'>
                  <img
                    src={BackupKeyImg}
                    alt="Backup Key"
                    className="w-48 h-auto"
                  />
                </div>
                <p className="text-green-800 text-sm md:text-base mb-2">Would you like to set up a backup security key?</p>
              </div>

              <div className='space-y-3'>
                {error && (
                  <div className="mb-4 text-red-500 text-sm">{error}</div>
                )}

                <button
                  className="w-full bg-green-800 hover:bg-green-700 text-white py-3 px-4 rounded flex items-center justify-center"
                  onClick={handleBackupRegistration}
                  disabled={loading}
                >
                  <Shield className="mr-2" size={18} />
                  {loading ? 'Setting up...' : 'Set up Backup Passkey'}
                </button>
                 
                <button 
                  className="w-full bg-gray-100 hover:bg-gray-200 text-green-800 py-3 px-4 rounded"
                  onClick={skipBackupRegistration}
                  disabled={loading}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddAccount
