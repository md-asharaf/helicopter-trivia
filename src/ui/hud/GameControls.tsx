import { useGameState, useGameDispatch } from '@/game/GameContext'
import { audioManager } from '@/audio/AudioManager'

export function GameControls() {
  const state = useGameState()
  const dispatch = useGameDispatch()

  const click = () => audioManager.play('uiClick')

  const handlePause = () => {
    click()
    if (state.phase === 'paused') {
      dispatch({ type: 'RESUME' })
    } else if (state.phase === 'playing' || state.phase === 'bombing') {
      dispatch({ type: 'PAUSE' })
    }
  }

  const handleMute = () => {
    click()
    dispatch({ type: 'TOGGLE_MUTE' })
  }

  const handleHint = () => {
    click()
    dispatch({ type: 'SHOW_HINT_CONFIRM' })
  }

  const isGameActive = state.phase === 'playing' || state.phase === 'bombing' ||
    state.phase === 'paused' || state.phase === 'resolving'

  return (
    <div className="game-controls" role="toolbar" aria-label="Game controls">
      <button
        className="ctrl-btn"
        onClick={handlePause}
        aria-label={state.phase === 'paused' ? 'Resume game' : 'Pause game'}
        title={state.phase === 'paused' ? 'Resume (P)' : 'Pause (P)'}
        disabled={!isGameActive}
      >
        {state.phase === 'paused' ? '▶' : '⏸'}
      </button>

      <button
        className="ctrl-btn"
        onClick={handleMute}
        aria-label={state.muted ? 'Unmute audio' : 'Mute audio'}
        title={state.muted ? 'Unmute (M)' : 'Mute (M)'}
      >
        {state.muted ? '🔇' : '🔊'}
      </button>

      <button
        className="ctrl-btn"
        onClick={handleHint}
        aria-label="Use hint"
        title="Hint (H)"
        disabled={state.phase !== 'playing' && state.phase !== 'bombing'}
      >
        💡
      </button>
    </div>
  )
}
