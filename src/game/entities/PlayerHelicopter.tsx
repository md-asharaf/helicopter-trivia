import { useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { HelicopterMesh } from './HelicopterMesh'
import { inputManager } from '@/controls/InputManager'

export interface PlayerHelicopterHandle {
  getWorldPosition: () => THREE.Vector3
  getWorldQuaternion: () => THREE.Quaternion
  getVelocity: () => THREE.Vector3
}

interface PlayerHelicopterProps {
  paused: boolean
}

/**
 * Player High-Altitude Chase Helicopter.
 * Full 3D Flight Freedom:
 * - High altitude climb (up to y = 36) down to treetop skimming (y = 4)
 * - Dynamic pitch, roll/bank, and yaw based on climb/dive and turns.
 */
export const PlayerHelicopter = forwardRef<PlayerHelicopterHandle, PlayerHelicopterProps>(
  function PlayerHelicopter({ paused }, ref) {
    const groupRef = useRef<THREE.Group>(null)
    const posX = useRef(0)
    const posY = useRef(20)
    const bankAngle = useRef(0)
    const pitchAngle = useRef(0)

    useImperativeHandle(ref, () => ({
      getWorldPosition: () => {
        const pos = new THREE.Vector3()
        groupRef.current?.getWorldPosition(pos)
        return pos
      },
      getWorldQuaternion: () => {
        const q = new THREE.Quaternion()
        groupRef.current?.getWorldQuaternion(q)
        return q
      },
      getVelocity: () => new THREE.Vector3(0, 0, 0),
    }))

    useFrame((state, delta) => {
      if (!groupRef.current || paused) return

      // Update aim delta
      inputManager.updateAimWithDelta(delta)

      const { yaw, pitch } = inputManager.getAimAngles()
      const move = inputManager.getMovement()

      // Target X position tracks aim X smoothly across chase lanes (-26 to +26)
      const targetX = -inputManager.aimX * 24.0

      // Target Y position allows full high-altitude climb (up to 36) down to treetop skimming (3.5)
      // Combines mouse/aim Y + keyboard Shift/Ctrl/W/S movement and touch joystick
      const aimHeightOffset = inputManager.aimY * 12.0
      const keyAltitudeBonus = move.y * 8.0 + (move.z < 0 ? 4.0 : move.z > 0 ? -4.0 : 0)
      const baseAlt = 18.0

      const targetY = THREE.MathUtils.clamp(
        baseAlt + aimHeightOffset + keyAltitudeBonus,
        3.5,
        36.0
      )

      // Smooth flight maneuvering
      posX.current = THREE.MathUtils.lerp(posX.current, targetX, delta * 5.5)
      posY.current = THREE.MathUtils.lerp(posY.current, targetY, delta * 5.0)

      // Speed banking based on lateral movement
      const moveDeltaX = (targetX - posX.current)
      const targetBank = THREE.MathUtils.clamp(-moveDeltaX * 0.07 - yaw * 0.35, -0.65, 0.65)
      bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, delta * 8.0)

      // Dynamic Climb / Dive Pitch
      const climbDeltaY = (targetY - posY.current)
      const targetPitch = 0.12 - climbDeltaY * 0.08 + pitch * 0.15
      pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, targetPitch, delta * 6.0)

      // Natural flight turbulence bobbing
      const t = state.clock.getElapsedTime()
      const bobbing = Math.sin(t * 3.2) * 0.14

      groupRef.current.position.set(posX.current, posY.current + bobbing, 0)

      // Rotate: Pitch down forward/up in climb, Yaw towards aim, Roll/Bank into turns
      groupRef.current.rotation.set(
        -pitchAngle.current,
        yaw * 0.75,
        bankAngle.current
      )
    })

    return (
      <group ref={groupRef} position={[0, 20, 0]}>
        <HelicopterMesh isPlayer />
      </group>
    )
  }
)
