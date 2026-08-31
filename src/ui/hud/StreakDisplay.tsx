import { useRef, useEffect } from 'react'
import { useGameState } from '@/game/GameContextCore'

export function StreakDisplay() {
  const state = useGameState()
  const streakRef = useRef<HTMLDivElement>(null)
  const prevStreak = useRef(state.streak)

  useEffect(() => {
    if (state.streak > prevStreak.current && streakRef.current) {
      streakRef.current.classList.remove('streak-bounce')
      void streakRef.current.offsetWidth
      streakRef.current.classList.add('streak-bounce')
    }
    prevStreak.current = state.streak
  }, [state.streak])

  if (state.streak === 0) return null

  return (
    <div
      ref={streakRef}
      className="streak-display"
      aria-label={`Streak: ${state.streak}`}
    >
      <span className="streak-display__fire">🔥</span>
      <span className="streak-display__label">STREAK</span>
      <span className="streak-display__value">× {state.streak}</span>
    </div>
  )
}
