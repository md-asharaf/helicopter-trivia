import { Html } from '@react-three/drei'

interface AnswerLabelProps {
  optionText: string
  optionIndex: number
  isCrashing: boolean
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

/**
 * Billboard HTML label above each enemy helicopter.
 * Uses drei <Html> for auto camera-facing without manual quaternion math.
 */
export function AnswerLabel({ optionText, optionIndex, isCrashing }: AnswerLabelProps) {
  const letter = OPTION_LETTERS[optionIndex] ?? String(optionIndex + 1)

  return (
    <Html
      center
      position={[0, 2.4, 0]}
      distanceFactor={12}
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={`answer-label ${isCrashing ? 'answer-label--crashing' : ''}`}
        aria-label={`Answer option ${letter}: ${optionText}`}
      >
        <span className="answer-label__letter">{letter}</span>
        <span className="answer-label__text">{optionText}</span>
      </div>
    </Html>
  )
}
