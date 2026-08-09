import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { leaveForApp } from '../utils/appUrls'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'model'
  forbiddenAppUrl?: string | null
  forbiddenPath?: string
}

// Rappel : ceci est une barrière UX/confort. La sécurité réelle est assurée par
// les policies RLS PostgreSQL — même si ce composant était contourné, les
// requêtes Supabase renverraient un ensemble vide ou une erreur pour un
// utilisateur non autorisé.
export function ProtectedRoute({ children, requiredRole, forbiddenAppUrl, forbiddenPath = '/' }: ProtectedRouteProps) {
  const { profile, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yms-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    if (leaveForApp(forbiddenAppUrl ?? null, forbiddenPath)) return null
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
