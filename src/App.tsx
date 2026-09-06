import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { MainLayout, AuthLayout } from './layouts/MainLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { BattlePage } from './pages/BattlePage'
import { RankingPage } from './pages/RankingPage'
import { FeedPage } from './pages/FeedPage'
import { GraveyardPage } from './pages/GraveyardPage'
import { EvolutionGalleryPage } from './pages/EvolutionGalleryPage'

const basename = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || ''

export default function App() {
  return (
    <BrowserRouter basename={basename || undefined}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/batalha" element={<BattlePage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/cemiterio" element={<GraveyardPage />} />
              <Route path="/evolucao" element={<EvolutionGalleryPage />} />
              <Route path="/perfil" element={<Navigate to="/evolucao" replace />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/batalha" replace />} />
          <Route path="*" element={<Navigate to="/batalha" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
