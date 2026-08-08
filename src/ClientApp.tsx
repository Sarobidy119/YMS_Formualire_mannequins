import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './shared/components/Toast'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { useAuth } from './shared/hooks/useAuth'
import { adminAppUrl, leaveForApp } from './shared/utils/appUrls'
import { Login } from './client/pages/Login'
import { Register } from './client/pages/Register'
import { ForgotPassword } from './client/pages/ForgotPassword'
import { ModelForm } from './client/pages/ModelForm'
import { MyProfile } from './client/pages/MyProfile'
import { ClientLanding } from './client/pages/ClientLanding'

function ClientHome() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'admin' && leaveForApp(adminAppUrl, '/admin/dashboard')) return null
  return <Navigate to={profile?.role === 'model' ? '/client/profile' : '/client'} replace />
}

export default function ClientApp() {
  return <ToastProvider><BrowserRouter><Routes>
    <Route path="/" element={<ClientHome />} />
    <Route path="/client" element={<ClientLanding />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/client/onboarding" element={<ModelForm />} />
    <Route path="/client/profile" element={<ProtectedRoute requiredRole="model" forbiddenAppUrl={adminAppUrl} forbiddenPath="/admin/dashboard"><MyProfile /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></ToastProvider>
}
