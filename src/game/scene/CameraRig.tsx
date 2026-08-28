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
}

/**
 * Cinematic Movie Chase Camera Rig.
 * Rides directly behind the chase helicopter in hot pursuit.
 * Dynamic lateral tracking, banking roll, and wind turbulence.
 */
export function CameraRig({ playerRef, bombPosition, impactPosition, shake }: CameraRigProps) {
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

  useFrame((state, delta) => {
    const player = playerRef.current
    if (!player) return

    const playerPos = player.getWorldPosition()
    const { followLag, bombFollowLag, shakeMagnitude } = GAME_CONFIG.camera

    let desiredPos: THREE.Vector3

    switch (mode.current) {
      case 'bombing': {
        if (bombPosition) {
          const midpoint = playerPos.clone().lerp(bombPosition, 0.45)
          desiredPos = new THREE.Vector3(
            midpoint.x * 0.7,
            Math.max(playerPos.y + 4.5, midpoint.y + 6),
            midpoint.z + 10.0,
          )
          targetPos.current.lerp(desiredPos, bombFollowLag * 1.5)
        } else {
          mode.current = 'following'
          desiredPos = new THREE.Vector3(playerPos.x * 0.7, playerPos.y + 4.5, playerPos.z + 13.5)
          targetPos.current.lerp(desiredPos, followLag)
        }
        break
      }
      case 'impact': {
        if (impactPosition) {
          desiredPos = impactPosition.clone().add(new THREE.Vector3(0, 8, 12))
          targetPos.current.lerp(desiredPos, 0.08)
        }
        break
      }
      default: {
        // Close-up arcade chase camera
        desiredPos = new THREE.Vector3(
          playerPos.x * 0.75,
          playerPos.y + 3.4,
          playerPos.z + 10.0,
        )
        targetPos.current.lerp(desiredPos, followLag * 1.8)
        break
      }
    }

    camera.position.copy(targetPos.current)

    // Camera shake on bomb release / impact
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta
      const magnitude = shakeMagnitude * (shakeTimer.current / (GAME_CONFIG.camera.shakeDuration / 1000))
      camera.position.x += (Math.random() - 0.5) * magnitude
      camera.position.y += (Math.random() - 0.5) * magnitude * 0.5
      camera.position.z += (Math.random() - 0.5) * magnitude
    }

    // Subtle continuous flight turbulence
    const t = state.clock.getElapsedTime()
    camera.position.y += Math.sin(t * 4.5) * 0.04

    // Look forward down the chase highway towards the 4 enemy helicopters
    const lookTarget = new THREE.Vector3(playerPos.x * 0.35, playerPos.y - 0.3, playerPos.z - 30)
    camera.lookAt(lookTarget)

    // Dynamic camera roll into chase turns
    camera.rotation.z = -playerPos.x * 0.008
  })

  return null
}
