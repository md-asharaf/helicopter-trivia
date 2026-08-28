import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameState } from '@/game/GameContext'

/**
 * Debug overlay — only renders when VITE_GAME_DEBUG=true.
 * Vite tree-shakes this in production builds.
 */
export function DebugOverlay() {
  if (import.meta.env.VITE_GAME_DEBUG !== 'true') return null
  return <DebugContent />
}

function DebugContent() {
  const state = useGameState()
  const fpsRef = useRef<HTMLDivElement>(null)
  const lastTime = useRef(performance.now())
  const frames = useRef(0)

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - lastTime.current >= 500) {
      const fps = Math.round((frames.current * 1000) / (now - lastTime.current))
      if (fpsRef.current) fpsRef.current.textContent = `FPS: ${fps}`
      frames.current = 0
      lastTime.current = now
    }
  })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        background: 'rgba(0,0,0,0.8)',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: 11,
        padding: '8px 12px',
        borderRadius: 4,
        zIndex: 9999,
        pointerEvents: 'none',
        lineHeight: 1.6,
      }}
    >
      <div ref={fpsRef}>FPS: --</div>
      <div>Phase: {state.phase}</div>
      <div>Q: {state.currentQuestionIndex + 1}/{state.questions.length}</div>
      <div>Session: {state.questionSessionId.slice(0, 8)}...</div>
      <div>Score: {state.score}</div>
      <div>Streak: {state.streak}</div>
      <div>
        Options:{' '}
        {state.currentOptions
          .map((o) => `${o.optionText}(${o.isCorrect ? '✓' : '✗'})`)
          .join(', ')}
      </div>
    </div>
  )
}
