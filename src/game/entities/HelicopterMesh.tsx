import { Component, Suspense, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three-stdlib'

interface HelicopterMeshProps {
  isPlayer?: boolean
  crashed?: boolean
}

function getEmissiveColor(isPlayer: boolean, crashed: boolean): string {
  if (crashed) return '#ff2200'
  return isPlayer ? '#003a4d' : '#4d2000'
}

function getPointLightColor(isPlayer: boolean, crashed: boolean): string {
  if (crashed) return '#ff2200'
  return isPlayer ? '#00e5ff' : '#ff8c00'
}

/**
 * Universal Asset URL resolver for GitHub Pages, custom domains, and local dev.
 */
function getAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL ?? ''

  // If Vite configured with full or subpath base like "/helicopter-trivia/"
  if (base && base !== './' && base !== '/') {
    const cleanBase = base.replace(/^\/+/, '').replace(/\/+$/, '')
    return `${window.location.origin}/${cleanBase}/${clean}`
  }

  // Derive from window.location for GitHub Pages sub-paths
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    // Ensure trailing slash on directory path
    const dir = path.endsWith('/') ? path : `${path.substring(0, path.lastIndexOf('/') + 1)}`
    const normalizedDir = dir === '' ? '/' : dir
    return `${window.location.origin}${normalizedDir}${clean}`
  }

  return `./${clean}`
}

/**
 * ErrorBoundary to prevent any uncaught asset loading errors from crashing the game
 */
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('3D Model loading error (using fallback):', error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * 3D Helicopter Mesh loader using FBX.
 */
export function HelicopterMesh({ isPlayer = false, crashed = false }: HelicopterMeshProps) {
  return (
    <ModelErrorBoundary fallback={<ProceduralHelicopterFallback isPlayer={isPlayer} />}>
      <Suspense fallback={<ProceduralHelicopterFallback isPlayer={isPlayer} />}>
        <FBXHelicopterModel isPlayer={isPlayer} crashed={crashed} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

function FBXHelicopterModel({ isPlayer, crashed }: { isPlayer: boolean; crashed: boolean }) {
  const modelUrl = getAssetUrl('models/helicopter/Helecopter.fbx')

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

    // 180 degree rotation on X axis
    clone.rotation.x = Math.PI

    // Automatically detect fuselage orientation and rotate forward facing -Z
    if (size.x > size.z) {
      clone.rotation.y = -Math.PI / 2
    } else {
      clone.rotation.y = Math.PI
    }

    const emissive = getEmissiveColor(isPlayer, crashed)
    const emissiveIntensity = crashed ? 2.5 : 0.4
    const hullColor = isPlayer ? '#0f2738' : '#2d1808'

    // Apply sleek PBR metallic military materials
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        mesh.material = new THREE.MeshStandardMaterial({
          color: hullColor,
          metalness: 0.85,
          roughness: 0.22,
          emissive,
          emissiveIntensity,
        })
      }
    })

    return clone
  }, [rawFbx, isPlayer, crashed])

  const lightColor = getPointLightColor(isPlayer, crashed)

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      <primitive object={cloned} />

      {/* Navigation & Engine Glow Point Light */}
      <pointLight
        color={lightColor}
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
