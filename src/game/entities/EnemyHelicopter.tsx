import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { HelicopterMesh } from './HelicopterMesh'
import { AnswerLabel } from './AnswerLabel'
import type { HelicopterOption } from '@/game/gameTypes'
import { randFloat } from '@/utils/math'
import { inputManager } from '@/controls/InputManager'

export interface EnemyHelicopterHandle {
  getWorldPosition: (out?: THREE.Vector3) => THREE.Vector3
}

interface EnemyHelicopterProps extends HelicopterOption {
  sessionId: string
  paused: boolean
  spawnPosition: THREE.Vector3
  crashed: boolean
  onTargetSelected?: (index: number) => void
  onCollisionEnter?: (optionText: string, isCorrect: boolean, sessionId: string) => void
}

/**
 * Enemy Convoy Helicopter (SKILL.md Law 1 & Law 3).
 * Interactive 3D target with direct click targeting, smooth organic formation sway,
 * and spectacular fire dive when hit.
 */
export const EnemyHelicopter = forwardRef<EnemyHelicopterHandle, EnemyHelicopterProps>(
  function EnemyHelicopter(
    { optionIndex, optionText: _optionText, isCorrect: _isCorrect, sessionId: _sessionId, paused, spawnPosition, crashed, onTargetSelected },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const crashStartTime = useRef<number | null>(null)
    const crashAngular = useRef(new THREE.Vector3(
      randFloat(-4, 4), randFloat(-2, 2), randFloat(-5, 5)
    ))
    const timeOffset = useRef(optionIndex * 1.3)
    const scratchPos = useRef(new THREE.Vector3())

    useImperativeHandle(ref, () => ({
      getWorldPosition: (out = scratchPos.current) => {
        if (groupRef.current) {
          groupRef.current.getWorldPosition(out)
        } else {
          out.copy(spawnPosition)
        }
        return out
      },
    }))

    useFrame((state, delta) => {
      if (!groupRef.current || paused) return
      const dt = Math.min(delta, 0.1)

      if (crashed) {
        // === SPECTACULAR BURNING CRASH DIVE ===
        if (crashStartTime.current === null) {
          crashStartTime.current = state.clock.elapsedTime
        }
        const elapsed = state.clock.elapsedTime - crashStartTime.current
        const fallSpeed = 12 + elapsed * 18
        groupRef.current.position.y -= fallSpeed * dt
        groupRef.current.position.z += 8 * dt // drops behind in chase
        groupRef.current.rotation.x += crashAngular.current.x * dt
        groupRef.current.rotation.y += crashAngular.current.y * dt
        groupRef.current.rotation.z += crashAngular.current.z * dt
        return
      }

      // === HIGH-SPEED CONVOY FORMATION FLIGHT ===
      const t = state.clock.elapsedTime + timeOffset.current

      // Organic formation sway
      const swayX = spawnPosition.x + Math.sin(t * 1.4) * 0.8
      const swayY = spawnPosition.y + Math.sin(t * 2.1) * 0.5
      const swayZ = spawnPosition.z + Math.cos(t * 1.1) * 0.6

      groupRef.current.position.set(swayX, swayY, swayZ)

      // Forward flight pitch + sway bank
      groupRef.current.rotation.set(
        0.12 + Math.sin(t * 1.8) * 0.03,
        Math.sin(t * 0.9) * 0.05,
        -Math.sin(t * 1.4) * 0.08
      )
    })

    useEffect(() => {
      if (!crashed) {
        crashStartTime.current = null
        if (groupRef.current) {
          groupRef.current.position.copy(spawnPosition)
          groupRef.current.rotation.set(0.12, 0, 0)
        }
      }
    }, [crashed, spawnPosition])

    // Direct click on 3D helicopter selects it as target
    const handlePointerDown = (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (!crashed && !paused) {
        inputManager.setDirectTargetIndex(optionIndex)
        onTargetSelected?.(optionIndex)
      }
    }

    return (
      <group
        ref={groupRef}
        position={spawnPosition.toArray()}
        onPointerDown={handlePointerDown}
      >
        <HelicopterMesh isPlayer={false} crashed={crashed} />

        {/* Trailing Fire & Smoke when hit/crashed */}
        {crashed && <CrashingFirePlume />}

        {!crashed && (
          <AnswerLabel
            optionIndex={optionIndex}
            isCrashing={false}
          />
        )}

        {/* Dynamic Engine Lighting */}
        <pointLight
          color={crashed ? '#ff2200' : '#ff8c00'}
          intensity={crashed ? 4.5 : 1.2}
          distance={10}
          decay={2}
        />
      </group>
    )
  }
)

/** Realistic continuous fire & billowing smoke attached to crashing aircraft */
function CrashingFirePlume() {
  const fireRef = useRef<THREE.Mesh>(null)
  const smoke1Ref = useRef<THREE.Mesh>(null)
  const smoke2Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Flickering intense flame
    if (fireRef.current) {
      const s = 1.0 + Math.sin(t * 24) * 0.35
      fireRef.current.scale.set(s, s * 1.5, s)
      fireRef.current.position.y = 0.5 + Math.sin(t * 18) * 0.15
    }

    // Billowing smoke puffs trailing behind
    if (smoke1Ref.current) {
      smoke1Ref.current.scale.setScalar(1.8 + Math.sin(t * 8) * 0.4)
      smoke1Ref.current.position.set(Math.sin(t * 5) * 0.3, 1.8, 1.2)
    }
    if (smoke2Ref.current) {
      smoke2Ref.current.scale.setScalar(2.6 + Math.cos(t * 7) * 0.5)
      smoke2Ref.current.position.set(-Math.cos(t * 4) * 0.4, 3.2, 2.4)
    }
  })

  return (
    <group position={[0, 0.2, 0]}>
      {/* 1. Intense burning flame core */}
      <mesh ref={fireRef} position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#ff3300"
          emissive="#ff5500"
          emissiveIntensity={4.0}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 2. Trailing black smoke puffs */}
      <mesh ref={smoke1Ref} position={[0, 1.8, 1.2]}>
        <sphereGeometry args={[0.9, 6, 5]} />
        <meshStandardMaterial color="#111111" roughness={1} transparent opacity={0.7} />
      </mesh>
      <mesh ref={smoke2Ref} position={[0, 3.2, 2.4]}>
        <sphereGeometry args={[1.3, 6, 5]} />
        <meshStandardMaterial color="#1f1d1b" roughness={1} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
