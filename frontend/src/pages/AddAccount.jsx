import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TabNavigation from '../components/TabNavigation'
import useAuth from '../hooks/useAuth'
import FIDO2BG from '../assets/images/FIDO2BG.png'
import tabsConfig from '../config/tabsConfig'

const AddAccount = () => {
  const { user, isAuthenticating } = useAuth()
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
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
          {/* Use the TabNavigation component */}
          <TabNavigation tabsConfig={tabsConfig} />
          
          {/* Content based on active tab */}
          {activeTab === 'Account' && (
            <>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                {/* Create Account Form - left side */}
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
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Middle Name</label>
                      <input 
                        type="text" 
                        name="middleName"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    
                    
                    <div className="space-y-2">
                      <label className="block font-medium text-green-800">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    
                    
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        className="w-full py-2 px-4 bg-green-800 hover:bg-green-700 text-white font-medium rounded-md transition"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* FIDO2 Option - right side */}
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
    </div>
  )
}

export default AddAccount
