import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/profits.png'
import Expense from '../assets/icons/expense.png'

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

       <div className="bg-[#02542D] p-6 rounded-lg shadow-md flex justify-around items-center space-x-8">

  {/* Total Income */}
  <div className="flex flex-col items-start">
    <h2 className="font-bold mb-4 text-white sm:text-xs md:text-3xl">Total Income</h2>

    <div className="flex items-center gap-4">
      <img src={Income} className="w-12 h-12" alt="Income Icon" />
      <h1 className="text-white font-bold sm:text-xs md:text-4xl">₱ 25,000</h1>
    </div>
  </div>

  {/* Total Expenses */}
  <div className="flex flex-col items-start">
    <h2 className="font-bold mb-4 text-white sm:text-xs md:text-3xl">Total Expenses</h2>

    <div className="flex items-center gap-4">
      <img src={Expense} className="w-12 h-12" alt="Expense Icon" />
      <h1 className="text-white font-bold sm:text-xs md:text-4xl">₱ 4,000</h1>
    </div>
  </div>

</div>

      
      </div>
    </div>
  );
};

export default Dashboard;