import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGameState, useGameDispatch } from '@/game/GameContextCore'

function getResultOverlayClass(result: 'correct' | 'wrong' | 'miss'): string {
  if (result === 'correct') return 'result-overlay--correct'
  if (result === 'wrong') return 'result-overlay--wrong'
  return 'result-overlay--miss'
}

/**
 * Top Tactical Banner Result Notification (SKILL.md Law 5).
 * Triggers victory confetti particle bursts on correct answers & streaks.
 * Non-blocking HUD keep the 3D explosion and action 100% visible.
 */
export function ResultOverlay() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const overlayRef = useRef<HTMLDivElement>(null)

  const isResolving = state.phase === 'resolving'
  const isCorrect = state.lastResult === 'correct'
  const isWrong = state.lastResult === 'wrong'
  const isMiss = state.lastResult === 'miss'

  useEffect(() => {
    if (overlayRef.current && isResolving) {
      overlayRef.current.classList.remove('result-overlay--enter')
      void overlayRef.current.offsetWidth // force reflow
      overlayRef.current.classList.add('result-overlay--enter')

      // Confetti celebration on correct hits
      if (isCorrect) {
        confetti({
          particleCount: state.streak >= 2 ? 80 : 45,
          spread: state.streak >= 2 ? 85 : 60,
          origin: { y: 0.25 },
          colors: ['#00e5ff', '#ffd700', '#00ff88', '#ffffff'],
          disableForReducedMotion: true,
        })
      }
    }
  }, [isResolving, state.lastResult, isCorrect, state.streak])

  // Automatically advance to next question
  useEffect(() => {
    if (!isResolving) return

    const duration = isCorrect ? 1800 : 2500
    const timer = setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' })
    }, duration)

    return () => clearTimeout(timer)
  }, [isResolving, isCorrect, dispatch, state.currentQuestionIndex])

  if (!isResolving || !state.lastResult) return null

  const currentQuestion = state.questions[state.currentQuestionIndex]
  const resultClass = getResultOverlayClass(state.lastResult)
  const delta = isCorrect ? '+100' : '−10'

  return (
    <div ref={overlayRef} className={`result-overlay ${resultClass}`} aria-live="polite">
      <div className="result-overlay__card">
        {isCorrect && (
          <div className="result-overlay__content">
            <div className="result-overlay__title">🎯 TARGET DESTROYED!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
          </div>
        )}
        {isWrong && (
          <div className="result-overlay__content">
            <div className="result-overlay__title">⚠️ WRONG TARGET!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
            <div className="result-overlay__correct-reveal">
              Correct: <strong>{currentQuestion?.answer}</strong>
            </div>
          </div>
        )}
        {isMiss && (
          <div className="result-overlay__content">
            <div className="result-overlay__title">❌ TARGET MISSED!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
            <div className="result-overlay__correct-reveal">
              Correct: <strong>{currentQuestion?.answer}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
