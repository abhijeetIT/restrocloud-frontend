import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MenuPage      from './pages/MenuPage'
import TablesPage    from './pages/TablesPage'
import OrdersPage    from './pages/OrdersPage'
import PaymentsPage  from './pages/PaymentsPage'
import SettingsPage  from './pages/SettingsPage'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index                element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="menu"          element={<MenuPage />} />
        <Route path="tables"        element={<TablesPage />} />
        <Route path="orders"        element={<OrdersPage />} />
        <Route path="payments"      element={<PaymentsPage />} />
        <Route path="settings"      element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
