import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three-stdlib'

interface HelicopterMeshProps {
  isPlayer?: boolean
  crashed?: boolean
}

/**
 * 3D Helicopter Mesh loader using FBX.
 * Uses base-relative URL path for GitHub Pages and production sub-paths.
 */
export function HelicopterMesh({ isPlayer = false, crashed = false }: HelicopterMeshProps) {
  return (
    <Suspense fallback={<ProceduralHelicopterFallback isPlayer={isPlayer} />}>
      <FBXHelicopterModel isPlayer={isPlayer} crashed={crashed} />
    </Suspense>
  )
}

function FBXHelicopterModel({ isPlayer, crashed }: { isPlayer: boolean; crashed: boolean }) {
  // Resolve asset relative to Vite base URL (e.g. /helicopter-trivia/ on GitHub Pages)
  const baseUrl = (import.meta.env.BASE_URL ?? './').replace(/\/$/, '')
  const modelUrl = `${baseUrl}/models/helicopter/Helecopter.fbx`

  const rawFbx = useLoader(FBXLoader, modelUrl)
  const groupRef = useRef<THREE.Group>(null)

  const cloned = useMemo(() => {
    const clone = rawFbx.clone(true)

    // Calculate dimensions
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    // Standardize length to 5.6 units
    const targetScale = maxDim > 0 ? 5.6 / maxDim : 0.024
    clone.scale.setScalar(targetScale)

    // Center pivot point
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.set(
      -center.x * targetScale,
      -center.y * targetScale,
      -center.z * targetScale
    )

    // 180 degree rotation on X axis as requested
    clone.rotation.x = Math.PI

    // Automatically detect fuselage orientation and rotate forward facing -Z
    if (size.x > size.z) {
      clone.rotation.y = -Math.PI / 2
    } else {
      clone.rotation.y = Math.PI
    }

    // Apply sleek PBR metallic military materials
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        mesh.material = new THREE.MeshStandardMaterial({
          color: isPlayer ? '#0f2738' : '#2d1808',
          metalness: 0.85,
          roughness: 0.22,
          emissive: isPlayer
            ? (crashed ? '#ff2200' : '#003a4d')
            : (crashed ? '#ff2200' : '#4d2000'),
          emissiveIntensity: crashed ? 2.5 : 0.4,
        })
      }
    })

    return clone
  }, [rawFbx, isPlayer, crashed])

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      <primitive object={cloned} />

      {/* Navigation & Engine Glow Point Light */}
      <pointLight
        color={crashed ? '#ff2200' : (isPlayer ? '#00e5ff' : '#ff8c00')}
        intensity={crashed ? 3.5 : 1.6}
        distance={7}
        decay={2}
      />
    </group>
  )
}

function ProceduralHelicopterFallback({ isPlayer }: { isPlayer: boolean }) {
  const accentColor = isPlayer ? '#00e5ff' : '#ff8c00'
  const hullColor = isPlayer ? '#0d1f2d' : '#1a0d00'

  return (
    <group rotation={[Math.PI, 0, 0]}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 1.2, 3.8]} />
        <meshStandardMaterial color={hullColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.05, -1.5]}>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}
