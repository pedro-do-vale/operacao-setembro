import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BattlePage } from '../pages/BattlePage'
import { demoStore } from '../services/demo/demoStore'
import { buildAvatarConfigForRank } from '../utils/ranks'

const { checkIn } = vi.hoisted(() => ({ checkIn: vi.fn() }))
vi.mock('../services/campaignService', () => ({ performCheckIn: checkIn }))
vi.mock('../contexts/CampaignContext', () => ({ useCampaign: () => ({ campaign: demoStore.getCampaign(), player: demoStore.getPlayer('p15'), aliveCount: 10, playerRank: 2, loading: false }) }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ userProfile: null }) }))
vi.mock('../services/feedService', () => ({ getFeedHistory: async () => [] }))
vi.mock('../services/supportService', () => ({
  getSupportHistory: async () => [],
  subscribeToSupportRequests: () => () => {},
  getSupportCooldownRemaining: () => 0,
  isSupportAlertVisible: () => false,
}))

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  checkIn.mockReset()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.scrollTo = vi.fn()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('Monk ceremony trigger', () => {
  it('starts the quake immediately and waits exactly seven seconds before the confirmed ceremony', async () => {
    vi.useFakeTimers()
    let confirm!: (value: unknown) => void
    checkIn.mockReturnValue(new Promise(resolve => { confirm = resolve }))
    render(<MemoryRouter><BattlePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /CONCLUIR A ÚLTIMA BATALHA/ }))
    expect(screen.getByRole('dialog', { name: 'A última batalha está terminando' })).toBeInTheDocument()
    expect(document.body).toHaveClass('final-battle-quake')
    expect(screen.getByRole('button', { name: /REGISTRANDO/ })).toBeDisabled()
    await act(async () => confirm({ promoted: true, newRank: 'monge', player: { ...demoStore.getPlayer('p15'), status: 'monk', daysSurvived: 30, avatarConfig: buildAvatarConfigForRank('monge', 'base-a') } }))
    act(() => vi.advanceTimersByTime(6999))
    expect(screen.queryByRole('dialog', { name: 'Você começou como um soldado.' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('dialog', { name: 'Você começou como um soldado.' })).toBeInTheDocument()
    expect(document.body).not.toHaveClass('final-battle-quake')
    expect(screen.queryByText('Novo equipamento desbloqueado!')).not.toBeInTheDocument()
  })

  it('keeps the achievement closed when confirmation fails', async () => {
    checkIn.mockRejectedValue(new Error('Não foi possível confirmar o dia.'))
    render(<MemoryRouter><BattlePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /CONCLUIR A ÚLTIMA BATALHA/ }))
    expect(await screen.findByText('Não foi possível confirmar o dia.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body).not.toHaveClass('final-battle-quake')
    expect(screen.getByRole('button', { name: /CONCLUIR A ÚLTIMA BATALHA/ })).toBeEnabled()
  })

  it('stays behind the blackout if the server takes longer than seven seconds', async () => {
    vi.useFakeTimers()
    let confirm!: (value: unknown) => void
    checkIn.mockReturnValue(new Promise(resolve => { confirm = resolve }))
    render(<MemoryRouter><BattlePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /CONCLUIR A ÚLTIMA BATALHA/ }))
    act(() => vi.advanceTimersByTime(7000))
    expect(screen.getByRole('dialog', { name: 'A última batalha está terminando' })).toBeInTheDocument()
    await act(async () => confirm({ promoted: true, newRank: 'monge', player: { ...demoStore.getPlayer('p15'), status: 'monk', daysSurvived: 30 } }))
    expect(screen.getByRole('dialog', { name: 'Você começou como um soldado.' })).toBeInTheDocument()
  })
})
