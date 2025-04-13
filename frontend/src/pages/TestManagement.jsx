import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download, PlusCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import useAuth from '../hooks/useAuth'
import TabNavigation from '../components/TabNavigation'
import tabsConfig from '../config/tabsConfig'

const Test = () => {
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
  )?.name || 'Test';

  return (
    <div className='flex flex-col md:flex-row h-screen'>
        <div className='md:sticky md:top-0 md:h-screen z-10'>
        <Sidebar />
        </div>
        <div className='flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64'>
       <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
         
         <TabNavigation tabsConfig={tabsConfig} />
         
         {activeTab === 'Test' && (
           <>
             <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-2 mt-4 mb-4">
               
               <button className="bg-green-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                                <PlusCircle className="mr-1 sm:mr-2" size={18} />
                                Add New Test
                              </button>
              
                              <div className="relative w-full sm:w-64">
                                <input
                                  type="text"
                                  placeholder="Search Test..."
                                  className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                              </div>
                </div>

            
             <div className="p-2">
               <div className="bg-green-800 p-2 rounded-t">
                 <h1 className='ml-2 font-bold text-white sm:text-xs md:text-2xl'>Tests</h1>
               </div>
               <div className="border border-green-800 rounded-b">
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-green-800 bg-green-100">
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Test Name</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Department</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Price</th>
                         <th className="p-1 border-r border-green-800 text-sm font-medium">Description</th>
                        <th className="p-1 border-r border-green-800 text-sm font-medium">Status</th>
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
 
             </div>
           </>
         )}
         

       </div>
     </div>
   </div>
  )
}

export default Test
