import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { inputManager } from '@/controls/InputManager'

interface TrajectoryLineProps {
  playerPosition: THREE.Vector3
  visible: boolean
}

const STEPS = 36
const ARC_HEIGHT = 4.2

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
  const targetLockRef = useRef<THREE.Group>(null)
  const reticleRingRef = useRef<THREE.Mesh>(null)
  const scratchStart = useRef(new THREE.Vector3())
  const scratchPt = useRef(new THREE.Vector3())
  const positionsArray = useRef(new Float32Array(STEPS * 3))

  const { lineObject, geo } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(new Float32Array(STEPS * 3), 3)
    posAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', posAttr)

    const material = new THREE.LineBasicMaterial({
      color: '#00e5ff',
      transparent: true,
      opacity: 0.92,
      linewidth: 3,
    })

    const line = new THREE.Line(geometry, material)
    return { lineObject: line, geo: geometry }
  }, [])

  useEffect(() => {
    return () => {
      geo.dispose()
      lineObject.material.dispose()
    }
  }, [geo, lineObject])

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
    scratchStart.current.copy(playerPosition).add(new THREE.Vector3(0, -0.5, -1.0))

    // Build exact trajectory curve matching the bomb
    const posArr = positionsArray.current
    for (let i = 0; i < STEPS; i++) {
      const progress = i / (STEPS - 1)
      scratchPt.current.lerpVectors(scratchStart.current, lockedTarget, progress)
      scratchPt.current.y += 4 * ARC_HEIGHT * progress * (1 - progress)

      posArr[i * 3] = scratchPt.current.x
      posArr[i * 3 + 1] = scratchPt.current.y
      posArr[i * 3 + 2] = scratchPt.current.z
    }

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    posAttr.copyArray(posArr)
    posAttr.needsUpdate = true

    // Animate target lock bracket
    if (targetLockRef.current) {
      const t = clock.getElapsedTime()
      targetLockRef.current.position.copy(lockedTarget)
      const pulse = 1 + Math.sin(t * 10) * 0.08
      targetLockRef.current.scale.set(pulse, pulse, pulse)

      if (reticleRingRef.current) {
        reticleRingRef.current.rotation.z += 0.02
      }
    }
  })

  if (!visible) return null

  return (
    <group>
      {/* Primary bright glowing trajectory arc */}
      <primitive object={lineObject} />

      {/* 3D Target Lock-On Reticle Rings */}
      <group ref={targetLockRef} position={[0, 16.5, -26]}>
        {/* Outer cyan targeting rotating ring */}
        <mesh ref={reticleRingRef}>
          <ringGeometry args={[2.3, 2.55, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner amber lock ring */}
        <mesh>
          <ringGeometry args={[1.3, 1.45, 24]} />
          <meshBasicMaterial color="#ff8c00" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}
