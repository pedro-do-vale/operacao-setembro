import { Outlet } from 'react-router-dom'
import { BottomNav, SidebarNav } from '../components/Navigation'
import { CampaignProvider } from '../contexts/CampaignContext'

export function MainLayout() {
  return (
    <CampaignProvider>
      <div className="app-layout">
        <SidebarNav />
        <main className="app-layout__main">
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
