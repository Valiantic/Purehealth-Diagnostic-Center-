import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transaction from './pages/Transaction';
import AddExpenses from './pages/AddExpenses';
import Expenses from './pages/Expenses';
import AddTransaction from './pages/AddTransaction';
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

          {/* Routes with permission-based access control */}
          <Route path="dashboard" element={<ProtectedRoute component={Dashboard} requiredPermission="dashboard.view" />} />
          <Route path="manage-transaction" element={<ProtectedRoute component={Transaction} requiredPermission="transactions.view" />} />
          <Route path="add-transaction" element={<ProtectedRoute component={AddTransaction} requiredPermission="transactions.create" />} />
          <Route path="manage-expenses" element={<ProtectedRoute component={Expenses} requiredPermission="expenses.view" />} />
          <Route path="add-expenses" element={<ProtectedRoute component={AddExpenses} requiredPermission="expenses.create" />} />
          <Route path="referrals" element={<ProtectedRoute component={Referrals} requiredPermission="referrals.view" />} />
          <Route path="monthly-income" element={<ProtectedRoute component={MonthlyIncome} />} />
          <Route path="monthly-expenses" element={<ProtectedRoute component={MonthlyExpenses} />} />
          
          {/* Settings and Account Management */}
          <Route path="settings" element={<ProtectedRoute component={Settings} />} />
          <Route path="view-accounts" element={<ProtectedRoute component={ViewAccounts} requiredPermission="accounts.manage" />} />
          <Route path="add-account" element={<ProtectedRoute component={AddAccount} requiredPermission="accounts.manage" />} />
          <Route path="activity-log" element={<ProtectedRoute component={ActivityLog} requiredPermission="activitylog.view" />} />
          <Route path="department-management" element={<ProtectedRoute component={DepartmentManagement} requiredPermission="departments.manage" />} />
          <Route path="test-management" element={<ProtectedRoute component={TestManagement} requiredPermission="tests.manage" />} />
          <Route path="referral-management" element={<ProtectedRoute component={ReferralManagement} requiredPermission="referrals.manage" />} />
          <Route path="settings/roles" element={<ProtectedRoute component={Settings} requiredPermission="roles.manage" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;