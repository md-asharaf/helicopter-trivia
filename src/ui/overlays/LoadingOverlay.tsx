import { useEffect, useRef, useState } from 'react'

const LOADING_STEPS = [
  'Decrypting mission intelligence...',
  'Loading aircraft systems...',
  'Calculating flight paths...',
  'Arming ordnance...',
  'Mission ready.',
]

export function LoadingOverlay() {
  const [currentStep, setCurrentStep] = useState(0)
  const [dotCount, setDotCount] = useState(0)
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    stepTimer.current = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 600)
    dotTimer.current = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4)
    }, 400)
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current)
      if (dotTimer.current) clearInterval(dotTimer.current)
    }
  }, [])

  const dots = '.'.repeat(dotCount)

  return (
    <div className="loading-overlay" aria-label="Loading game">
      <div className="loading-container">
        <div className="loading-radar">
          <div className="loading-radar__sweep" />
          <div className="loading-radar__ring loading-radar__ring--1" />
          <div className="loading-radar__ring loading-radar__ring--2" />
          <div className="loading-radar__ring loading-radar__ring--3" />
          <div className="loading-radar__center" />
        </div>

        <div className="loading-title">PREPARING MISSION{dots}</div>

        <div className="loading-steps">
          {LOADING_STEPS.slice(0, currentStep + 1).map((step, i) => (
            <div
              key={step}
              className={`loading-step ${i === currentStep ? 'loading-step--active' : 'loading-step--done'}`}
            >
              {i < currentStep ? '✓' : '›'} {step}
            </div>
          ))}
        </div>

        <div className="loading-bar">
          <div
            className="loading-bar__fill"
            style={{
              width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
