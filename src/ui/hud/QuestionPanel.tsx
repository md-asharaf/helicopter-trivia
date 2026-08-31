import { useGameState } from '@/game/GameContextCore'

export function QuestionPanel() {
  const state = useGameState()
  const currentQuestion = state.questions[state.currentQuestionIndex]
  const total = state.questions.length

  if (!currentQuestion) return null

  return (
    <div className="question-panel" aria-label="Current question">
      <div className="question-counter">
        <span className="question-counter__label">QUESTION</span>
        <span className="question-counter__value">
          {state.currentQuestionIndex + 1} / {total}
        </span>
      </div>
      <p className="question-text" aria-live="polite">
        {currentQuestion.prompt}
      </p>
      <div className="question-panel__tip">
        AIM with Mouse / Keys • Press SPACE or Click to Throw Bomb
      </div>
    </div>
  )
}
