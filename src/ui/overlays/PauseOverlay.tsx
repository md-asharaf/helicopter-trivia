import { useGameDispatch } from '@/game/GameContext'
import { audioManager } from '@/audio/AudioManager'
import { Modal } from './Modal'

export function PauseOverlay() {
  const dispatch = useGameDispatch()

  const click = () => audioManager.play('uiClick')

  return (
    <Modal
      title="MISSION PAUSED"
      description="Your mission is on hold."
      primaryAction={{
        label: '▶ RESUME',
        onClick: () => { click(); dispatch({ type: 'RESUME' }) },
      }}
      secondaryAction={{
        label: '↺ RESTART MISSION',
        onClick: () => { click(); dispatch({ type: 'REQUEST_CONFIRM', action: 'restart' }) },
        variant: 'secondary',
      }}
      tertiaryAction={{
        label: '🏠 MAIN MENU',
        onClick: () => { click(); dispatch({ type: 'GO_TO_MAIN_MENU' }) },
        variant: 'secondary',
      }}
    />
  )
}
