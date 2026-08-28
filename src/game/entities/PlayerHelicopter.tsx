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
 * Player Chase Helicopter.
 * Drives the high-speed pursuit from behind the 4 front target helicopters.
 * Features aggressive pursuit banking, lane maneuvering, and dynamic aim tracking.
 */
export const PlayerHelicopter = forwardRef<PlayerHelicopterHandle, PlayerHelicopterProps>(
  function PlayerHelicopter({ paused }, ref) {
    const groupRef = useRef<THREE.Group>(null)
    const posX = useRef(0)
    const posY = useRef(16)
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

      // Target X position tracks aim X smoothly across chase lanes (-24 to +24)
      const targetX = -inputManager.aimX * 22.0
      // Target Y position tracks height (14 to 20)
      const targetY = 16.0 + inputManager.aimY * 3.5

      // Smooth pursuit maneuvering
      posX.current = THREE.MathUtils.lerp(posX.current, targetX, delta * 5.5)
      posY.current = THREE.MathUtils.lerp(posY.current, targetY, delta * 5.0)

      // Speed banking based on lateral movement
      const moveDeltaX = (targetX - posX.current)
      const targetBank = THREE.MathUtils.clamp(-moveDeltaX * 0.08 - yaw * 0.35, -0.65, 0.65)
      bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, delta * 8.0)

      // Pitch angle forward into the chase
      const targetPitch = 0.15 + pitch * 0.12
      pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, targetPitch, delta * 6.0)

      // Natural flight turbulence bobbing
      const t = state.clock.getElapsedTime()
      const bobbing = Math.sin(t * 3.2) * 0.12

      groupRef.current.position.set(posX.current, posY.current + bobbing, 0)

      // Rotate: Pitch down forward, Yaw towards aim, Roll/Bank into turns
      groupRef.current.rotation.set(
        -pitchAngle.current,
        yaw * 0.8,
        bankAngle.current
      )
    })

    return (
      <group ref={groupRef} position={[0, 16, 0]}>
        <HelicopterMesh isPlayer />
        {/* Neon blue afterburner / thruster light */}
        <pointLight color="#00e5ff" intensity={2.0} distance={10} decay={2} />
      </group>
    )
  }
)
