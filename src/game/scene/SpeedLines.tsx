import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const LINE_COUNT = 45

interface SpeedLinesProps {
  paused?: boolean
}

function createInitialSpeedLines() {
  const result = []
  for (let i = 0; i < LINE_COUNT; i++) {
    const pseudoX = Math.sin(i * 12.3) * 26
    const pseudoY = 12 + Math.abs(Math.cos(i * 7.7)) * 12
    const pseudoZ = -120 + ((i * 37) % 160)
    const pseudoSpeed = 110 + (i % 5) * 15
    const pseudoLen = 14 + (i % 6) * 3
    result.push({
      x: pseudoX,
      y: pseudoY,
      z: pseudoZ,
      speed: pseudoSpeed,
      length: pseudoLen,
    })
  }
  return result
}

/**
 * Aerodynamic high-speed flight streaks (SKILL.md Law 3).
 * Rendered using a single InstancedMesh for maximum GPU batching & 60+ FPS.
 */
export function SpeedLines({ paused = false }: SpeedLinesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const lineData = useRef(createInitialSpeedLines())
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (paused || !meshRef.current) return
    const dt = Math.min(delta, 0.1)
    const lines = lineData.current

    for (let i = 0; i < LINE_COUNT; i++) {
      const line = lines[i]
      line.z += line.speed * dt
      if (line.z > 35) {
        line.z = -120
        line.x = Math.sin((line.x + dt) * 15.3) * 26
        line.y = 12 + Math.abs(Math.cos(line.y * 3.7)) * 12
      }

      dummy.position.set(line.x, line.y, line.z)
      dummy.rotation.set(Math.PI / 2, 0, 0)
      dummy.scale.set(1, line.length, 1)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, LINE_COUNT]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.04, 0.04, 1, 4]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
