import { expect, it } from 'vitest'
import { demoStore } from '../services/demo/demoStore'

it('resets the final battle without logging out and permits another ascension', () => {
  demoStore.setCurrentPlayer('p15')
  demoStore.performCheckIn('p15')
  expect(demoStore.getPlayer('p15')?.status).toBe('monk')
  expect(demoStore.resetFinalBattle('p15')).toBe(true)
  expect(demoStore.getCurrentPlayer()).toMatchObject({ userId: 'p15', status: 'alive', daysSurvived: 29, currentRank: 'rei' })
  expect(demoStore.getFeed().some(event => event.playerId === 'p15' && event.type === 'MONK')).toBe(false)
  expect(demoStore.getFeed().some(event => event.id === 'journey-p15-cabo')).toBe(true)
  expect(demoStore.performCheckIn('p15').newRank).toBe('monge')
  expect(demoStore.getFeed().filter(event => event.playerId === 'p15' && event.type === 'MONK')).toHaveLength(1)
})
