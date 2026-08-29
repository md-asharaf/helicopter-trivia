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

// Distant High-Altitude Fluffy Clouds (Far in the horizon, not in the player's face)
const CLOUD_CLUSTERS: CloudCluster[] = [
  { x: -110, y: 72, z: -360, scale: 26, speed: 3 },
  { x: 45, y: 78, z: -420, scale: 32, speed: 2.5 },
  { x: -160, y: 75, z: -380, scale: 28, speed: 2.8 },
  { x: 130, y: 70, z: -340, scale: 24, speed: 3.2 },
  { x: -20, y: 82, z: -450, scale: 34, speed: 2.2 },
  { x: 180, y: 74, z: -390, scale: 26, speed: 2.7 },
  { x: -70, y: 80, z: -430, scale: 30, speed: 2.4 },
]

/**
 * Distant High-Altitude Cumulus Clouds.
 * Soft, fluffy clouds placed high in the sky far on the horizon matching the reference dogfight screenshots.
 */
export function Clouds({ paused = false }: { paused?: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const clouds = useMemo(() => CLOUD_CLUSTERS.map((c) => ({ ...c })), [])

  useFrame((_state, delta) => {
    if (paused || !groupRef.current) return

    groupRef.current.children.forEach((child, i) => {
      const c = clouds[i]
      child.position.z += c.speed * delta
      if (child.position.z > -160) {
        child.position.z = -460
        child.position.x = (Math.random() - 0.5) * 320
      }
    })
  })

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale, c.scale * 0.40, c.scale * 0.70]}>
          {/* Main puffy center */}
          <mesh position={[0, 0, 0]}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading={true} />
          </mesh>
          {/* Left puff */}
          <mesh position={[-0.75, -0.1, 0.1]} scale={0.75}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.95} flatShading={true} />
          </mesh>
          {/* Right puff */}
          <mesh position={[0.75, -0.12, -0.1]} scale={0.72}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.95} flatShading={true} />
          </mesh>
          {/* Top puff */}
          <mesh position={[0.1, 0.38, 0]} scale={0.65}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading={true} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
