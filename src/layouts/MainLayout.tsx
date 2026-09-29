import { useState } from 'react'
import { LogOut, RotateCcw } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { BottomNav, SidebarNav } from '../components/Navigation'
import { CampaignProvider } from '../contexts/CampaignContext'
import { logoutUser } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode } from '../lib/firebase'
import { demoStore } from '../services/demo/demoStore'

export function MainLayout() {
  const { firebaseUser } = useAuth()
  const navigate = useNavigate()
  const [demoVersion, setDemoVersion] = useState(0)

  function resetDemo() {
    if (!isDemoMode || !firebaseUser) return
    if (!demoStore.resetFinalBattle(firebaseUser.uid)) return
    setDemoVersion(version => version + 1)
    navigate('/batalha', { replace: true })
  }

  return (
    <CampaignProvider key={demoVersion}>
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
          {isDemoMode && <div className="demo-reset-panel">
            <div><strong>MODO DEMO</strong><span>Voltar ao dia 29 para testar a ascensão</span></div>
            <button type="button" onClick={resetDemo}><RotateCcw size={16} aria-hidden="true" />Resetar demo</button>
            {demoVersion > 0 && <p role="status">Demo resetado. Última batalha pronta!</p>}
          </div>}
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
