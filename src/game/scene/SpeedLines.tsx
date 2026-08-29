import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const LINE_COUNT = 36

interface SpeedLinesProps {
  paused?: boolean
}

/**
 * Aerodynamic flight speed streaks (white wind trails zooming past the aircraft).
 * Matches the reference dogfight game's high-speed sensation.
 */
export function SpeedLines({ paused = false }: SpeedLinesProps) {
  const linePoints = useMemo(() => {
    const lines: Array<{ origin: THREE.Vector3; speed: number; length: number }> = []
    for (let i = 0; i < LINE_COUNT; i++) {
      lines.push({
        origin: new THREE.Vector3(
          (Math.random() - 0.5) * 44,
          13 + Math.random() * 8,
          -80 + Math.random() * 120
        ),
        speed: 85 + Math.random() * 45,
        length: 8 + Math.random() * 12,
      })
    }
    return lines
  }, [])

  const linesRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (paused || !linesRef.current) return

    linesRef.current.children.forEach((child, i) => {
      const lineData = linePoints[i]
      child.position.z += lineData.speed * delta
      if (child.position.z > 30) {
        child.position.z = -100
        child.position.x = (Math.random() - 0.5) * 44
        child.position.y = 13 + Math.random() * 8
      }
    })
  })

  return (
    <group ref={linesRef}>
      {linePoints.map((l, i) => (
        <mesh key={i} position={l.origin.toArray()} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, l.length, 4]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}
