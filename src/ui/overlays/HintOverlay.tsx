import { useGameState, useGameDispatch } from '@/game/GameContextCore'
import { audioManager } from '@/audio/AudioManager'
import { Modal } from './Modal'

export function HintOverlay() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const click = () => audioManager.play('uiClick')

  const currentQuestion = state.questions[state.currentQuestionIndex]

  // Step 1: Show confirmation
  if (state.hintConfirmVisible && !state.hintVisible) {
    return (
      <Modal
        title="USE HINT?"
        description="Are you sure you want to reveal the hint?"
        primaryAction={{
          label: '💡 USE HINT',
          onClick: () => { click(); dispatch({ type: 'CONFIRM_HINT' }) },
        }}
        secondaryAction={{
          label: '← CANCEL',
          onClick: () => { click(); dispatch({ type: 'HIDE_HINT' }) },
          variant: 'secondary',
        }}
      />
    )
  }

  // Step 2: Show hint text
  if (state.hintVisible && currentQuestion) {
    return (
      <Modal
        title="💡 HINT"
        primaryAction={{
          label: '✓ GOT IT',
          onClick: () => { click(); dispatch({ type: 'HIDE_HINT' }) },
        }}
      >
        <p className="hint-text">{currentQuestion.hint}</p>
      </Modal>
    )
  }

  return null
}
