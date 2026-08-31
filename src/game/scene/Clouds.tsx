import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface CloudCluster {
  x: number
  y: number
  z: number
  scale: number
  speed: number
}

// Distant & Mid-Altitude Fluffy Cumulus Cloud Clusters
const CLOUD_CLUSTERS: CloudCluster[] = [
  { x: -140, y: 78, z: -380, scale: 32, speed: 2.8 },
  { x: 50, y: 84, z: -430, scale: 38, speed: 2.2 },
  { x: -190, y: 80, z: -390, scale: 34, speed: 2.6 },
  { x: 150, y: 76, z: -360, scale: 30, speed: 3.0 },
  { x: -25, y: 88, z: -460, scale: 42, speed: 2.0 },
  { x: 200, y: 82, z: -410, scale: 32, speed: 2.5 },
  { x: -80, y: 86, z: -440, scale: 36, speed: 2.4 },
]

/**
 * Volumetric 3D Cumulus Clouds & Canyon Valley Mist (SKILL.md Law 1 & 3).
 * Realistic soft shading, layered puff geometries, and smooth horizon drift.
 */
export function Clouds({ paused = false }: { paused?: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const clouds = useMemo(() => CLOUD_CLUSTERS.map((c) => ({ ...c })), [])

  useFrame((_state, delta) => {
    if (paused || !groupRef.current) return
    const dt = Math.min(delta, 0.1)

    groupRef.current.children.forEach((child, i) => {
      const c = clouds[i]
      if (!c) return
      child.position.z += c.speed * dt
      if (child.position.z > -140) {
        child.position.z = -480
        child.position.x = (Math.random() - 0.5) * 360
      }
    })
  })

  return (
    <>
      {/* 1. Volumetric Cumulus Clouds Group */}
      <group ref={groupRef}>
        {clouds.map((c, i) => (
          <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale, c.scale * 0.42, c.scale * 0.75]}>
            {/* Main puffy center */}
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.96} flatShading />
            </mesh>
            {/* Left puff */}
            <mesh position={[-0.78, -0.1, 0.12]} scale={0.78}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.96} flatShading />
            </mesh>
            {/* Right puff */}
            <mesh position={[0.78, -0.12, -0.12]} scale={0.75}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.96} flatShading />
            </mesh>
            {/* Top high puff */}
            <mesh position={[0.1, 0.42, 0]} scale={0.68}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.96} flatShading />
            </mesh>
            {/* Forward soft puff */}
            <mesh position={[0.15, -0.15, 0.55]} scale={0.6}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.96} flatShading />
            </mesh>
          </group>
        ))}
      </group>

      {/* 2. Canyon River Mist Hover Layer (Separate sibling group) */}
      <CanyonRiverMist paused={paused} />
    </>
  )
}

function CanyonRiverMist({ paused }: { paused: boolean }) {
  const mistRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (paused || !mistRef.current) return
    const dt = Math.min(delta, 0.1)
    mistRef.current.children.forEach((child) => {
      child.position.z += 8 * dt
      if (child.position.z > 20) {
        child.position.z = -380
      }
    })
  })

  const mistPuffs = useMemo(
    () => [
      { x: -8, y: -9.5, z: -80, scale: [45, 3.5, 40] as [number, number, number] },
      { x: 12, y: -9.0, z: -180, scale: [55, 4.0, 45] as [number, number, number] },
      { x: -14, y: -9.2, z: -280, scale: [50, 3.8, 42] as [number, number, number] },
      { x: 6, y: -8.8, z: -370, scale: [60, 4.2, 50] as [number, number, number] },
    ],
    []
  )

  return (
    <group ref={mistRef}>
      {mistPuffs.map((m, i) => (
        <mesh key={i} position={[m.x, m.y, m.z]} scale={m.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#e0f2fe"
            transparent
            opacity={0.16}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
