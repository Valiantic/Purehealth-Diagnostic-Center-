import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
// import Register from './pages/Register'; Remove due to early development stage only!
import Dashboard from './pages/Dashboard';
import Transaction from './pages/Transaction'
import AddExpenses from './pages/AddExpenses';
import AddIncome from './pages/AddIncome';
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

function App() {
  return (
    <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transaction" element={<Transaction/>}/>
        <Route path="add-expenses" element={<AddExpenses />} />
        <Route path="add-income" element={<AddIncome />} />
        <Route path="monthly-income" element={<MonthlyIncome />} />
        <Route path="monthly-expenses" element={<MonthlyExpenses />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="settings" element={<Settings />} />
        <Route path="view-accounts" element={<ViewAccounts />} />
        <Route path="add-account" element={<AddAccount />} />
        <Route path="activity-log" element={<ActivityLog />} />
        <Route path="department-management" element={<DepartmentManagement />} />
        <Route path="test-management" element={<TestManagement />} />
        <Route path="referral-management" element={<ReferralManagement />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;