import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Dashboard from './pages/Dashboard';
import Transaction from './pages/Transaction'
import NewTransaction from './pages/NewTransaction';
import AddExpenses from './pages/AddExpenses';
import AddTransaction from './pages/AddTransaction';
import NewAddTransaction from './pages/NewAddTransaction';
import MonthlyIncome from './pages/MonthlyIncome';
import MonthlyExpenses from './pages/MonthlyExpenses';
import Referrals from './pages/Referrals';
import Settings from './pages/Settings';
import ViewAccounts from './pages/ViewAccounts';
import AddAccount from './pages/AddAccount';
import ActivityLog from './pages/ActivityLog';
import DepartmentManagement from './pages/DepartmentManagement';
import TestManagement from './pages/TestManagement';
import ReferralManagement from './pages/ReferralManagement';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient()

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ToastContainer />
        <Routes>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Routes accessible to all authenticated users */}
          <Route path="dashboard" element={<ProtectedRoute component={Dashboard} />} />
          <Route path="manage-transaction" element={<ProtectedRoute component={NewTransaction} />} />
          <Route path="add-transaction" element={<ProtectedRoute component={NewAddTransaction} />} />
          <Route path="referrals" element={<ProtectedRoute component={Referrals} />} />
          <Route path="settings" element={<ProtectedRoute component={Settings} />} />
          <Route path="add-expenses" element={<ProtectedRoute component={AddExpenses} />} />
          <Route path="monthly-income" element={<ProtectedRoute component={MonthlyIncome} />} />
          <Route path="monthly-expenses" element={<ProtectedRoute component={MonthlyExpenses} />} />
          <Route path="view-accounts" element={<ProtectedRoute component={ViewAccounts} restrictFromRole="receptionist" />} />
          <Route path="add-account" element={<ProtectedRoute component={AddAccount} restrictFromRole="receptionist" />} />
          
          {/* Routes receptionists shouldn't access */}
          <Route path="activity-log" element={<ProtectedRoute component={ActivityLog} restrictFromRole="receptionist" />} />
          <Route path="department-management" element={<ProtectedRoute component={DepartmentManagement} restrictFromRole="receptionist" />} />
          <Route path="test-management" element={<ProtectedRoute component={TestManagement} restrictFromRole="receptionist" />} />
          <Route path="referral-management" element={<ProtectedRoute component={ReferralManagement} restrictFromRole="receptionist" />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;