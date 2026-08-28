import * as THREE from 'three'

/**
 * High-performance centralized input manager.
 * Supports WASD/Arrow keys, Mouse Aiming, and Touch Virtual Joystick.
 * When paused (e.g. during any overlay or modal), all inputs, movements, and firing are strictly blocked.
 */
class InputManager {
  private keys: Record<string, boolean> = {}
  private paused: boolean = false
  private firePending: boolean = false
  private pausePending: boolean = false
  private hintPending: boolean = false
  private mutePending: boolean = false
  private touchMove = { x: 0, y: 0, z: 0 }

  // Normalized aim angles: -1 (far left) to +1 (far right)
  public aimX: number = 0
  public aimY: number = 0

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
    }

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false
    }

    const onMouseMove = (e: MouseEvent) => {
      if (this.paused) return
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (1 - e.clientY / window.innerHeight - 0.5) * 2

      this.aimX = Math.max(-1, Math.min(1, nx * 1.2))
      this.aimY = Math.max(-0.6, Math.min(1, ny * 1.2))
    }

    const onMouseDown = (e: MouseEvent) => {
      if (this.paused) return
      const target = e.target as HTMLElement
      if (
        !target ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('.modal-backdrop') ||
        target.closest('.modal-container') ||
        target.closest('.result-overlay') ||
        target.closest('.gameover-overlay') ||
        target.closest('.start-screen') ||
        target.closest('.loading-overlay') ||
        target.closest('.error-overlay')
      ) {
        return
      }
      if (e.button === 0) {
        this.firePending = true
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)

    this.boundHandlers.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('mousemove', onMouseMove),
      () => window.removeEventListener('mousedown', onMouseDown)
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
    this.touchMove = { x: 0, y: 0, z: 0 }
    this.aimX = 0
    this.aimY = 0
  }

  updateAimWithDelta(delta: number): void {
    if (this.paused) return
    // Keyboard continuous aiming
    const speed = 2.4 * delta
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

  // --- Flight Movement ---
  getMovement(): THREE.Vector3 {
    if (this.paused) return new THREE.Vector3(0, 0, 0)

    const move = new THREE.Vector3(0, 0, 0)

    // Keyboard X: Left / Right
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) move.x -= 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) move.x += 1

    // Keyboard Y: Rise / Descend (Shift/Ctrl or E/Q)
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyE']) move.y += 1
    if (this.keys['ControlLeft'] || this.keys['ControlRight'] || this.keys['KeyQ']) move.y -= 1

    // Keyboard Z: Forward / Backward (W / S)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) move.z -= 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.z += 1

    // Add touch joystick movement
    move.x += this.touchMove.x
    move.y += this.touchMove.y
    move.z += this.touchMove.z

    if (move.lengthSq() > 1) {
      move.normalize()
    }

    return move
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
