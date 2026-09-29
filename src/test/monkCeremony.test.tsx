import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MonkCeremony } from '../components/MonkCeremony'
import { demoStore } from '../services/demo/demoStore'

const player = { ...demoStore.getPlayer('p6')! }
vi.mock('../services/feedService', () => ({ getFeedHistory: async () => [] }))
vi.mock('../services/supportService', () => ({ getSupportHistory: async () => [] }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('Última Travessia', () => {
  it('shows the cinematic first and opens the mobile timeline only from the final button', async () => {
    render(<MonkCeremony player={player} campaign={demoStore.getCampaign()} onClose={() => {}} />)
    expect(screen.queryByRole('heading', { name: 'Sua trajetória' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(8400))
    expect(screen.getByTestId('ascension-glow')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3600))
    expect(screen.getByRole('heading', { name: 'RAFAEL, você transcendeu.' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.queryByTestId('ascension-glow')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'VER A MINHA TRAJETÓRIA' }))
    await act(async () => {})
    act(() => vi.advanceTimersByTime(60000))
    expect(screen.getByRole('heading', { name: 'Sua trajetória' })).toBeInTheDocument()
    expect(screen.getByText('DIA 30')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'VOLTAR À CONQUISTA' }))
    expect(screen.getByRole('heading', { name: 'RAFAEL, você transcendeu.' })).toBeInTheDocument()
  })

  it('reveals the monk after the journey and stops the timer', () => {
    const close = vi.fn()
    render(<MonkCeremony player={player} onClose={close} />)
    expect(screen.getByRole('heading', { name: 'Você começou como um soldado.' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(13500))
    expect(screen.getByRole('heading', { name: 'RAFAEL, você transcendeu.' })).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'FECHAR' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('allows skipping without waiting or altering the achievement', () => {
    render(<MonkCeremony player={player} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pular cerimônia' }))
    expect(screen.getByRole('heading', { name: 'RAFAEL, você transcendeu.' })).toBeInTheDocument()
    expect(player.daysSurvived).toBe(30)
  })

  it('honors reduced motion and releases focus and scroll on dismissal', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const close = vi.fn()
    const view = render(<MonkCeremony player={player} onClose={close} />)
    expect(screen.getByRole('heading', { name: 'RAFAEL, você transcendeu.' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
    view.unmount()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})

describe('Final demo check-in', () => {
  it('grants monk once, records the date and emits exactly one MONK event', () => {
    const result = demoStore.performCheckIn('p15')
    expect(result).toMatchObject({ promoted: true, newRank: 'monge', player: { status: 'monk', daysSurvived: 30 } })
    expect(result.player.lastCheckIn).toBeInstanceOf(Date)
    expect(() => demoStore.performCheckIn('p15')).toThrow('Check-in não permitido')
    expect(demoStore.getFeed().filter(event => event.playerId === 'p15' && event.type === 'MONK')).toHaveLength(1)
  })
})
