import { useGameDispatch } from '@/game/GameContext'
import { audioManager } from '@/audio/AudioManager'
import { Modal } from './Modal'

interface ConfirmationModalProps {
  action: 'restart' | 'newgame'
}

const COPY = {
  restart: {
    title: 'RESTART MISSION?',
    description: 'Your current progress will be lost.',
    primary: '↺ RESTART',
  },
  newgame: {
    title: 'START NEW MISSION?',
    description: 'A fresh quiz will be loaded. Current progress will be lost.',
    primary: '✦ NEW MISSION',
  },
}

export function ConfirmationModal({ action }: ConfirmationModalProps) {
  const dispatch = useGameDispatch()
  const copy = COPY[action]

  const click = () => audioManager.play('uiClick')

  const handleConfirm = () => {
    click()
    if (action === 'restart') {
      dispatch({ type: 'CONFIRM_RESTART' })
    } else {
      dispatch({ type: 'CONFIRM_NEW_GAME' })
    }
  }

  return (
    <Modal
      title={copy.title}
      description={copy.description}
      primaryAction={{
        label: copy.primary,
        onClick: handleConfirm,
        variant: 'danger',
      }}
      secondaryAction={{
        label: '← CANCEL',
        onClick: () => { click(); dispatch({ type: 'CANCEL_CONFIRM' }) },
        variant: 'secondary',
      }}
    />
  )
}
