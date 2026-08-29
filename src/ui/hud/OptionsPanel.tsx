import { useEffect, useState } from 'react'
import { useGameState } from '@/game/GameContext'
import { inputManager } from '@/controls/InputManager'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const TARGET_X_POSITIONS = [-19, -6.5, 6.5, 19]

export function OptionsPanel() {
  const state = useGameState()
  const [lockedIndex, setLockedIndex] = useState(1)

  const currentQuestion = state.questions[state.currentQuestionIndex]
  const options = currentQuestion?.options ?? []

  // Track closest aimed target to highlight the locked option card
  useEffect(() => {
    let animId: number
    const checkAim = () => {
      const rawAimX = -inputManager.aimX * 22
      let closest = 0
      let minDiff = 999
      TARGET_X_POSITIONS.forEach((x, idx) => {
        const diff = Math.abs(rawAimX - x)
        if (diff < minDiff) {
          minDiff = diff
          closest = idx
        }
      })
      setLockedIndex(closest)
      animId = requestAnimationFrame(checkAim)
    }
    animId = requestAnimationFrame(checkAim)
    return () => cancelAnimationFrame(animId)
  }, [])

  if (!currentQuestion || options.length === 0) return null

  const handleOptionClick = (idx: number) => {
    // Quick aim towards selected option
    const targetX = TARGET_X_POSITIONS[idx]
    inputManager.setAim(-targetX / 22, inputManager.aimY)
  }

  const handleLaunch = () => {
    inputManager.touchFire()
  }

  return (
    <div className="hud-options-panel" role="region" aria-label="Trivia Answer Options">
      {/* Target Lock Status & Desktop Launch Button */}
      <div className="hud-options-header">
        <div className="hud-options-header__target">
          <span className="hud-options-header__dot">●</span>
          TARGET: <strong>[ {OPTION_LETTERS[lockedIndex]} ] {options[lockedIndex]}</strong>
        </div>
        <button
          className="hud-launch-btn"
          onClick={handleLaunch}
          aria-label="Launch grenade at locked target"
        >
          <span className="hud-launch-btn__icon">💣</span>
          <span className="hud-launch-btn__text">LAUNCH GRENADE</span>
          <span className="hud-launch-btn__key">SPACE</span>
        </button>
      </div>

      <div className="hud-options-grid">
        {options.map((optText, idx) => {
          const letter = OPTION_LETTERS[idx]
          const isLocked = lockedIndex === idx
          return (
            <button
              key={idx}
              className={`hud-option-card ${isLocked ? 'hud-option-card--locked' : ''}`}
              onClick={() => handleOptionClick(idx)}
              title={optText}
              aria-label={`Option ${letter}: ${optText}`}
            >
              <div className="hud-option-card__badge">
                <span className="hud-option-card__letter">{letter}</span>
                {isLocked && <span className="hud-option-card__lock-icon">🎯</span>}
              </div>
              <div className="hud-option-card__text" title={optText}>
                {optText}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
