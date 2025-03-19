import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h2>
          <p className="mb-4">You have successfully authenticated with WebAuthn passkey.</p>
          
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
            <ul className="space-y-2">
              <li><strong>Name:</strong> {user.firstName} {user.lastName}</li>
              <li><strong>Email:</strong> {user.email}</li>
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <p className="mb-2 text-gray-600">Security Information:</p>
            <p className="text-sm text-gray-500">You are using FIDO2 WebAuthn authentication with passkeys for enhanced security.</p>
          </div>
        </div>
  
      </div>
    </div>
  );
};

export default Dashboard;