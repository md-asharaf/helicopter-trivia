import { useGameState } from '@/game/GameContext'
import { QuestionPanel } from './QuestionPanel'
import { OptionsPanel } from './OptionsPanel'
import { ScoreDisplay } from './ScoreDisplay'
import { StreakDisplay } from './StreakDisplay'
import { GameControls } from './GameControls'

/**
 * HUD container — absolute positioned over the 3D canvas.
 * Only visible during active gameplay phases.
 */
export function HUD() {
  const state = useGameState()

  const isVisible =
    state.phase === 'playing' ||
    state.phase === 'bombing' ||
    state.phase === 'resolving' ||
    state.phase === 'paused' ||
    state.phase === 'hint'

  if (!isVisible) return null

  return (
    <div className="hud" role="region" aria-label="Game HUD">
      {/* Top bar */}
      <div className="hud__top">
        <QuestionPanel />
        <div className="hud__top-right">
          <ScoreDisplay />
          <GameControls />
        </div>
      </div>

      {/* Bottom left: streak */}
      <div className="hud__bottom-left">
        <StreakDisplay />
      </div>

      {/* Aiming reticle */}
      <div className="hud__reticle" aria-hidden="true">
        <div className="reticle-outer" />
        <div className="reticle-inner" />
        <div className="reticle-cross reticle-cross--h" />
        <div className="reticle-cross reticle-cross--v" />
      </div>

      {/* Dedicated Tactical 4-Option HUD Board */}
      <OptionsPanel />

      {/* Controls hint */}
      <div className="hud__controls-hint" aria-label="Control hints">
        <span>W / S Fly</span>
        <span>A / D Turn</span>
        <span>SHIFT / CTRL Altitude</span>
        <span>SPACE Drop Bomb</span>
        <span>P Pause</span>
      </div>
    </div>
  )
}
