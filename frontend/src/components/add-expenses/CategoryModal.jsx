import React, { useState } from 'react'
import { X } from 'lucide-react'

const CategoryModal = ({ isOpen, onClose, onAddCategory }) => {
    const [categoryName, setCategoryName] = useState('')
    const [error, setError] = useState('')

    const validateForm = () => {
        if (!categoryName.trim()) {
            setError('Category name is required')
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (validateForm()) {
            onAddCategory({
                name: categoryName.trim()
            });

            setCategoryName('');
            setError('');
            // Don't call onClose() here - let the parent handle it
        }
    };

    const handleClose = () => {
        setCategoryName('');
        setError('');
        onClose();
    }

    if (!isOpen) return null;
    
    return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' onClick={handleClose}>
      <div className='bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden' onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className='bg-[#02542D] text-white p-4 flex justify-between items-center'>
            <h2 className='text-lg sm:text-xl md:text font-semibold'>Add Category</h2>
            <button onClick={handleClose}
            className='text-white hover:text-gray-300 transition duration-200'
            >
                <X className='w-5 h-5' />
            </button>
        </div>
        {/* Modal Body */}
        <form onSubmit={handleSubmit}
        className='p-4 space-y-4'>
            <div>
                <label htmlFor="categoryName"
                className='block text-gray-700 font-semibold text-sm mb-1'
                >
                    Add Category
                </label>
                <input type="text" 
                id='categoryName'
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="Enter category name"
                />
                {error && (
                    <p className='text-red-500 text-sm mt-1'>{error}</p>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                type='button'
                onClick={handleClose}
                className='bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200'
                >
                    Cancel
                </button>
                <button
                type='submit'
                className='bg-[#02542D] text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200'
                >
                    Add Category
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
