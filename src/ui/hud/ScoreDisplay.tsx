import { useRef, useEffect } from 'react'
import { useGameState } from '@/game/GameContextCore'

export function ScoreDisplay() {
  const state = useGameState()
  const prevScore = useRef(state.score)
  const scoreRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (state.score !== prevScore.current && scoreRef.current) {
      scoreRef.current.classList.remove('score-pop')
      void scoreRef.current.offsetWidth
      scoreRef.current.classList.add('score-pop')
      prevScore.current = state.score
    }
  }, [state.score])

  return (
    <div className="score-display" aria-label={`Score: ${state.score}`}>
      <span className="score-display__label">SCORE</span>
      <span ref={scoreRef} className="score-display__value">
        {state.score.toLocaleString()}
      </span>
    </div>
  )
}
