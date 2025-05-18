import React from 'react';
import { Calendar } from 'lucide-react';

const DateSelector = ({ 
  date, 
  onDateChange, 
  inputRef, 
  className = "relative flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none cursor-pointer"
}) => {

  const openDatePicker = () => {
    if (inputRef && inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const formatDateToDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  return (
    <div 
      className={className}
      onClick={openDatePicker}
    >
      <input
        ref={inputRef}
        type="date"
        className="absolute opacity-0 w-full h-full cursor-pointer z-10"
        onChange={onDateChange}
        value={formatDateForInput(date)}
      />
      <span className="px-1 md:px-2 py-1 flex-grow">
        {formatDateToDisplay(date)}
      </span>
      <Calendar 
        className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" 
        onClick={(e) => {
          e.stopPropagation();
          openDatePicker();
        }}
      />
    </div>
  );
};

export default DateSelector;
