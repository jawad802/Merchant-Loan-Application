import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import RolesPermissions from './pages/RolesPermissions';
import Users from './pages/Users';
import LeadSources from './pages/LeadSources';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="roles" element={<RolesPermissions />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<RolesPermissions />} />
          <Route path="lead-sources" element={<LeadSources />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;