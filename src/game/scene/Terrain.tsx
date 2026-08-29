import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GAME_CONFIG } from '@/game/gameConfig'

const CHASE_SPEED = 28.0
const TREE_COUNT = 80

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
}

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

function getTerrainColor(normalized: number): [number, number, number] {
  if (normalized < 0.12) {
    // Alpine river channel
    return [0.08, 0.42, 0.62]
  }
  if (normalized < 0.24) {
    // Riverbed sand / gravel
    return [0.62, 0.58, 0.44]
  }
  if (normalized < 0.55) {
    // Lush green valley / forest meadows
    return [
      0.16 + (normalized - 0.24) * 0.15,
      0.48 + (normalized - 0.24) * 0.25,
      0.14 + (normalized - 0.24) * 0.10,
    ]
  }
  if (normalized < 0.8) {
    // Highland rocky slope
    return [
      0.38 + (normalized - 0.55) * 0.25,
      0.36 + (normalized - 0.55) * 0.20,
      0.30 + (normalized - 0.55) * 0.18,
    ]
  }
  // Snow-kissed mountain peaks
  return [0.85, 0.90, 0.94]
}

function buildTerrainData(size: number, subdivisions: number, maxHeight: number) {
  const geo = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const validTreePositions: TreeTransform[] = []

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const n = multiNoise(x, z)
    const height = n * maxHeight

    pos.setY(i, height)

    const normalized = height / maxHeight
    const [r, g, b] = getTerrainColor(normalized)
    colors.push(r, g, b)

    // Deterministic pseudo-random placement for trees based on coordinates
    const pseudoRand = Math.abs(Math.sin(x * 12.9898 + z * 78.233))
    if (
      normalized > 0.22 &&
      normalized < 0.65 &&
      Math.abs(x) > 6 &&
      validTreePositions.length < TREE_COUNT &&
      pseudoRand < 0.08
    ) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 0.7 + (pseudoRand * 10 % 1) * 0.6,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return { geometry: geo, treeTransforms: validTreePositions }
}

/**
 * Ultra-Realistic High-Speed Alpine Mountain Terrain, Water River & Streaming Forest.
 */
export function Terrain() {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const river1Ref = useRef<THREE.Mesh>(null)
  const river2Ref = useRef<THREE.Mesh>(null)
  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)

  const size = GAME_CONFIG.world.terrainSize
  const subdivisions = GAME_CONFIG.world.terrainSubdivisions
  const maxHeight = 16.0

  const { geometry, treeTransforms } = useMemo(
    () => buildTerrainData(size, subdivisions, maxHeight),
    [size, subdivisions, maxHeight]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (!mesh1Ref.current || !mesh2Ref.current) return

    mesh1Ref.current.position.z += CHASE_SPEED * delta
    mesh2Ref.current.position.z += CHASE_SPEED * delta

    if (river1Ref.current && river2Ref.current) {
      river1Ref.current.position.z = mesh1Ref.current.position.z
      river2Ref.current.position.z = mesh2Ref.current.position.z
    }

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

      {/* Specular Reflective Canyon River Tile 1 */}
      <mesh
        ref={river1Ref}
        position={[0, -2.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[26, size]} />
        <meshStandardMaterial
          color="#063d5c"
          roughness={0.08}
          metalness={0.92}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Specular Reflective Canyon River Tile 2 */}
      <mesh
        ref={river2Ref}
        position={[0, -2.6, -size]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[26, size]} />
        <meshStandardMaterial
          color="#063d5c"
          roughness={0.08}
          metalness={0.92}
          transparent
          opacity={0.92}
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
