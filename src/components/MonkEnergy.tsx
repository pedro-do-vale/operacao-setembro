import type { CSSProperties } from 'react'

export function MonkEnergy() {
  return (
    <div className="monk-energy" aria-hidden="true">
      <svg className="monk-energy__infinity" viewBox="0 0 240 120" fill="none">
        <path d="M120 60C90 15 25 15 25 60S90 105 120 60 215 15 215 60 150 105 120 60Z" />
      </svg>
      {Array.from({ length: 14 }, (_, particle) => (
        <i
          key={particle}
          className="monk-energy__particle"
          style={{
            '--particle-x': `${8 + ((particle * 31) % 84)}%`,
            '--particle-delay': `${-particle * 0.73}s`,
            '--particle-duration': `${3.5 + (particle % 5) * 0.6}s`,
            '--particle-drift': `${(particle % 2 ? 1 : -1) * (12 + particle)}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
