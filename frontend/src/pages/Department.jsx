import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'

const Department = () => {
  const { user, isAuthenticating } = useAuth()
  const location = useLocation()
  

  if (isAuthenticating) {
    return null;
  }
  if (!user) {
    return null;
  }

  const currentPath = location.pathname;
  const activeTab = tabsConfig.find(tab => 
    currentPath === tab.route || currentPath.startsWith(tab.route)
  )?.name || 'Departments';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
        <div className='md:sticky md:top-0 md:h-screen z-10'>
            <Sidebar />
        </div>

        <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
       <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
         {/* Use the TabNavigation component */}
         <TabNavigation tabsConfig={tabsConfig} />
         
         {/* Content based on active tab */}
         {activeTab === 'Departments' && (
           <>
             <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
               {/* New Department Input and Button */}
               <div className="relative w-full sm:w-64">
                 <input
                   type="text"
                   placeholder="Enter new department..."
                   className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base pr-16"
                 />
                 <button 
                   className="absolute right-0 top-0 bottom-0 bg-green-800 text-white px-4 rounded-r-lg text-sm md:text-base hover:bg-green-600 h-full"
                 >
                   Add
                 </button>
               </div>

               {/* Search Input */}
               <div className="relative w-full sm:w-64">
                 <input
                   type="text"
                   placeholder="Search Activity..."
                   className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                 />
                 <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                 </div>
               </div>
             </div>
 
             {/* Activity Log Table */}
             <div className="p-2">
               <div className="bg-green-800 p-2 rounded-t">
                 <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Departments</h1>
               </div>
               <div className="border border-green-800 rounded-b">
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-green-800 bg-green-100">
                         <th className="p-1 border-r border-green-800 text-sm font-medium">User</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Email</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Date</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Time</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Action</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Opt</th>
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
 
                    {/* Expenses summary */}
                    <div className="mt-2 flex flex-col md:flex-row justify-end p-2">
                             <div className="flex flex-wrap items-center mb-4 md:mb-0">
                               <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                                 Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                               </button>
                               
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

export default Department
