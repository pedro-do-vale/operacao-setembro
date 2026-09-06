import { LogOut } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { BottomNav, SidebarNav } from '../components/Navigation'
import { CampaignProvider } from '../contexts/CampaignContext'
import { logoutUser } from '../services/authService'

export function MainLayout() {
  return (
    <CampaignProvider>
      <div className="app-layout">
        <SidebarNav />
        <main className="app-layout__main">
          <button
            type="button"
            className="app-logout"
            onClick={() => logoutUser()}
            aria-label="Desconectar"
            title="Desconectar"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </CampaignProvider>
  )
}

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  )
}
