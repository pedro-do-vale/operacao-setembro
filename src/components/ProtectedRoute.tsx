import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingScreen } from '../components/LoadingScreen'

export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!firebaseUser) return <Navigate to="/login" replace />

  return <Outlet />
}

export function PublicRoute() {
  const { firebaseUser, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (firebaseUser) return <Navigate to="/batalha" replace />

  return <Outlet />
}
