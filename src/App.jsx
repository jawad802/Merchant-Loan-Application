import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import RolesPermissions from './pages/RolesPermissions';
import Users from './pages/Users';
import LeadSources from './pages/LeadSources';
import PermissionsCatalog from './pages/PermissionsCatalog';
import Teams from './pages/Teams';
import ForgotPassword from './pages/ForgotPassword';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="roles" element={<RolesPermissions />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<RolesPermissions />} />
          <Route path="lead-sources" element={<LeadSources />} />
          <Route path="permissions-catalog" element={<PermissionsCatalog />} />
          <Route path="teams" element={<Teams />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;