import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GAME_CONFIG } from '@/game/gameConfig'

interface CloudData {
  position: THREE.Vector3
  scale: THREE.Vector3
  speed: number
  rotationY: number
}

/**
 * Fast-streaming instanced clouds for movie chase speed sensation.
 */
export function Clouds() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const clouds = useMemo<CloudData[]>(() => {
    return Array.from({ length: GAME_CONFIG.world.cloudCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 220,
        22 + Math.random() * 22,
        -180 + Math.random() * 260,
      ),
      scale: new THREE.Vector3(
        10 + Math.random() * 14,
        2.5 + Math.random() * 3.5,
        7 + Math.random() * 10,
      ),
      speed: 35 + Math.random() * 15,
      rotationY: Math.random() * Math.PI,
    }))
  }, [])

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    clouds.forEach((cloud, i) => {
      // Stream backward along +Z
      cloud.position.z += cloud.speed * delta

      // Wrap back to horizon
      if (cloud.position.z > 80) {
        cloud.position.z = -180
        cloud.position.x = (Math.random() - 0.5) * 220
      }

      dummy.position.copy(cloud.position)
      dummy.scale.copy(cloud.scale)
      dummy.rotation.y = cloud.rotationY
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GAME_CONFIG.world.cloudCount]}>
      <sphereGeometry args={[1.5, 6, 4]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={1}
        metalness={0}
        transparent
        opacity={0.80}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
