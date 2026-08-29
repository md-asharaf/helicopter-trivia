import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { HelicopterMesh } from './HelicopterMesh'
import { AnswerLabel } from './AnswerLabel'
import type { HelicopterOption } from '@/game/gameTypes'
import { GAME_CONFIG } from '@/game/gameConfig'
import { randFloat } from '@/utils/math'

export interface EnemyHelicopterHandle {
  getWorldPosition: () => THREE.Vector3
}

interface EnemyHelicopterProps extends HelicopterOption {
  sessionId: string
  paused: boolean
  spawnPosition: THREE.Vector3
  crashed: boolean
  onCollisionEnter?: (optionText: string, isCorrect: boolean, sessionId: string) => void
}

/**
 * Enemy Convoy Helicopter.
 * When hit, catches realistic fire with trailing black smoke and spins down.
 */
export const EnemyHelicopter = forwardRef<EnemyHelicopterHandle, EnemyHelicopterProps>(
  function EnemyHelicopter(
    { optionIndex, optionText, isCorrect, sessionId, paused, spawnPosition, crashed, onCollisionEnter },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const rbRef = useRef<RapierRigidBody>(null)
    const crashStartTime = useRef<number | null>(null)
    const crashAngular = useRef(new THREE.Vector3(
      randFloat(-4, 4), randFloat(-2, 2), randFloat(-5, 5)
    ))
    const timeOffset = useRef(optionIndex * 1.3)

    useImperativeHandle(ref, () => ({
      getWorldPosition: () => {
        const pos = new THREE.Vector3()
        groupRef.current?.getWorldPosition(pos)
        return pos
      },
    }))

    useFrame((state, delta) => {
      if (!groupRef.current) return

      if (crashed) {
        // === SPECTACULAR BURNING CRASH DIVE ===
        if (crashStartTime.current === null) {
          crashStartTime.current = state.clock.elapsedTime
        }
        const elapsed = state.clock.elapsedTime - crashStartTime.current
        const fallSpeed = 12 + elapsed * 18
        groupRef.current.position.y -= fallSpeed * delta
        groupRef.current.position.z += 8 * delta // drops behind in chase
        groupRef.current.rotation.x += crashAngular.current.x * delta
        groupRef.current.rotation.y += crashAngular.current.y * delta
        groupRef.current.rotation.z += crashAngular.current.z * delta

        if (rbRef.current) {
          rbRef.current.setNextKinematicTranslation(groupRef.current.position)
        }
        return
      }

      if (paused) return

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

      if (rbRef.current) {
        rbRef.current.setNextKinematicTranslation(groupRef.current.position)
        rbRef.current.setNextKinematicRotation(
          new THREE.Quaternion().setFromEuler(groupRef.current.rotation)
        )
      }
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

    const userData = {
      type: 'helicopter' as const,
      optionIndex,
      optionText,
      isCorrect,
      sessionId,
    }

    return (
      <group ref={groupRef} position={spawnPosition.toArray()}>
        <RigidBody
          ref={rbRef}
          type="kinematicPosition"
          colliders="ball"
          args={[GAME_CONFIG.enemy.colliderRadius]}
          userData={userData}
          sensor={false}
          onCollisionEnter={(e) => {
            const other = e.other.rigidBodyObject?.userData as { type?: string } | undefined
            if (other?.type === 'bomb') {
              onCollisionEnter?.(optionText, isCorrect, sessionId)
            }
          }}
        >
          <mesh visible={false}>
            <sphereGeometry args={[GAME_CONFIG.enemy.colliderRadius]} />
          </mesh>
        </RigidBody>

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
