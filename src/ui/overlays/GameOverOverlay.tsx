import { useEffect, useRef } from 'react'
import { useGameState, useGameDispatch } from '@/game/GameContext'
import { audioManager } from '@/audio/AudioManager'
import { fetchQuiz } from '@/api/quizApi'

export function GameOverOverlay() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const hasPlayedSound = useRef(false)

  useEffect(() => {
    if (state.phase === 'game-over' && !hasPlayedSound.current) {
      hasPlayedSound.current = true
      setTimeout(() => audioManager.play('gameComplete'), 500)
    }
    if (state.phase !== 'game-over') {
      hasPlayedSound.current = false
    }
  }, [state.phase])

  if (state.phase !== 'game-over') return null

  const totalQuestions = state.questions.length
  const accuracy = totalQuestions > 0
    ? Math.round((state.correctCount / totalQuestions) * 100)
    : 0

  const handlePlayAgain = async () => {
    audioManager.play('uiClick')
    dispatch({ type: 'QUIZ_LOADING' })
    try {
      const questions = await fetchQuiz()
      dispatch({ type: 'QUIZ_LOADED', questions })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: (err as Error).message })
    }
  }

  const handleMainMenu = () => {
    audioManager.play('uiClick')
    dispatch({ type: 'GO_TO_MAIN_MENU' })
  }

  return (
    <div className="gameover-overlay" aria-label="Mission complete screen">
      <div className="gameover-container">
        <div className="gameover-header">
          <div className="gameover-title">MISSION COMPLETE</div>
          <div className="gameover-subtitle">Debrief Report</div>
        </div>

        <div className="gameover-score">
          <span className="gameover-score__number">{state.score}</span>
          <span className="gameover-score__label">TOTAL SCORE</span>
        </div>

        <div className="gameover-stats">
          <div className="stat-card">
            <span className="stat-card__value">{accuracy}%</span>
            <span className="stat-card__label">ACCURACY</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">🔥 {state.bestStreak}</span>
            <span className="stat-card__label">BEST STREAK</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{state.correctCount}/{totalQuestions}</span>
            <span className="stat-card__label">CORRECT</span>
          </div>
        </div>

        <div className="gameover-actions">
          <button
            className="gameover-btn gameover-btn--primary"
            onClick={handlePlayAgain}
            aria-label="Play again"
          >
            ↺ PLAY AGAIN
          </button>
          <button
            className="gameover-btn gameover-btn--secondary"
            onClick={handleMainMenu}
            aria-label="Return to main menu"
          >
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}
