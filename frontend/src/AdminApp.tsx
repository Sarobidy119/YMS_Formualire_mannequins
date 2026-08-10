import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './shared/components/Toast'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { userAppUrl } from './shared/utils/appUrls'
import { Login } from './client/pages/Login'
import { ForgotPassword } from './client/pages/ForgotPassword'
import { SetPassword } from './client/pages/SetPassword'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { Dashboard } from './admin/pages/Dashboard'
import { ModelsList } from './admin/pages/ModelsList'
import { ModelDetail } from './admin/pages/ModelDetail'
import { Applications } from './admin/pages/Applications'
import { ActivitiesPage, CastingsPage } from './admin/pages/Operations'

export default function AdminApp() {
  return <ToastProvider><BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}><Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login admin destination="/admin/dashboard" />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<SetPassword mode="reset" />} />
    <Route path="/admin" element={<ProtectedRoute requiredRole="admin" forbiddenAppUrl={userAppUrl} forbiddenPath="/client/profile"><AdminLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="models" element={<ModelsList />} />
      <Route path="models/:id" element={<ModelDetail />} />
      <Route path="applications" element={<Applications />} />
      <Route path="castings" element={<CastingsPage />} />
      <Route path="activities" element={<ActivitiesPage />} />
      <Route path="*" element={<div className="p-8 text-gray-500">Page introuvable.</div>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></ToastProvider>
}
