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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    target.setPointerCapture(e.pointerId)
    joystickState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: 0,
      currentY: 0,
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    if (!joystickState.current.active) return
    updateJoystick(e.clientX, e.clientY)
  }, [updateJoystick])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    target.releasePointerCapture(e.pointerId)
    joystickState.current.active = false
    joystickState.current.currentX = 0
    joystickState.current.currentY = 0

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)'
    }

    inputManager.setTouchMovement({ x: 0, y: 0, z: 0 })
  }, [])

  return (
    <div className="virtual-controls" aria-label="Mobile Touch Controls">
      {/* Virtual Joystick for Flight */}
      <div
        className="joystick-area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="region"
        aria-label="Flight steering joystick"
        style={{ touchAction: 'none' }}
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
        <span className="joystick-label">FLIGHT</span>
      </div>

      {/* Combat Controls (Aiming & Fire) */}
      <div className="combat-controls">
        <button
          className="fire-button"
          onClick={(e) => {
            e.stopPropagation();
            inputManager.touchFire();
            if (onFirePress) onFirePress();
          }}
          aria-label="Launch Grenade"
        >
          <span className="fire-icon">💣</span>
          <span className="fire-label">FIRE</span>
        </button>
      </div>
    </div>
  )
}
