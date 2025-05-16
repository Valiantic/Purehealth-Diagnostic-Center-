import React from 'react';
import { Calendar } from 'lucide-react';
import Expense from '../../assets/icons/expense_logo.png';

const ExpenseHeader = ({
  formattedDate,
  expenseDateInputRef,
  handleDateChange,
  selectedDate,
  openDatePicker,
  handleNewExpenses
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-4">
      <div className="flex items-center mb-3 md:mb-0">
        <h2 className="text-xl md:text-2xl font-bold text-green-800 flex items-center">
          Expenses
          <span className="ml-2">
            <img src={Expense} className="w-7 h-7 md:w-10 md:h-10" alt="Income Icon"/>
          </span>
        </h2>
      </div>
      
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Expenses..."
            className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto justify-between md:justify-start">
          <div 
            className="relative flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none cursor-pointer"
            onClick={() => openDatePicker(expenseDateInputRef)}
          >
            <input
              ref={expenseDateInputRef}
              type="date"
              className="absolute opacity-0 w-full h-full cursor-pointer z-10" 
              onChange={handleDateChange}
              value={selectedDate.toISOString().split('T')[0]}
            />
            <span className="px-1 md:px-2 py-1 flex-grow">
              {formattedDate}
            </span>
            <Calendar 
              className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" 
              onClick={(e) => {
                e.stopPropagation();
                openDatePicker(expenseDateInputRef);
              }}
            />
          </div>
                
          <button onClick={handleNewExpenses} className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32 hover:bg-green-600">
            New
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseHeader;
