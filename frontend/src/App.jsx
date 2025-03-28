import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transaction from './pages/Transaction'
import AddExpenses from './pages/AddExpenses';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transaction" element={<Transaction/>}/>
        <Route path="add-expenses" element={<AddExpenses />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App; 