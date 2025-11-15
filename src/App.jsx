import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import OfficerDashboard from './components/OfficerDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN","ROLE_ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
  <Route path="/officer" element={<ProtectedRoute allowedRoles={["OFFICER","ROLE_OFFICER"]}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
