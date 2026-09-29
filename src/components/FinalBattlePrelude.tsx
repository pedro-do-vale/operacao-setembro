import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function FinalBattlePrelude({ onComplete }: { onComplete: () => void }) {
  const complete = useRef(onComplete)
  complete.current = onComplete
  const overlay = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = document.getElementById('root')
    const previous = document.activeElement as HTMLElement | null
    const wasInert = root?.inert ?? false
    const overflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = 'hidden'
    document.body.classList.add('final-battle-quake')
    overlay.current?.focus()
    const timer = window.setTimeout(() => complete.current(), 7000)
    return () => {
      window.clearTimeout(timer)
      document.body.classList.remove('final-battle-quake')
      document.body.style.overflow = overflow
      if (root) root.inert = wasInert
      previous?.focus()
    }
  }, [])

  return createPortal(
    <div className="final-battle-prelude" role="dialog" aria-modal="true" aria-label="A última batalha está terminando" ref={overlay} tabIndex={-1}
      onKeyDown={event => { if (event.key === 'Tab') event.preventDefault() }} />,
    document.body,
  )
}
