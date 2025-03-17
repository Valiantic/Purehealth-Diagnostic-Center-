import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} Purehealth Profit Management System
      </footer>
    </div>
  );
};

export default Layout; 