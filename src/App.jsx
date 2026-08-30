import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import AppShell from './components/layout/AppShell';

// Public pages
import LandingPage from './pages/public/LandingPage';
import TrackComplaintPage from './pages/public/TrackComplaintPage';
import FAQPage from './pages/public/FAQPage';
import HelpPage from './pages/public/HelpPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Citizen pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ComplaintListPage from './pages/citizen/ComplaintListPage';
import NewComplaintPage from './pages/citizen/NewComplaintPage';
import ComplaintDetailPage from './pages/citizen/ComplaintDetailPage';
import NotificationsPage from './pages/citizen/NotificationsPage';
import ProfilePage from './pages/citizen/ProfilePage';

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerComplaintList from './pages/officer/OfficerComplaintList';
import OfficerComplaintDetail from './pages/officer/OfficerComplaintDetail';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import OfficerManagement from './pages/admin/OfficerManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import SLAManagement from './pages/admin/SLAManagement';
import ReportsPage from './pages/admin/ReportsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import SettingsPage from './pages/admin/SettingsPage';

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'officer') return <Navigate to="/officer" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/track" element={<TrackComplaintPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Citizen routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintListPage /></ProtectedRoute>} />
        <Route path="/complaints/new" element={<ProtectedRoute allowedRoles={['citizen']}><NewComplaintPage /></ProtectedRoute>} />
        <Route path="/complaints/:id" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Officer routes */}
        <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/officer/complaints" element={<ProtectedRoute allowedRoles={['officer']}><OfficerComplaintList /></ProtectedRoute>} />
        <Route path="/officer/complaints/:id" element={<ProtectedRoute allowedRoles={['officer']}><OfficerComplaintDetail /></ProtectedRoute>} />
        <Route path="/officer/profile" element={<ProtectedRoute allowedRoles={['officer']}><ProfilePage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><ComplaintListPage /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentManagement /></ProtectedRoute>} />
        <Route path="/admin/officers" element={<ProtectedRoute allowedRoles={['admin']}><OfficerManagement /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManagement /></ProtectedRoute>} />
        <Route path="/admin/sla" element={<ProtectedRoute allowedRoles={['admin']}><SLAManagement /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/map" element={<ProtectedRoute allowedRoles={['admin']}><AdminMapPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
