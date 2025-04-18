import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download, PlusCircle, X, Calendar } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'

const ReferralManagement = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('Mang');
  const [lastName, setLastName] = useState('Kepweng');
  const [birthday, setBirthday] = useState('24-Mar-2024');
  const [sex, setSex] = useState('Male');
  const [clinicName, setClinicName] = useState('Kepweng\'s Nipa Hut');
  const [clinicAddress, setClinicAddress] = useState('B12 L12 Mango St. Brgy. Ramon Cruz GMA Cavite');
  const [contactNo, setContactNo] = useState('09123456789');

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Referrer';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
    <div className='md:sticky md:top-0 md:h-screen z-10'>
    <Sidebar />
    </div>
    <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
   <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
     
     <TabNavigation tabsConfig={tabsConfig} />
     
     {activeTab === 'Referrer' && (
       <>
         <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
           
           <button onClick={openModal} className="bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                            <PlusCircle className="mr-1 sm:mr-2" size={18} />
                            Add New Referrer
                          </button>
          
                          <div className="relative w-full sm:w-64">
                            <input
                              type="text"
                              placeholder="Search Referrer..."
                              className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                          </div>
            </div>

        
         <div className="p-2">
           <div className="bg-green-800 p-2 rounded-t">
             <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Doctors</h1>
           </div>
           <div className="border border-green-800 rounded-b">
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-green-800 bg-green-100">
                     <th className="p-1 border-r border-green-800 text-sm font-medium">Doctor Name</th>
                     <th className="p-1 border-r border-green-800 text-sm font-medium">Clinic Name</th>
                     <th className="p-1 border-r border-green-800 text-sm font-medium">Address</th>
                     <th className="p-1 border-r border-green-800 text-sm font-medium">Birth Date</th>
                    <th className="p-1 border-r border-green-800 text-sm font-medium">Date Added</th>
                     <th className="p-1 border-r border-green-800 text-sm font-medium">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {/* Empty rows for data input */}
                   {[...Array(10)].map((_, index) => (
                     <tr key={`activity-row-${index}`} className="border-b border-green-200">
                       <td className="p-1 border-r border-green-200"></td>
                       <td className="p-1 border-r border-green-200"></td>
                       <td className="p-1 border-r border-green-200"></td>
                       <td className="p-1 border-r border-green-200"></td>
                       <td className="p-1 border-r border-green-200"></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>

                <div className="mt-2 flex flex-col md:flex-row justify-end p-2">
                         <div className="flex flex-wrap items-center mb-4 md:mb-0">
                           <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                             Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                           </button>
                           
                         </div>
                       </div>


                       {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-md rounded shadow-lg">
            {/* Header with title and close button */}
            <div className="bg-green-800 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="text-xl font-medium">New Referrer</h3>
              <button onClick={closeModal} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            {/* Form content */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                {/* Birthday */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">Birthday</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 pr-10"
                    />
                    <Calendar className="absolute right-2 top-2 text-gray-500" size={20} />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">Sex</label>
                  <div className="relative">
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-500" viewBox="0 0 20 20">
                        <path d="M7 10l5 5 5-5H7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Clinic Name */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                {/* Contact No. */}
                <div>
                  <label className="block text-green-800 font-medium mb-1">Contact No.</label>
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>

                {/* Clinic Address - Full Width */}
                <div className="col-span-2">
                  <label className="block text-green-800 font-medium mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-300 my-4"></div>

              {/* Confirm Button */}
              <div className="flex justify-center">
                <button
                  onClick={closeModal}
                  className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 uppercase font-medium"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

         </div>
       </>
     )}
     

   </div>
 </div>
</div>
  )
}

export default ReferralManagement
