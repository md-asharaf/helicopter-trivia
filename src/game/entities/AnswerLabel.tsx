import { Html } from '@react-three/drei'

interface AnswerLabelProps {
  optionIndex: number
  isCrashing: boolean
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

/**
 * Tactical 3D Target Marker above each enemy helicopter.
 * Displays clean [ A ], [ B ], [ C ], [ D ] military callout badge.
 */
export function AnswerLabel({ optionIndex, isCrashing }: AnswerLabelProps) {
  const letter = OPTION_LETTERS[optionIndex] ?? String(optionIndex + 1)

  return (
    <Html
      center
      position={[0, 3.2, 0]}
      distanceFactor={18}
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={`target-callout-badge ${isCrashing ? 'target-callout-badge--crashing' : ''}`}
        aria-label={`Target Option ${letter}`}
      >
        <span className="target-callout-badge__reticle">⊕</span>
        <span className="target-callout-badge__letter">{letter}</span>
      </div>
    </Html>
  )
}
