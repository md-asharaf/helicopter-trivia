import { useState } from 'react'
import { useGameDispatch } from '@/game/GameContextCore'
import { fetchQuiz } from '@/api/quizApi'
import { audioManager } from '@/audio/AudioManager'

interface ErrorOverlayProps {
  message: string
}

export function ErrorOverlay({ message }: ErrorOverlayProps) {
  const dispatch = useGameDispatch()
  const [retrying, setRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = async () => {
    audioManager.init()
    audioManager.play('uiClick')
    setRetrying(true)
    setRetryCount((c) => c + 1)
    dispatch({ type: 'QUIZ_LOADING' })
    try {
      const questions = await fetchQuiz()
      dispatch({ type: 'QUIZ_LOADED', questions })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: (err as Error).message })
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="error-overlay" role="alert" aria-label="Mission aborted">
      <div className="error-container">
        <div className="error-icon">⚠</div>
        <h1 className="error-title">MISSION ABORTED</h1>
        <p className="error-subtitle">Unable to load intelligence data</p>
        <div className="error-message-box">
          <code className="error-message">{message}</code>
        </div>
        {retryCount > 0 && (
          <p className="error-retry-count">Attempt {retryCount + 1}</p>
        )}
        <button
          className="error-retry-btn"
          onClick={handleRetry}
          disabled={retrying}
          aria-label="Retry loading the quiz"
        >
          {retrying ? '⟳ CONNECTING...' : '↻ TRY AGAIN'}
        </button>
      </div>
    </div>
  )
}
