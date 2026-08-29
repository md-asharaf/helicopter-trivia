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
 * Cinematic Movie Chase Camera Rig.
 * Rides directly behind the chase helicopter in hot pursuit.
 * Dynamic lateral tracking, banking roll, and wind turbulence.
 */
export function CameraRig({ playerRef, bombPosition, impactPosition, shake, paused = false }: CameraRigProps) {
  const { camera } = useThree()
  const mode = useRef<CameraMode>('following')
  const shakeTimer = useRef(0)
  const targetPos = useRef(new THREE.Vector3(0, 20.5, 14))

  useEffect(() => {
    if (bombPosition) {
      mode.current = 'bombing'
    }
  }, [bombPosition])

  useEffect(() => {
    if (impactPosition) {
      mode.current = 'impact'
      setTimeout(() => {
        mode.current = 'returning'
        setTimeout(() => { mode.current = 'following' }, 1200)
      }, 600)
    }
  }, [impactPosition])

  useEffect(() => {
    if (shake) {
      shakeTimer.current = GAME_CONFIG.camera.shakeDuration / 1000
    }
  }, [shake])

  useFrame((_state, delta) => {
    if (paused) return
    const player = playerRef.current
    if (!player) return

    const playerPos = player.getWorldPosition()
    const { followLag, bombFollowLag, shakeMagnitude } = GAME_CONFIG.camera

    let desiredPos: THREE.Vector3

    switch (mode.current) {
      case 'bombing': {
        if (bombPosition) {
          desiredPos = new THREE.Vector3(
            bombPosition.x * 0.4,
            bombPosition.y + 4.5,
            bombPosition.z + 12
          )
        } else {
          desiredPos = new THREE.Vector3(playerPos.x * 0.6, playerPos.y + 3.8, playerPos.z + 14)
        }
        break
      }
      case 'impact': {
        if (impactPosition) {
          desiredPos = new THREE.Vector3(
            impactPosition.x * 0.3,
            impactPosition.y + 6,
            impactPosition.z + 16
          )
        } else {
          desiredPos = new THREE.Vector3(playerPos.x * 0.6, playerPos.y + 3.8, playerPos.z + 14)
        }
        break
      }
      default: {
        // Elevated dogfight chase camera (matching reference game)
        desiredPos = new THREE.Vector3(
          playerPos.x * 0.55,
          playerPos.y + 4.2,
          playerPos.z + 15.0
        )
        break
      }
    }

    const lag = mode.current === 'bombing' ? bombFollowLag : followLag
    targetPos.current.lerp(desiredPos, delta * lag)
    camera.position.copy(targetPos.current)

    // Look at target: either bomb or ahead into the horizon
    const lookTarget = mode.current === 'bombing' && bombPosition
      ? bombPosition
      : new THREE.Vector3(playerPos.x * 0.3, playerPos.y + 0.5, -45)

    camera.lookAt(lookTarget)

    // Screen Shake effect
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta
      const magnitude = shakeMagnitude * (shakeTimer.current / (GAME_CONFIG.camera.shakeDuration / 1000))
      camera.position.x += (Math.random() - 0.5) * magnitude
      camera.position.y += (Math.random() - 0.5) * magnitude * 0.5
    }
  })

  return null
}
