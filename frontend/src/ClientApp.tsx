import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './shared/components/Toast'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { useAuth } from './shared/hooks/useAuth'
import { adminAppUrl, leaveForApp } from './shared/utils/appUrls'
import { Login } from './client/pages/Login'
import { Register } from './client/pages/Register'
import { ForgotPassword } from './client/pages/ForgotPassword'
import { SetPassword } from './client/pages/SetPassword'
import { ModelForm } from './client/pages/ModelForm'
import { MyProfile } from './client/pages/MyProfile'
import { ClientLanding } from './client/pages/ClientLanding'
import { ClientLayout } from './client/layouts/ClientLayout'
import { ClientDashboard } from './client/pages/ClientDashboard'
import { ClientCastings } from './client/pages/ClientCastings'
import { ClientActivities } from './client/pages/ClientActivities'
import { ClientSettings } from './client/pages/ClientSettings'

function ClientHome() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'admin' && leaveForApp(adminAppUrl, '/admin/dashboard')) return null
  return <Navigate to={profile?.role === 'model' ? '/client/dashboard' : '/client'} replace />
}

export default function ClientApp() {
  return <ToastProvider><BrowserRouter future={{ v7_relativeSplatPath: true }}><Routes>
    <Route path="/" element={<ClientHome />} />
    <Route path="/client" element={<ClientLanding />} />
    
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<SetPassword mode="reset" />} />
    <Route path="/set-password" element={<SetPassword mode="invite" />} />
    <Route path="/client/onboarding" element={<ModelForm />} />
    <Route path="/login" element={<Login destination="/client/dashboard" />} />
    <Route path="/client" element={<ProtectedRoute requiredRole="model" forbiddenAppUrl={adminAppUrl} forbiddenPath="/admin/dashboard"><ClientLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/client/dashboard" replace />} />
      <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="castings" element={<ClientCastings />} />
      <Route path="activities" element={<ClientActivities />} />
      <Route path="settings" element={<ClientSettings />} />
      <Route path="profile" element={<MyProfile />} />
      <Route path="*" element={<div className="p-8 text-gray-500">Page introuvable.</div>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></ToastProvider>
}
