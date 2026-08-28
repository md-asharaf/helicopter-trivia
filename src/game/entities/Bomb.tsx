import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { BombPhase, HelicopterOption } from '@/game/gameTypes'
import { GAME_CONFIG } from '@/game/gameConfig'

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

const TOTAL_FLIGHT_TIME = 0.95 // 0.95s fast arcade strike
const ARC_HEIGHT = 4.5 // Maximum upward arc peak

/**
 * Ultra-Realistic Military Tactical Frag Grenade (Pineapple / M67 Style).
 * Features segmented ribbed steel body, olive drab finish, safety fuze collar,
 * safety lever spoon, tactical pull-ring, and glowing ignition fuse with realistic spin.
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
  const trailPositions = useRef<THREE.Vector3[]>([])
  const trailGeometry = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry())

  const trailLineObject = useMemo(() => {
    return new THREE.Line(
      trailGeometry.current,
      new THREE.LineBasicMaterial({ color: '#ff6600', transparent: true, opacity: 0.85, linewidth: 3 })
    )
  }, [])

  useFrame((_state, delta) => {
    if (!groupRef.current || phase !== 'flying' || resolvedRef.current) return
    if (paused) return

    elapsedTime.current += delta
    const progress = Math.min(elapsedTime.current / TOTAL_FLIGHT_TIME, 1.0)

    // Linear interpolation from spawn to target
    const currentPos = new THREE.Vector3().lerpVectors(spawnPosition, targetPosition, progress)

    // Parabolic vertical arc: 4 * h * p * (1 - p)
    const arcOffset = 4 * ARC_HEIGHT * progress * (1 - progress)
    currentPos.y += arcOffset

    groupRef.current.position.copy(currentPos)

    // Dynamic flight orientation + realistic grenade spin/tumbling
    const nextProgress = Math.min(progress + 0.04, 1.0)
    const nextPos = new THREE.Vector3().lerpVectors(spawnPosition, targetPosition, nextProgress)
    nextPos.y += 4 * ARC_HEIGHT * nextProgress * (1 - nextProgress)
    const forwardDir = nextPos.clone().sub(currentPos).normalize()

    if (forwardDir.lengthSq() > 0.01) {
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), forwardDir)
      groupRef.current.quaternion.copy(baseQuat)
    }

    // Realistic end-over-end grenade throw spin
    if (grenadeMeshRef.current) {
      grenadeMeshRef.current.rotation.x += delta * 12.0
      grenadeMeshRef.current.rotation.z += delta * 6.0
    }

    // Update glowing fire trail
    trailPositions.current.push(currentPos.clone())
    if (trailPositions.current.length > GAME_CONFIG.bomb.trailLength) {
      trailPositions.current.shift()
    }
    const points = trailPositions.current.flatMap((p) => [p.x, p.y, p.z])
    const attr = new THREE.Float32BufferAttribute(points, 3)
    trailGeometry.current.setAttribute('position', attr)
    trailGeometry.current.computeBoundingSphere()

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
      {/* 3D Realistic Military Frag Grenade (Scaled realistically to helicopter) */}
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
          {/* Horizontal rib bands */}
          <mesh castShadow position={[0, 0.12, 0]}>
            <torusGeometry args={[0.4, 0.035, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.12, 0]}>
            <torusGeometry args={[0.4, 0.035, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>

          {/* Vertical rib studs */}
          <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.41, 0.025, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.41, 0.025, 8, 24]} />
            <meshStandardMaterial color="#182416" roughness={0.5} metalness={0.7} />
          </mesh>

          {/* 3. Tactical Yellow Identification Ring (High Explosive Mark) */}
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

          {/* 7. Glowing Ignition Fuse / Beacon */}
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
      <primitive object={trailLineObject} />
    </group>
  )
}
