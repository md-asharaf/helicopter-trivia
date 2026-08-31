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

    const onMouseMove = (e: MouseEvent) => {
      if (this.paused) return
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (1 - e.clientY / window.innerHeight - 0.5) * 2

      this.aimX = Math.max(-1, Math.min(1, nx * 1.25))
      this.aimY = Math.max(-0.6, Math.min(1, ny * 1.25))
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)

    this.boundHandlers.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('mousemove', onMouseMove)
    )
  }

  detach(): void {
    this.boundHandlers.forEach((fn) => fn())
    this.boundHandlers = []
    this.reset()
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
  }

  updateAimWithDelta(delta: number): void {
    if (this.paused) return
    const dt = Math.min(delta, 0.1)
    const speed = 2.6 * dt
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.aimX = Math.max(-1, this.aimX - speed)
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.aimX = Math.min(1, this.aimX + speed)
    }
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.aimY = Math.min(1, this.aimY + speed)
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.aimY = Math.max(-0.6, this.aimY - speed)
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

    // Keyboard X: Left / Right
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.scratchMove.x -= 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.scratchMove.x += 1

    // Keyboard Y: Rise / Descend (Shift/Ctrl or E/Q)
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyE']) this.scratchMove.y += 1
    if (this.keys['ControlLeft'] || this.keys['ControlRight'] || this.keys['KeyQ']) this.scratchMove.y -= 1

    // Keyboard Z: Forward / Backward (W / S)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.scratchMove.z -= 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.scratchMove.z += 1

    // Add touch joystick movement
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
    if (Math.abs(m.x) > 0.1) {
      this.aimX = Math.max(-1, Math.min(1, m.x * 1.4))
    }
  }

  touchFire(): void {
    if (this.paused) return
    this.firePending = true
  }
}

export const inputManager = new InputManager()
