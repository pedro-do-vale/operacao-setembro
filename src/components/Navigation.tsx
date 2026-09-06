import { NavLink } from 'react-router-dom'
import { Swords, Trophy, ScrollText, Skull, Medal } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/batalha', label: 'Batalha', icon: Swords, emoji: '⚔️' },
  { to: '/ranking', label: 'Ranking', icon: Trophy, emoji: '🏆' },
  { to: '/feed', label: 'Feed', icon: ScrollText, emoji: '📜' },
  { to: '/cemiterio', label: 'Cemitério', icon: Skull, emoji: '💀' },
  { to: '/evolucao', label: 'Patentes', icon: Medal, emoji: '🎖️' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {NAV_ITEMS.map(({ to, label, emoji }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">{emoji}</span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function SidebarNav() {
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      <div className="sidebar-nav__brand">
        <span className="sidebar-nav__logo">⚔️</span>
        <div>
          <h1 className="sidebar-nav__title">OPERAÇÃO</h1>
          <p className="sidebar-nav__subtitle">SETEMBRO</p>
        </div>
      </div>
      {NAV_ITEMS.map(({ to, label, emoji }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `sidebar-nav__item ${isActive ? 'sidebar-nav__item--active' : ''}`}>
          <span aria-hidden="true">{emoji}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
