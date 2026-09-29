import { useEffect, useRef, useState } from 'react'
import soundtrackUrl from '../assets/audio/monk-travessia.mp3'

const START_SECONDS = 13

function prepareSoundtrack() {
  const track = new Audio(soundtrackUrl)
  track.preload = 'auto'
  track.defaultMuted = false
  track.muted = false
  track.volume = 0.7
  // Seek while loading, before the user clicks, so playback is already buffered.
  track.onloadedmetadata = () => { track.currentTime = START_SECONDS }
  track.load()
  return track
}

export function useMonkSoundtrack() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    const track = prepareSoundtrack()
    audio.current = track
    track.onended = () => setSoundEnabled(false)
    track.onerror = () => setSoundEnabled(false)
    return () => {
      track.pause()
      track.onloadedmetadata = null
      track.onended = null
      track.onerror = null
      if (audio.current === track) audio.current = null
    }
  }, [])

  function startSoundtrack() {
    const track = audio.current
    if (!track) return
    // Reuse the prepared player; another seek here would delay the first sound.
    if (Math.abs(track.currentTime - START_SECONDS) > 0.05) track.currentTime = START_SECONDS
    track.muted = false
    setSoundEnabled(true)
    // Called directly from the user's click so browsers can allow playback.
    void track.play().then(() => {
      if (audio.current === track) setSoundEnabled(!track.paused && !track.muted)
    }).catch(() => {
      if (audio.current === track) setSoundEnabled(false)
    })
  }

  function stopSoundtrack() {
    const track = audio.current
    if (track) {
      track.pause()
      track.currentTime = START_SECONDS
    }
    setSoundEnabled(false)
  }

  function toggleSoundtrack() {
    const track = audio.current
    if (!track || track.paused) { startSoundtrack(); return }
    track.muted = !track.muted
    setSoundEnabled(!track.muted)
  }

  return { soundEnabled, startSoundtrack, stopSoundtrack, toggleSoundtrack }
}
