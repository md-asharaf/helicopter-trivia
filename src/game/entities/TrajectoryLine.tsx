import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
import { inputManager } from '@/controls/InputManager'

interface TrajectoryLineProps {
  playerPosition: THREE.Vector3
  visible: boolean
}

const STEPS = 36
const ARC_HEIGHT = 4.5

const TARGET_POSITIONS = [
  { letter: 'A', pos: new THREE.Vector3(-19, 16.5, -26) },
  { letter: 'B', pos: new THREE.Vector3(-6.5, 16.5, -26) },
  { letter: 'C', pos: new THREE.Vector3(6.5, 16.5, -26) },
  { letter: 'D', pos: new THREE.Vector3(19, 16.5, -26) },
]

/**
 * 3D Target Lock-On Laser & Parabolic Trajectory Guide.
 * 100% matches the Bomb's actual flight path to the locked helicopter.
 */
export function TrajectoryLine({ playerPosition, visible }: TrajectoryLineProps) {
  const points = useMemo(
    () => Array.from({ length: STEPS }, () => new THREE.Vector3()),
    []
  )
  const targetLockRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!visible) return

    // Calculate nearest aimed target based on mouse / keys
    const rawAimX = -inputManager.aimX * 22
    let closestIdx = 0
    let minDiff = 999

    TARGET_POSITIONS.forEach((t, idx) => {
      const diff = Math.abs(rawAimX - t.pos.x)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })

    const lockedTarget = TARGET_POSITIONS[closestIdx].pos
    const startPos = playerPosition.clone().add(new THREE.Vector3(0, -0.5, -1.0))

    // Build exact trajectory curve matching the bomb
    for (let i = 0; i < STEPS; i++) {
      const progress = i / (STEPS - 1)
      const pt = new THREE.Vector3().lerpVectors(startPos, lockedTarget, progress)
      pt.y += 4 * ARC_HEIGHT * progress * (1 - progress)
      points[i].copy(pt)
    }

    // Animate target lock bracket
    if (targetLockRef.current) {
      const t = clock.getElapsedTime()
      targetLockRef.current.position.set(lockedTarget.x, lockedTarget.y, lockedTarget.z)
      const pulse = 1 + Math.sin(t * 10) * 0.08
      targetLockRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  if (!visible) return null

  return (
    <group>
      {/* Primary bright glowing trajectory arc */}
      <Line
        points={points}
        color="#00e5ff"
        lineWidth={4.5}
        transparent
        opacity={0.95}
      />

      {/* Trajectory glow aura */}
      <Line
        points={points}
        color="#0088cc"
        lineWidth={9.0}
        transparent
        opacity={0.4}
      />

      {/* 3D Target Lock-On Ring & Brackets */}
      <group ref={targetLockRef} position={[0, 16.5, -26]}>
        {/* Outer targeting ring */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[2.3, 2.55, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner amber ring */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 24]} />
          <meshBasicMaterial color="#ff8c00" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>

        {/* Tactical target lock label */}
        <Html position={[0, 3.2, 0]} center transform distanceFactor={28}>
          <div className="target-lock-badge">
            <span className="target-lock-badge__text">🎯 TARGET LOCK</span>
          </div>
        </Html>
      </group>
    </group>
  )
}
