import { useRef, useCallback, useEffect } from 'react'
import { inputManager } from '@/controls/InputManager'

interface JoystickState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface VirtualJoystickProps {
  onFirePress?: () => void
}

export function VirtualJoystick({ onFirePress }: VirtualJoystickProps) {
  const joystickState = useRef<JoystickState>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })
  const knobRef = useRef<HTMLDivElement>(null)

  const JOYSTICK_RADIUS = 45

  // Reset touch movement on unmount
  useEffect(() => {
    return () => {
      inputManager.setTouchMovement({ x: 0, y: 0, z: 0 })
    }
  }, [])

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const js = joystickState.current
    const dx = clientX - js.startX
    const dy = clientY - js.startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const clamped = Math.min(dist, JOYSTICK_RADIUS)
    const angle = Math.atan2(dy, dx)
    const cx = Math.cos(angle) * clamped
    const cy = Math.sin(angle) * clamped

    js.currentX = cx
    js.currentY = cy

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${cx}px, ${cy}px)`
    }

    inputManager.setTouchMovement({
      x: cx / JOYSTICK_RADIUS,
      y: 0,
      z: dy / JOYSTICK_RADIUS,
    })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    joystickState.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: 0,
      currentY: 0,
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (!joystickState.current.active) return
    const touch = e.touches[0]
    updateJoystick(touch.clientX, touch.clientY)
  }, [updateJoystick])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    joystickState.current.active = false
    joystickState.current.currentX = 0
    joystickState.current.currentY = 0

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)'
    }

    inputManager.setTouchMovement({ x: 0, y: 0, z: 0 })
  }, [])

  const handleFireTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    inputManager.touchFire()
    onFirePress?.()
  }, [onFirePress])

  return (
    <div className="virtual-controls" aria-label="Mobile Touch Controls">
      {/* Virtual Joystick for Aim & Flight */}
      <div
        className="joystick-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="region"
        aria-label="Flight steering joystick"
      >
        <div className="joystick-base">
          <div className="joystick-ring" />
          <div ref={knobRef} className="joystick-knob" />
          <div className="joystick-arrows">
            <span className="arrow arrow-up">▲</span>
            <span className="arrow arrow-down">▼</span>
            <span className="arrow arrow-left">◀</span>
            <span className="arrow arrow-right">▶</span>
          </div>
        </div>
        <span className="joystick-label">AIM / FLIGHT</span>
      </div>

      {/* Tactile Grenade Drop Button */}
      <div className="fire-area">
        <button
          className="fire-button"
          onTouchStart={handleFireTouch}
          aria-label="Drop bomb grenade"
        >
          <span className="fire-icon">💣</span>
          <span className="fire-label">LAUNCH</span>
        </button>
      </div>
    </div>
  )
}
