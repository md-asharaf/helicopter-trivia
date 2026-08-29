import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface CloudData {
  pos: THREE.Vector3
  scale: THREE.Vector3
  speed: number
  rotationY: number
}

interface CloudsProps {
  paused?: boolean
}

const CLOUD_COUNT = 16

function buildCloudFleet(): CloudData[] {
  const result: CloudData[] = []
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const seed = i / CLOUD_COUNT
    result.push({
      pos: new THREE.Vector3(
        (Math.sin(seed * 19.3) * 0.5) * 320,
        75 + (i % 5) * 12, // High altitude (75 - 125 units up)
        -240 + seed * 360
      ),
      scale: new THREE.Vector3(
        45 + (i % 4) * 20,
        3.5 + (i % 3) * 1.5,
        28 + (i % 3) * 14
      ),
      speed: 12 + (i % 4) * 4,
      rotationY: seed * Math.PI,
    })
  }
  return result
}

/**
 * High-Altitude Stratocumulus Clouds.
 * Drifts high in the sky (y: 75-125) with soft atmospheric translucency.
 * Freezes motion when paused.
 */
export function Clouds({ paused = false }: CloudsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clouds = useMemo(() => buildCloudFleet(), [])

  useFrame((_state, delta) => {
    if (paused) return
    if (!meshRef.current) return

    clouds.forEach((cloud, i) => {
      // Gentle stream along +Z
      cloud.pos.z += cloud.speed * delta

      // Wrap back to horizon
      if (cloud.pos.z > 140) {
        cloud.pos.z = -260
        cloud.pos.x = (Math.sin(i * 7.7) * 0.5) * 320
      }

      dummy.position.copy(cloud.pos)
      dummy.scale.copy(cloud.scale)
      dummy.rotation.set(0, cloud.rotationY, 0)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CLOUD_COUNT]}>
      <sphereGeometry args={[1.0, 12, 8]} />
      <meshStandardMaterial
        color="#f0f7fc"
        roughness={0.95}
        metalness={0.02}
        transparent
        opacity={0.32}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
