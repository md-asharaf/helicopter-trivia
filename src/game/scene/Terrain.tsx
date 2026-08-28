import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GAME_CONFIG } from '@/game/gameConfig'

const CHASE_SPEED = 28.0
const TREE_COUNT = 80

/**
 * Ultra-Realistic High-Speed Alpine Mountain Terrain & Streaming Forest.
 * Features rolling mountain ridges, river waterways, and instanced pine trees.
 */
export function Terrain() {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)

  const size = GAME_CONFIG.world.terrainSize
  const subdivisions = GAME_CONFIG.world.terrainSubdivisions
  const maxHeight = 16.0

  const { geometry, treeTransforms } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const colors: number[] = []

    function multiNoise(x: number, z: number): number {
      let val = 0
      val += Math.sin(x * 0.025 + 0.8) * Math.cos(z * 0.025 + 1.2) * 0.55
      val += Math.sin(x * 0.055 + 2.1) * Math.cos(z * 0.05 + 0.4) * 0.28
      val += Math.sin(x * 0.12 + 1.4) * Math.cos(z * 0.11 + 2.5) * 0.12
      val += Math.sin(x * 0.25 + 3.2) * Math.cos(z * 0.24 + 1.1) * 0.05

      // Canyon carve down the middle
      const riverDist = Math.abs(x) / 35.0
      const riverFactor = Math.min(1.0, riverDist)
      return ((val + 1) / 2) * (0.3 + 0.7 * riverFactor)
    }

    const validTreePositions: Array<{ x: number; y: number; z: number; scale: number }> = []

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const n = multiNoise(x, z)
      const height = n * maxHeight

      pos.setY(i, height)

      // Layered natural terrain coloring
      const normalized = height / maxHeight
      let r: number, g: number, b: number

      if (normalized < 0.12) {
        // Alpine river channel
        r = 0.08; g = 0.42; b = 0.62
      } else if (normalized < 0.24) {
        // Riverbed sand / gravel
        r = 0.62; g = 0.58; b = 0.44
      } else if (normalized < 0.55) {
        // Lush green valley / forest meadows
        r = 0.16 + (normalized - 0.24) * 0.15
        g = 0.48 + (normalized - 0.24) * 0.25
        b = 0.14 + (normalized - 0.24) * 0.10
      } else if (normalized < 0.8) {
        // Highland rocky slope
        r = 0.38 + (normalized - 0.55) * 0.25
        g = 0.36 + (normalized - 0.55) * 0.20
        b = 0.30 + (normalized - 0.55) * 0.18
      } else {
        // Snow-kissed mountain peaks
        r = 0.85; g = 0.90; b = 0.94
      }
      colors.push(r, g, b)

      // Collect tree spawn positions in valleys and mid-slopes
      if (
        normalized > 0.22 &&
        normalized < 0.65 &&
        Math.abs(x) > 6 &&
        validTreePositions.length < TREE_COUNT &&
        Math.random() < 0.08
      ) {
        validTreePositions.push({
          x,
          y: height,
          z,
          scale: 0.7 + Math.random() * 0.6,
        })
      }
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    return { geometry: geo, treeTransforms: validTreePositions }
  }, [size, subdivisions, maxHeight])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize tree instances on mount
  useMemo(() => {
    // We will set matrices in useFrame or on first render
  }, [])

  useFrame((_state, delta) => {
    if (!mesh1Ref.current || !mesh2Ref.current) return

    mesh1Ref.current.position.z += CHASE_SPEED * delta
    mesh2Ref.current.position.z += CHASE_SPEED * delta

    if (mesh1Ref.current.position.z >= size) {
      mesh1Ref.current.position.z = mesh2Ref.current.position.z - size
    }
    if (mesh2Ref.current.position.z >= size) {
      mesh2Ref.current.position.z = mesh1Ref.current.position.z - size
    }

    // Sync tree chunks with terrain chunks
    if (forest1Ref.current && forest2Ref.current) {
      forest1Ref.current.position.z = mesh1Ref.current.position.z
      forest2Ref.current.position.z = mesh2Ref.current.position.z

      // Set tree transforms once if needed
      treeTransforms.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z)
        dummy.scale.setScalar(t.scale)
        dummy.rotation.y = (i * 1.3) % (Math.PI * 2)
        dummy.updateMatrix()
        forest1Ref.current!.setMatrixAt(i, dummy.matrix)
        forest2Ref.current!.setMatrixAt(i, dummy.matrix)
      })
      forest1Ref.current.instanceMatrix.needsUpdate = true
      forest2Ref.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Tile 1: Alpine Terrain */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, -4, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.75}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* Tile 2: Alpine Terrain */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, -4, -size]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.75}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* Forest Trees Tile 1 */}
      <instancedMesh
        ref={forest1Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, -4, 0]}
        castShadow
      >
        <coneGeometry args={[1.2, 4.2, 5]} />
        <meshStandardMaterial color="#1a421b" roughness={0.9} />
      </instancedMesh>

      {/* Forest Trees Tile 2 */}
      <instancedMesh
        ref={forest2Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, -4, -size]}
        castShadow
      >
        <coneGeometry args={[1.2, 4.2, 5]} />
        <meshStandardMaterial color="#1a421b" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}
