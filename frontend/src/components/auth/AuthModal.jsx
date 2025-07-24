import React from 'react'
import { Loader2 } from 'lucide-react'

const AuthModal = ({ isOpen, OnClose }) => {

    if (!isOpen) return null;

    return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 md:p-8 max-w-sm w-full mx-4 text-center shadow-xl'>
                    <div className='flex flex-col items-center space-y-4'>
                            <div className='relative'>
                                    <Loader2 className='w-16 h-16 text-green-600 animate-spin' />
                            </div>

                            <div className='space-y-4'>
                                    <h1 className='text-2xl sm:text-lg md:text-2xl text-green-700'>
                                    Hang tight!
                                    </h1>
                                    <p className='text-xs md:text-base text-gray-700'>
                                        We're verifying your credentials.<br />
                                        This might take a moment...
                                    </p>
                            </div>

                    </div>
            </div>
    </div>
)
}

export default AuthModal
