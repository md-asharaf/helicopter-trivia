import { useEffect } from 'react'
import { GameProvider, useGameState, useGameDispatch } from '@/game/GameContext'
import { GameScene } from '@/game/scene/GameScene'
import { HUD } from '@/ui/hud/HUD'
import { PauseOverlay } from '@/ui/overlays/PauseOverlay'
import { HintOverlay } from '@/ui/overlays/HintOverlay'
import { ConfirmationModal } from '@/ui/overlays/ConfirmationModal'
import { ResultOverlay } from '@/ui/overlays/ResultOverlay'
import { GameOverOverlay } from '@/ui/overlays/GameOverOverlay'
import { LoadingOverlay } from '@/ui/overlays/LoadingOverlay'
import { ErrorOverlay } from '@/ui/overlays/ErrorOverlay'
import { RotateDeviceOverlay } from '@/ui/overlays/RotateDeviceOverlay'
import { VirtualJoystick } from '@/controls/VirtualJoystick'
import { fetchQuiz } from '@/api/quizApi'
import { audioManager } from '@/audio/AudioManager'
import { inputManager } from '@/controls/InputManager'

function AppInner() {
  const state = useGameState()
  const dispatch = useGameDispatch()

  // Init audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      audioManager.init()
      window.removeEventListener('pointerdown', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
    window.addEventListener('pointerdown', initAudio, { once: true })
    window.addEventListener('keydown', initAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [])

  // Auto-pause when tab loses focus or becomes hidden
  useEffect(() => {
    const handleVisibilityOrBlur = () => {
      if (document.hidden) {
        if (state.phase === 'playing' || state.phase === 'bombing') {
          dispatch({ type: 'PAUSE' })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrBlur)
    window.addEventListener('blur', handleVisibilityOrBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur)
      window.removeEventListener('blur', handleVisibilityOrBlur)
    }
  }, [state.phase, dispatch])

  // Start game — fetch quiz only on user click
  const handleStartGame = async () => {
    audioManager.init()
    audioManager.play('uiClick')
    dispatch({ type: 'QUIZ_LOADING' })
    try {
      const questions = await fetchQuiz()
      dispatch({ type: 'QUIZ_LOADED', questions })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: (err as Error).message })
    }
  }

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isOverlayOpen =
    state.phase === 'paused' ||
    state.phase === 'resolving' ||
    state.phase === 'game-over' ||
    state.phase === 'ready' ||
    state.phase === 'loading' ||
    state.phase === 'error' ||
    state.phase === 'hint' ||
    state.hintConfirmVisible ||
    state.hintVisible ||
    state.confirmPending !== null

  // Lock input globally whenever any overlay is open
  useEffect(() => {
    inputManager.setPaused(isOverlayOpen)
  }, [isOverlayOpen])

  const showMobileControls = isTouch && (state.phase === 'playing' || state.phase === 'bombing') && !isOverlayOpen

  return (
    <div id="game-root">
      {/* 3D Scene — mounted once mission starts */}
      {state.phase !== 'ready' && state.phase !== 'loading' && state.phase !== 'error' && (
        <GameScene />
      )}

      {/* Loading */}
      {state.phase === 'loading' && <LoadingOverlay />}

      {/* Error */}
      {state.phase === 'error' && state.errorMessage && (
        <ErrorOverlay message={state.errorMessage} />
      )}

      {/* Ready / Start screen */}
      {state.phase === 'ready' && (
        <div className="start-screen">
          <div className="start-screen__container">
            <div className="start-screen__badge">CLASSIFIED AIR MISSION</div>
            <h1 className="start-screen__title">HELICOPTER<br />TRIVIA</h1>
            <p className="start-screen__subtitle">
              Pilot your helicopter. Aim your grenade trajectory.<br />
              Drop bombs on the correct answers to destroy the enemy convoy.
            </p>
            <div className="start-screen__instructions">
              <div className="instruction-item">
                <span className="instruction-icon">🎯</span>
                <span><strong>MOUSE / A / D</strong> Aim & Lock Target Helicopter</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">💣</span>
                <span><strong>SPACE / CLICK</strong> Launch Grenade at Locked Target</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🚁</span>
                <span><strong>W / S / A / D</strong> Maneuver Helicopter Pursuit</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">💡</span>
                <span><strong>H</strong> Request Intel Hint (Costs 50 Pts)</span>
              </div>
            </div>
            <button
              className="start-btn"
              onClick={handleStartGame}
              aria-label="Start the game"
            >
              ▶ START MISSION
            </button>
            <div className="start-screen__questions">
              TOP SECRET TACTICAL AIR TRIVIA
            </div>
          </div>
        </div>
      )}

      {/* In-game HUD */}
      <HUD />

      {/* Result feedback overlay */}
      <ResultOverlay />

      {/* Pause overlay */}
      {state.phase === 'paused' && !state.confirmPending && <PauseOverlay />}

      {/* Confirmation modals */}
      {state.confirmPending && <ConfirmationModal action={state.confirmPending} />}

      {/* Hint overlay */}
      {(state.hintConfirmVisible || state.hintVisible) && <HintOverlay />}

      {/* Game over */}
      <GameOverOverlay />

      {/* Mobile controls */}
      {showMobileControls && <VirtualJoystick />}

      {/* Rotate device (portrait mobile) */}
      <RotateDeviceOverlay />

      {/* Debug overlay (dev only) */}
      {import.meta.env.VITE_GAME_DEBUG === 'true' && (
        <div id="debug-mount" />
      )}
    </div>
  )
}

export function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  )
}
