import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { PlayerHelicopterHandle } from '@/game/entities/PlayerHelicopter'
import { GAME_CONFIG } from '@/game/gameConfig'

type CameraMode = 'following' | 'bombing' | 'impact' | 'returning'

interface CameraRigProps {
  playerRef: React.RefObject<PlayerHelicopterHandle | null>
  bombPosition: THREE.Vector3 | null
  impactPosition: THREE.Vector3 | null
  shake: boolean
  paused?: boolean
}

/**
 * Cinematic Movie Chase Camera Rig (SKILL.md Law 2).
 * Smooth chase tracking with clamped delta time and dynamic camera shake.
 */
export function CameraRig({ playerRef, bombPosition, impactPosition, shake, paused = false }: CameraRigProps) {
  const { camera } = useThree()
  const mode = useRef<CameraMode>('following')
  const shakeTimer = useRef(0)
  const targetPos = useRef(new THREE.Vector3(0, 20.5, 14))
  const desiredPos = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const scratchPlayerPos = useRef(new THREE.Vector3())

  useEffect(() => {
    if (bombPosition) {
      mode.current = 'bombing'
    }
  }, [bombPosition])

  useEffect(() => {
    if (impactPosition) {
      mode.current = 'impact'
      const t1 = setTimeout(() => {
        mode.current = 'returning'
        const t2 = setTimeout(() => { mode.current = 'following' }, 1200)
        return () => clearTimeout(t2)
      }, 600)
      return () => clearTimeout(t1)
    }
  }, [impactPosition])

  useEffect(() => {
    if (shake) {
      shakeTimer.current = GAME_CONFIG.camera.shakeDuration / 1000
    }
  }, [shake])

  useFrame((_state, delta) => {
    if (paused) return
    const dt = Math.min(delta, 0.1)
    const player = playerRef.current
    if (!player) return

    const playerPos = player.getWorldPosition(scratchPlayerPos.current)
    const { followLag, bombFollowLag, shakeMagnitude } = GAME_CONFIG.camera

    switch (mode.current) {
      case 'bombing': {
        if (bombPosition) {
          desiredPos.current.set(
            bombPosition.x * 0.4,
            bombPosition.y + 4.5,
            bombPosition.z + 12
          )
        } else {
          desiredPos.current.set(playerPos.x * 0.6, playerPos.y + 3.8, playerPos.z + 14)
        }
        break
      }
      case 'impact': {
        if (impactPosition) {
          desiredPos.current.set(
            impactPosition.x * 0.3,
            impactPosition.y + 6,
            impactPosition.z + 16
          )
        } else {
          desiredPos.current.set(playerPos.x * 0.6, playerPos.y + 3.8, playerPos.z + 14)
        }
        break
      }
      default: {
        // Elevated dynamic dogfight chase camera
        desiredPos.current.set(
          playerPos.x * 0.55,
          playerPos.y + 4.8 + Math.max(0, (playerPos.y - 18) * 0.25),
          playerPos.z + 16.0
        )
        break
      }
    }

    const lag = mode.current === 'bombing' ? bombFollowLag : followLag
    targetPos.current.lerp(desiredPos.current, 1.0 - Math.exp(-dt * lag * 30))

    let camX = targetPos.current.x
    let camY = targetPos.current.y
    const camZ = targetPos.current.z

    // Screen Shake effect
    if (shakeTimer.current > 0) {
      shakeTimer.current -= dt
      const magnitude = shakeMagnitude * (shakeTimer.current / (GAME_CONFIG.camera.shakeDuration / 1000))
      camX += (Math.random() - 0.5) * magnitude
      camY += (Math.random() - 0.5) * magnitude * 0.5
    }

    camera.position.set(camX, camY, camZ)

    // Dynamic pitch looking down at island/river
    if (mode.current === 'bombing' && bombPosition) {
      lookTarget.current.copy(bombPosition)
    } else {
      lookTarget.current.set(
        playerPos.x * 0.3,
        playerPos.y * 0.65 - 2.5,
        -52
      )
    }

    camera.lookAt(lookTarget.current)
  })

  return null
}
