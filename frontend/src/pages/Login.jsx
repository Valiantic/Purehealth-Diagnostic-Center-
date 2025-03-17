import React from 'react';
import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      <LoginForm />
    </div>
  );
};

export default Login; 