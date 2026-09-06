import * as THREE from 'three'
import { audioManager } from '@/audio/AudioManager'

const TARGET_X_MAP = [-19, -6.5, 6.5, 19]

/**
 * Unified High-Performance Multi-Input Manager (SKILL.md Law 6).
 * Handles Keyboard (WASD, Arrows, 1/2/3/4, Space, Shift/Ctrl), Mouse Aim, and Touch Joysticks.
 * Zero-allocation in frame queries using pre-allocated scratch objects.
 */
class InputManager {
  private keys: Record<string, boolean> = {}
  private paused: boolean = false
  private firePending: boolean = false
  private pausePending: boolean = false
  private hintPending: boolean = false
  private mutePending: boolean = false
  private directSelectPending: number | null = null
  private touchMove = { x: 0, y: 0, z: 0 }
  private scratchMove = new THREE.Vector3()

  // Normalized aim angles: -1 (far left) to +1 (far right)
  public aimX: number = 0
  public aimY: number = 0
  public flightX: number = 0

  setAim(aimX: number, aimY: number): void {
    this.aimX = Math.max(-1, Math.min(1, aimX))
    this.aimY = Math.max(-0.6, Math.min(1, aimY))
  }

  setDirectTargetIndex(idx: number): void {
    if (idx >= 0 && idx < TARGET_X_MAP.length) {
      const targetX = TARGET_X_MAP[idx]
      this.setAim(-targetX / 22, this.aimY)
      audioManager.play('lockOn')
    }
  }

  private boundHandlers: Array<() => void> = []

  attach(): void {
    this.detach()

    const onKeyDown = (e: KeyboardEvent) => {
      if (this.paused) {
        if (e.code === 'Space') e.preventDefault()
        return
      }
      this.keys[e.code] = true

      if (e.code === 'Space') {
        e.preventDefault()
        this.firePending = true
      }
      if (e.code === 'KeyP' || e.code === 'Escape') this.pausePending = true
      if (e.code === 'KeyH') this.hintPending = true
      if (e.code === 'KeyM') this.mutePending = true

      // Number keys 1, 2, 3, 4 for direct option target locking
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        this.setDirectTargetIndex(0)
        this.directSelectPending = 0
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        this.setDirectTargetIndex(1)
        this.directSelectPending = 1
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        this.setDirectTargetIndex(2)
        this.directSelectPending = 2
      } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
        this.setDirectTargetIndex(3)
        this.directSelectPending = 3
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    this.boundHandlers.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp)
    )
  }

  detach(): void {
    this.boundHandlers.forEach((fn) => fn())
    this.boundHandlers = []
    this.reset()
  }

  setVirtualKey(code: string, isPressed: boolean): void {
    if (this.paused) return
    this.keys[code] = isPressed
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (paused) {
      this.reset()
    }
  }

  isPaused(): boolean {
    return this.paused
  }

  reset(): void {
    this.keys = {}
    this.firePending = false
    this.pausePending = false
    this.hintPending = false
    this.mutePending = false
    this.directSelectPending = null
    this.touchMove = { x: 0, y: 0, z: 0 }
    this.aimX = 0
    this.aimY = 0
    this.flightX = 0
  }

  updateAimWithDelta(delta: number): void {
    if (this.paused) return
    const dt = Math.min(delta, 0.1)
    const speed = 2.6 * dt

    // Note: X-axis is inverted in the 3D space (Positive aimX/flightX = Left, Negative = Right)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.aimX = Math.min(1, this.aimX + speed)
      this.flightX = Math.min(1, this.flightX + speed)
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.aimX = Math.max(-1, this.aimX - speed)
      this.flightX = Math.max(-1, this.flightX - speed)
    }
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.aimY = Math.min(1, this.aimY + speed)
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.aimY = Math.max(-0.6, this.aimY - speed)
    }

    // Smooth velocity-based flight movement via Virtual Joystick
    if (Math.abs(this.touchMove.x) > 0.05) {
      const joystickSpeedX = 1.8 * dt; // Tuned sensitivity for smooth flight
      this.flightX = Math.max(-1, Math.min(1, this.flightX - this.touchMove.x * joystickSpeedX));
      this.aimX = this.flightX;
    }

    if (Math.abs(this.touchMove.z) > 0.05) {
      const joystickSpeedY = 1.8 * dt;
      this.aimY = Math.max(-0.6, Math.min(1, this.aimY - this.touchMove.z * joystickSpeedY));
    }
  }

  getAimAngles(): { yaw: number; pitch: number } {
    if (this.paused) return { yaw: 0, pitch: 0 }
    return {
      yaw: this.aimX * 0.45,
      pitch: this.aimY * 0.25,
    }
  }

  // --- Flight Movement (Zero-GC) ---
  getMovement(): THREE.Vector3 {
    this.scratchMove.set(0, 0, 0)
    if (this.paused) return this.scratchMove

    // Movement can only be done by joystick
    this.scratchMove.x += this.touchMove.x
    this.scratchMove.y += this.touchMove.y
    this.scratchMove.z += this.touchMove.z

    if (this.scratchMove.lengthSq() > 1) {
      this.scratchMove.normalize()
    }

    return this.scratchMove
  }

  // --- Actions ---
  consumeFire(): boolean {
    if (this.paused) {
      this.firePending = false
      return false
    }
    const val = this.firePending
    this.firePending = false
    return val
  }

  consumePause(): boolean {
    const val = this.pausePending
    this.pausePending = false
    return val
  }

  consumeHint(): boolean {
    if (this.paused) return false
    const val = this.hintPending
    this.hintPending = false
    return val
  }

  consumeMute(): boolean {
    const val = this.mutePending
    this.mutePending = false
    return val
  }

  consumeDirectSelect(): number | null {
    const val = this.directSelectPending
    this.directSelectPending = null
    return val
  }

  setTouchMovement(m: { x: number; y: number; z: number }): void {
    if (this.paused) {
      this.touchMove = { x: 0, y: 0, z: 0 }
      return
    }
    this.touchMove = m
  }

  touchFire(): void {
    if (this.paused) return
    this.firePending = true
  }
}

export const inputManager = new InputManager()
