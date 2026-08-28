import { useEffect, useRef } from 'react'
import { useGameState, useGameDispatch } from '@/game/GameContext'

/**
 * Animated result overlay — slides in after bomb resolution.
 * Shows correct/wrong/miss with score delta and streak.
 * Automatically advances to NEXT_QUESTION and provides an instant Continue button.
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
    }
  }, [isResolving, state.lastResult])

  // Automatically advance to next question
  useEffect(() => {
    if (!isResolving) return

    const duration = isCorrect ? 2000 : 2800
    const timer = setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' })
    }, duration)

    return () => clearTimeout(timer)
  }, [isResolving, isCorrect, dispatch, state.currentQuestionIndex])

  if (!isResolving || !state.lastResult) return null

  const currentQuestion = state.questions[state.currentQuestionIndex]

  const resultClass = isCorrect
    ? 'result-overlay--correct'
    : isWrong
      ? 'result-overlay--wrong'
      : 'result-overlay--miss'

  const delta = isCorrect ? '+100' : '−10'

  const handleContinue = () => {
    dispatch({ type: 'NEXT_QUESTION' })
  }

  return (
    <div ref={overlayRef} className={`result-overlay ${resultClass}`} aria-live="polite">
      <div className="result-overlay__card">
        {isCorrect && (
          <>
            <div className="result-overlay__title">TARGET DESTROYED!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
            {state.streak > 1 && (
              <div className="result-overlay__streak">🔥 STREAK × {state.streak}</div>
            )}
          </>
        )}
        {isWrong && (
          <>
            <div className="result-overlay__title">WRONG TARGET!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
            <div className="result-overlay__correct-reveal">
              Correct Answer:<br />
              <strong>{currentQuestion?.answer}</strong>
            </div>
          </>
        )}
        {isMiss && (
          <>
            <div className="result-overlay__icon">◎</div>
            <div className="result-overlay__title">TARGET MISSED!</div>
            <div className="result-overlay__delta">{delta} PTS</div>
            <div className="result-overlay__correct-reveal">
              Correct Answer:<br />
              <strong>{currentQuestion?.answer}</strong>
            </div>
          </>
        )}

        {/* Instant advance button */}
        <button
          className="modal-btn modal-btn--primary"
          style={{ marginTop: '16px', padding: '8px 20px', fontSize: '11px', width: 'auto', marginInline: 'auto' }}
          onClick={handleContinue}
          autoFocus
        >
          NEXT QUESTION ➔
        </button>
      </div>
    </div>
  )
}
