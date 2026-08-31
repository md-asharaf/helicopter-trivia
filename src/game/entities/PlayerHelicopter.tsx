import { useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { HelicopterMesh } from './HelicopterMesh'
import { inputManager } from '@/controls/InputManager'
import { audioManager } from '@/audio/AudioManager'

export interface PlayerHelicopterHandle {
  getWorldPosition: (out?: THREE.Vector3) => THREE.Vector3
  getWorldQuaternion: (out?: THREE.Quaternion) => THREE.Quaternion
  getVelocity: () => THREE.Vector3
}

interface PlayerHelicopterProps {
  paused: boolean
}

/**
 * Player High-Altitude Chase Helicopter (SKILL.md Law 2 & Law 3).
 * Full 3D Flight Maneuvers with Clamped Delta Time and Zero-GC vectors.
 */
export const PlayerHelicopter = forwardRef<PlayerHelicopterHandle, PlayerHelicopterProps>(
  function PlayerHelicopter({ paused }, ref) {
    const groupRef = useRef<THREE.Group>(null)
    const posX = useRef(0)
    const posY = useRef(20)
    const bankAngle = useRef(0)
    const pitchAngle = useRef(0)
    const scratchPos = useRef(new THREE.Vector3())
    const scratchQuat = useRef(new THREE.Quaternion())
    const scratchVel = useRef(new THREE.Vector3(0, 0, 0))

    useImperativeHandle(ref, () => ({
      getWorldPosition: (out = scratchPos.current) => {
        if (groupRef.current) {
          groupRef.current.getWorldPosition(out)
        } else {
          out.set(0, 20, 0)
        }
        return out
      },
      getWorldQuaternion: (out = scratchQuat.current) => {
        if (groupRef.current) {
          groupRef.current.getWorldQuaternion(out)
        } else {
          out.identity()
        }
        return out
      },
      getVelocity: () => scratchVel.current,
    }))

    useFrame((state, delta) => {
      if (!groupRef.current || paused) return
      const dt = Math.min(delta, 0.1)

      // Update aim delta
      inputManager.updateAimWithDelta(dt)

      const { yaw, pitch } = inputManager.getAimAngles()
      const move = inputManager.getMovement()

      // Target X position tracks aim X smoothly across chase lanes (-26 to +26)
      const targetX = -inputManager.aimX * 24.0

      // Target Y position allows full high-altitude climb (up to 36) down to treetop skimming (3.5)
      const aimHeightOffset = inputManager.aimY * 12.0
      const keyAltitudeBonus = move.y * 8.0 + (move.z < 0 ? 4.0 : move.z > 0 ? -4.0 : 0)
      const baseAlt = 18.0

      const targetY = THREE.MathUtils.clamp(
        baseAlt + aimHeightOffset + keyAltitudeBonus,
        3.5,
        36.0
      )

      // Smooth flight maneuvering (Euler decay / Exponential smoothing)
      posX.current = THREE.MathUtils.lerp(posX.current, targetX, 1.0 - Math.exp(-dt * 5.5))
      posY.current = THREE.MathUtils.lerp(posY.current, targetY, 1.0 - Math.exp(-dt * 5.0))

      // Speed banking based on lateral movement
      const moveDeltaX = targetX - posX.current
      const targetBank = THREE.MathUtils.clamp(-moveDeltaX * 0.07 - yaw * 0.35, -0.65, 0.65)
      bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, 1.0 - Math.exp(-dt * 8.0))

      // Dynamic Climb / Dive Pitch
      const climbDeltaY = targetY - posY.current
      const targetPitch = 0.12 - climbDeltaY * 0.08 + pitch * 0.15
      pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, targetPitch, 1.0 - Math.exp(-dt * 6.0))

      // Modulate turbine audio pitch based on climb and bank
      const pitchMod = 1.0 + Math.abs(climbDeltaY) * 0.05 + Math.abs(bankAngle.current) * 0.1
      audioManager.setRotorPitch(pitchMod)

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
