import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const LINE_COUNT = 40

interface SpeedLinesProps {
  paused?: boolean
}

/**
 * Aerodynamic flight speed streaks (white wind trails zooming past the aircraft).
 * Cylinders are oriented horizontally along Z matching the reference screenshots.
 */
export function SpeedLines({ paused = false }: SpeedLinesProps) {
  const linePoints = useMemo(() => {
    const lines: Array<{ origin: THREE.Vector3; speed: number; length: number }> = []
    for (let i = 0; i < LINE_COUNT; i++) {
      lines.push({
        origin: new THREE.Vector3(
          (Math.random() - 0.5) * 48,
          13 + Math.random() * 8,
          -90 + Math.random() * 140
        ),
        speed: 95 + Math.random() * 50,
        length: 12 + Math.random() * 16,
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
      if (child.position.z > 35) {
        child.position.z = -110
        child.position.x = (Math.random() - 0.5) * 48
        child.position.y = 13 + Math.random() * 8
      }
    })
  })

  return (
    <group ref={linesRef}>
      {linePoints.map((l, i) => (
        <mesh key={i} position={l.origin.toArray()} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, l.length, 3]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.42}
          />
        </mesh>
      ))}
    </group>
  )
}
