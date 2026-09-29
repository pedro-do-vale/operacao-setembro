import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useMonkSoundtrack } from '../hooks/useMonkSoundtrack'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('starts at 13 seconds, preserves the timeline while muted, and stops on close', async () => {
  const track = { currentTime: 0, volume: 1, preload: '', onloadedmetadata: null as (() => void) | null, muted: false, paused: false, load: vi.fn(), play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() }
  vi.stubGlobal('Audio', vi.fn(function () { return track }))
  const { result } = renderHook(useMonkSoundtrack)
  expect(track.preload).toBe('auto')
  expect(track.load).toHaveBeenCalledOnce()
  expect(track.play).not.toHaveBeenCalled()
  track.onloadedmetadata?.()
  expect(track.currentTime).toBe(13)
  await act(async () => result.current.startSoundtrack())
  expect(Audio).toHaveBeenCalledOnce()
  expect(track.currentTime).toBe(13)
  expect(track.play).toHaveBeenCalledOnce()
  expect(result.current.soundEnabled).toBe(true)
  track.currentTime = 21
  act(() => result.current.toggleSoundtrack())
  expect(track.muted).toBe(true)
  expect(result.current.soundEnabled).toBe(false)
  act(() => result.current.toggleSoundtrack())
  expect(track.currentTime).toBe(21)
  expect(track.muted).toBe(false)
  act(() => result.current.stopSoundtrack())
  expect(track.pause).toHaveBeenCalledOnce()
  expect(track.currentTime).toBe(13)
  expect(result.current.soundEnabled).toBe(false)
})

it('allows retrying blocked playback and stops playback when leaving the page', async () => {
  const track = { currentTime: 0, muted: false, paused: true, load: vi.fn(), play: vi.fn().mockRejectedValueOnce(new Error('Blocked')).mockResolvedValue(undefined), pause: vi.fn() }
  vi.stubGlobal('Audio', vi.fn(function () { return track }))
  const { result, unmount } = renderHook(useMonkSoundtrack)
  await act(async () => result.current.startSoundtrack())
  expect(result.current.soundEnabled).toBe(false)
  await act(async () => result.current.toggleSoundtrack())
  expect(track.play).toHaveBeenCalledTimes(2)
  expect(track.currentTime).toBe(13)
  unmount()
  expect(track.pause).toHaveBeenCalled()
})
