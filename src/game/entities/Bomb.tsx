import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { BombPhase, HelicopterOption } from '@/game/gameTypes'

interface BombProps {
  spawnPosition: THREE.Vector3
  targetPosition: THREE.Vector3
  targetOption: HelicopterOption | null
  sessionId: string
  onHit: (optionText: string, isCorrect: boolean, sessionId: string) => void
  onMiss: (sessionId: string) => void
  paused: boolean
  phase: BombPhase
  onPhaseChange: (phase: BombPhase) => void
}

const TOTAL_FLIGHT_TIME = 0.88 // 0.88s fast arcade strike
const ARC_HEIGHT = 4.2 // Upward arc peak
const TRAIL_MAX_POINTS = 40

/**
 * Ultra-Realistic Military Tactical Frag Grenade (SKILL.md Law 1 & Law 3).
 * Zero per-frame memory allocation using ring buffer Float32Array.
 */
export function Bomb({
  spawnPosition,
  targetPosition,
  targetOption,
  sessionId,
  onHit,
  onMiss,
  paused,
  phase,
  onPhaseChange,
}: BombProps) {
  const groupRef = useRef<THREE.Group>(null)
  const grenadeMeshRef = useRef<THREE.Group>(null)
  const elapsedTime = useRef(0)
  const resolvedRef = useRef(false)

  // Reusable scratch objects
  const scratchPos = useRef(new THREE.Vector3())
  const scratchNextPos = useRef(new THREE.Vector3())
  const scratchDir = useRef(new THREE.Vector3())
  const scratchQuat = useRef(new THREE.Quaternion())
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  // Trail buffer pre-allocation (Zero-GC)
  const trailPositions = useRef(new Float32Array(TRAIL_MAX_POINTS * 3))
  const trailCount = useRef(0)
  const trailGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // Stable geometry & line material created once
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const attr = new THREE.BufferAttribute(new Float32Array(TRAIL_MAX_POINTS * 3), 3)
    attr.setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('position', attr)
    const mat = new THREE.LineBasicMaterial({
      color: '#ff6600',
      transparent: true,
      opacity: 0.85,
      linewidth: 3,
    })
    return { geometry: geo, material: mat }
  }, [])

  useEffect(() => {
    trailGeoRef.current = geometry
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_state, delta) => {
    if (!groupRef.current || phase !== 'flying' || resolvedRef.current || paused) return
    const dt = Math.min(delta, 0.1)

    elapsedTime.current += dt
    const progress = Math.min(elapsedTime.current / TOTAL_FLIGHT_TIME, 1.0)

    // Linear interpolation from spawn to target
    scratchPos.current.lerpVectors(spawnPosition, targetPosition, progress)

    // Parabolic vertical arc: 4 * h * p * (1 - p)
    const arcOffset = 4 * ARC_HEIGHT * progress * (1 - progress)
    scratchPos.current.y += arcOffset

    groupRef.current.position.copy(scratchPos.current)

    // Dynamic flight orientation + realistic grenade spin/tumbling
    const nextProgress = Math.min(progress + 0.04, 1.0)
    scratchNextPos.current.lerpVectors(spawnPosition, targetPosition, nextProgress)
    scratchNextPos.current.y += 4 * ARC_HEIGHT * nextProgress * (1 - nextProgress)
    scratchDir.current.subVectors(scratchNextPos.current, scratchPos.current).normalize()

    if (scratchDir.current.lengthSq() > 0.01) {
      scratchQuat.current.setFromUnitVectors(upVec, scratchDir.current)
      groupRef.current.quaternion.copy(scratchQuat.current)
    }

    // Realistic end-over-end grenade throw spin
    if (grenadeMeshRef.current) {
      grenadeMeshRef.current.rotation.x += dt * 14.0
      grenadeMeshRef.current.rotation.z += dt * 7.0
    }

    // Update glowing fire trail without array re-allocation
    const count = Math.min(trailCount.current + 1, TRAIL_MAX_POINTS)
    trailCount.current = count

    const arr = trailPositions.current
    // Shift previous points back
    for (let i = count - 1; i > 0; i--) {
      arr[i * 3] = arr[(i - 1) * 3]
      arr[i * 3 + 1] = arr[(i - 1) * 3 + 1]
      arr[i * 3 + 2] = arr[(i - 1) * 3 + 2]
    }
    // Write new point at head
    arr[0] = scratchPos.current.x
    arr[1] = scratchPos.current.y
    arr[2] = scratchPos.current.z

    if (trailGeoRef.current) {
      const posAttr = trailGeoRef.current.getAttribute('position') as THREE.BufferAttribute
      posAttr.copyArray(arr)
      posAttr.needsUpdate = true
      trailGeoRef.current.setDrawRange(0, count)
    }

    // Dead-Center Impact Trigger
    if (progress >= 1.0) {
      resolvedRef.current = true
      onPhaseChange('hit')

      if (targetOption) {
        onHit(targetOption.optionText, targetOption.isCorrect, sessionId)
      } else {
        onMiss(sessionId)
      }
    }
  })

  return (
    <group>
      {/* 3D Realistic Military Frag Grenade */}
      <group ref={groupRef} position={spawnPosition.toArray()} scale={[0.72, 0.72, 0.72]}>
        <group ref={grenadeMeshRef}>
          {/* 1. Main Egg/Pineapple Fragmentation Body */}
          <mesh castShadow position={[0, 0, 0]}>
            <sphereGeometry args={[0.42, 16, 12]} />
            <meshStandardMaterial
              color="#22331f"
              roughness={0.4}
              metalness={0.65}
            />
          </mesh>

          {/* 2. Fragmentation Ribs & Segmentation Bands */}
          <mesh castShadow position={[0, 0.12, 0]}>
            <torusGeometry args={[0.4, 0.035, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.12, 0]}>
            <torusGeometry args={[0.4, 0.035, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.41, 0.025, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.41, 0.025, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>

          {/* 3. Tactical Yellow Identification Ring */}
          <mesh castShadow position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.31, 0.35, 0.06, 16]} />
            <meshStandardMaterial color="#e6a100" roughness={0.3} metalness={0.5} />
          </mesh>

          {/* 4. Zinc Fuze Collar / Neck */}
          <mesh castShadow position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.22, 14]} />
            <meshStandardMaterial color="#7a7a7a" roughness={0.25} metalness={0.88} />
          </mesh>

          {/* 5. Curved Safety Lever (Spoon) */}
          <mesh castShadow position={[0.13, 0.22, 0]} rotation={[0, 0, -0.18]}>
            <boxGeometry args={[0.06, 0.48, 0.12]} />
            <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.85} />
          </mesh>

          {/* 6. Safety Pin & Pull Ring */}
          <mesh castShadow position={[-0.14, 0.46, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.12, 0.024, 10, 20]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.95} />
          </mesh>

          {/* 7. Glowing Ignition Fuse Beacon */}
          <mesh position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff4400"
              emissiveIntensity={4.0}
            />
          </mesh>

          {/* Dynamic Fuse Light */}
          <pointLight
            position={[0, 0.56, 0]}
            color="#ff4400"
            intensity={3.5}
            distance={5}
            decay={2}
          />
        </group>
      </group>

      {/* Trailing Ignition Flame / Smoke Ribbon */}
      <primitive object={new THREE.Line(geometry, material)} />
    </group>
  )
}
