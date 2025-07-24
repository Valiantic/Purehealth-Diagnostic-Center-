import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/animations/loading-animation.json';

const Loading = ({ message = 'Loading data...', height = 200 }) => {
  return (
    <div className='flex flex-col items-center justify-center w-full p-4'>
        <div className={`flex justify-center items-center h-${height / 4} w-${height / 4} max-w-full`}>
            <Lottie
                animationData={loadingAnimation}
                loop={true}
                className='h-full w-full'
            />
        </div>
        {message && (
            <p className='text-green-800 font-semibold text-lg mt-4'>{message}</p>
        )}
    </div>
  )
}

export default Loading