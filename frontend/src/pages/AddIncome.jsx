import React, { useState, useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'

const AddIncome = () => {
  const { user, isAuthenticating } = useAuth()

  const [formData, setFormData] = useState({
    firstName: 'Juan Ponce',
    lastName: 'Enrile',
    birthDate: '24-Mar-2024',
    id: 'Person with Disability',
    referrer: 'Dr. Kepweng',
    sex: 'Male'
  });

  const [searchTest, setSearchTest] = useState('');
  const [selectedTests, setSelectedTests] = useState(Array(15).fill('Urinalysis'));
  const [testsTable, setTestsTable] = useState(Array(15).fill({
    name: 'Urinalysis',
    disc: '20%',
    cash: '250.0',
    gCash: '250.0',
    bal: '250.0'
  }));

 
  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen p-4">
    <Sidebar/>
    
    {/* Main content */}
    <div className="flex flex-col lg:flex-row gap-4">
      
      {/* Left side - already built sidebar placeholder */}
      <div className="hidden lg:block w-64">
        {/* Sidebar is already built according to requirements */}
      </div>
      
      {/* Right side - transaction form */}
      <div className="flex-1">
        {/* Patient Information Card */}
        <div className="bg-cream-50 border-2 border-green-800 rounded-lg overflow-hidden mb-4">
          <div className="bg-green-800 text-white p-3">
            <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Add Transaction</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-green-800 font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                />
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                />
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">ID</label>
                <select
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Person with Disability</option>
                  <option>Senior Citizen</option>
                  <option>Regular</option>
                </select>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Referrer</label>
                <select
                  value={formData.referrer}
                  onChange={(e) => setFormData({...formData, referrer: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Dr. Kepweng</option>
                  <option>Dr. Santos</option>
                  <option>Dr. Reyes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Birth Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full border-2 border-green-800 rounded p-2"
                    />
                  <span className="absolute right-2 top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-1">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value})}
                  className="w-full border-2 border-green-800 rounded p-2"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Two column layout for Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Add Test Column */}
          <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
            <div className="bg-green-800 text-white p-3">
              <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Add Test</h2>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Electrocardiogram"
                  value={searchTest}
                  onChange={(e) => setSearchTest(e.target.value)}
                  className="w-full border rounded p-2 pl-3 pr-10"
                />

                <span className="absolute right-10 top-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <span className="absolute right-3 top-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </span>

              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {selectedTests.map((test, index) => (
                  <div key={index} className="flex items-center bg-green-100 border border-green-300 rounded-lg p-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-800 text-white text-xs mr-1">✓</span>
                    <span className="flex-1 text-green-800">{test}</span>
                    <button className="text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Tests Conducted Column */}
          <div className="bg-white border-2 border-green-800 rounded-lg overflow-hidden">
            <div className="bg-green-800 text-white p-3">
              <h2 className="text-lg font-semibold pl-12 sm:pl-4 md:pl-0">Tests Conducted</h2>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="bg-green-100 text-left border-b py-2 px-4 text-green-800">
                      <th className="px-2 py-1 text-sm">Name</th>
                      <th className="px-2 py-1 text-sm">Disc.</th>
                      <th className="px-2 py-1 text-sm">Cash</th>
                      <th className="px-2 py-1 text-sm">GCash</th>
                      <th className="px-2 py-1 text-sm">Bal.</th>
                      <th className="px-2 py-1 text-sm">Opt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testsTable.map((test, index) => (
                      <tr key={index} className="border-b text-sm">
                        <td className="px-2 py-1">{test.name}</td>
                        <td className="px-2 py-1">{test.disc}</td>
                        <td className="px-2 py-1">{test.cash}</td>
                        <td className="px-2 py-1">{test.gCash}</td>
                        <td className="px-2 py-1">{test.bal}</td>
                        <td className="px-2 py-1">
                          <button className="text-green-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-100 font-bold">
                      <td className="px-2 py-1 text-left text-green-800">TOTAL:</td>
                      <td className="px-2 py-1 text-left text-green-800">20%</td>                      
                      <td className="px-2 py-1 text-left text-green-800">250.00</td>
                      <td className="px-2 py-1 text-left text-green-800">100.0</td>
                      <td className="px-2 py-1 text-left text-green-800">--</td>
                      <td className="px-2 py-1 text-left text-green-800"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded">
                  Clear All
                </button>
                <button className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded">
                  Process Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default AddIncome
